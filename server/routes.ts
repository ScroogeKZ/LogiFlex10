import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertCargoSchema, insertBidSchema, insertRWSMetricSchema, updateUserProfileSchema, insertMessageSchema, insertNotificationSchema, insertETTNSchema } from "@shared/schema";
import { z } from "zod";
import { autoUpdateRWSOnBidAccepted, autoUpdateRWSOnTransactionComplete, updateUserRWS } from "./rws-calculator";
import { edsService } from "./eds-service";

export async function registerRoutes(app: Express): Promise<Server> {
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.patch('/api/auth/user/role', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const currentUser = await storage.getUser(userId);
      
      if (currentUser?.role !== "admin") {
        return res.status(403).json({ message: "Only administrators can change roles" });
      }
      
      const { targetUserId, role } = req.body;
      
      if (!["shipper", "carrier", "admin"].includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }
      
      const user = await storage.updateUserRole(targetUserId, role);
      res.json(user);
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "Failed to update user role" });
    }
  });

  app.patch('/api/auth/user/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const profileData = updateUserProfileSchema.parse(req.body);
      const user = await storage.updateUserProfile(userId, profileData);
      res.json(user);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid profile data", errors: error.errors });
      }
      console.error("Error updating user profile:", error);
      res.status(500).json({ message: "Failed to update user profile" });
    }
  });

  app.patch('/api/auth/user/change-role', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      const roleSchema = z.object({
        role: z.enum(["shipper", "carrier"])
      });
      
      const { role } = roleSchema.parse(req.body);
      
      const user = await storage.updateUserRole(userId, role);
      res.json(user);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid role data", errors: error.errors });
      }
      console.error("Error changing user role:", error);
      res.status(500).json({ message: "Failed to change user role" });
    }
  });

  // Cargo routes
  app.post('/api/cargo', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== "shipper" && user?.role !== "admin") {
        return res.status(403).json({ message: "Only shippers can create cargo listings" });
      }
      
      const cargoData = insertCargoSchema.parse(req.body);
      const cargo = await storage.createCargo(userId, cargoData);
      res.json(cargo);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid cargo data", errors: error.errors });
      }
      console.error("Error creating cargo:", error);
      res.status(500).json({ message: "Failed to create cargo" });
    }
  });

  app.get('/api/cargo', async (req, res) => {
    try {
      const { status, userId, companyId } = req.query;
      const cargo = await storage.listCargo({
        status: status as string,
        userId: userId as string,
        companyId: companyId as string,
      });
      res.json(cargo);
    } catch (error) {
      console.error("Error listing cargo:", error);
      res.status(500).json({ message: "Failed to list cargo" });
    }
  });

  app.get('/api/cargo/:id', async (req, res) => {
    try {
      const cargo = await storage.getCargo(req.params.id);
      if (!cargo) {
        return res.status(404).json({ message: "Cargo not found" });
      }
      res.json(cargo);
    } catch (error) {
      console.error("Error fetching cargo:", error);
      res.status(500).json({ message: "Failed to fetch cargo" });
    }
  });

  app.patch('/api/cargo/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const updates = req.body;
      const cargo = await storage.updateCargo(req.params.id, userId, updates);
      res.json(cargo);
    } catch (error) {
      console.error("Error updating cargo:", error);
      res.status(500).json({ message: "Failed to update cargo" });
    }
  });

  app.delete('/api/cargo/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await storage.deleteCargo(req.params.id, userId);
      res.json({ message: "Cargo deleted successfully" });
    } catch (error) {
      console.error("Error deleting cargo:", error);
      res.status(500).json({ message: "Failed to delete cargo" });
    }
  });

  // Bid routes
  app.post('/api/bids', isAuthenticated, async (req: any, res) => {
    try {
      const carrierId = req.user.claims.sub;
      const user = await storage.getUser(carrierId);
      
      if (user?.role !== "carrier" && user?.role !== "admin") {
        return res.status(403).json({ message: "Only carriers can place bids" });
      }
      
      const bidData = insertBidSchema.parse(req.body);
      const bid = await storage.createBid(carrierId, bidData);
      
      const cargo = await storage.getCargo(bidData.cargoId);
      if (cargo) {
        await storage.createNotification({
          userId: cargo.userId,
          type: "new_bid",
          title: "Новая ставка на ваш груз",
          message: `Перевозчик ${user?.companyName || user?.email} разместил ставку в размере ${bidData.bidAmount}₸`,
          link: `/cargo/${cargo.id}`,
        });
      }
      
      res.json(bid);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid bid data", errors: error.errors });
      }
      console.error("Error creating bid:", error);
      res.status(500).json({ message: "Failed to create bid" });
    }
  });

  app.get('/api/cargo/:cargoId/bids', isAuthenticated, async (req, res) => {
    try {
      const bids = await storage.listBidsForCargo(req.params.cargoId);
      res.json(bids);
    } catch (error) {
      console.error("Error listing bids:", error);
      res.status(500).json({ message: "Failed to list bids" });
    }
  });

  app.get('/api/bids/my-bids', isAuthenticated, async (req: any, res) => {
    try {
      const carrierId = req.user.claims.sub;
      const bids = await storage.listBidsByCarrier(carrierId);
      res.json(bids);
    } catch (error) {
      console.error("Error listing bids:", error);
      res.status(500).json({ message: "Failed to list bids" });
    }
  });

  app.patch('/api/bids/:id/status', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const { status } = req.body;
      
      if (!["pending", "accepted", "rejected"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      
      const bid = await storage.getBid(req.params.id);
      if (!bid) {
        return res.status(404).json({ message: "Bid not found" });
      }
      
      const cargo = await storage.getCargo(bid.cargoId);
      if (!cargo) {
        return res.status(404).json({ message: "Cargo not found" });
      }
      
      // Only cargo owner (shipper) or admin can accept/reject bids
      if (cargo.userId !== userId && user?.role !== "admin") {
        return res.status(403).json({ message: "Only cargo owner can accept or reject bids" });
      }
      
      if (status === "accepted") {
        const updatedBid = await storage.updateBidStatus(req.params.id, status);
        
        const transaction = await storage.createTransaction({
          cargoId: bid.cargoId,
          bidId: bid.id,
          shipperId: cargo.userId,
          carrierId: bid.carrierId,
          status: "created",
        });
        await storage.updateCargo(bid.cargoId, cargo.userId, { status: "in_progress" });
        
        await storage.createNotification({
          userId: bid.carrierId,
          type: "bid_accepted",
          title: "Ваша ставка принята!",
          message: `Ваша ставка на груз "${cargo.title}" была принята`,
          link: `/transactions/${transaction.id}`,
        });
        
        await autoUpdateRWSOnBidAccepted(req.params.id);
        
        res.json({ bid: updatedBid, transaction });
      } else {
        const updatedBid = await storage.updateBidStatus(req.params.id, status);
        
        if (status === "rejected") {
          await storage.createNotification({
            userId: bid.carrierId,
            type: "bid_rejected",
            title: "Ваша ставка отклонена",
            message: `Ваша ставка на груз "${cargo.title}" была отклонена`,
            link: `/cargo/${cargo.id}`,
          });
        }
        
        res.json(updatedBid);
      }
    } catch (error) {
      console.error("Error updating bid status:", error);
      res.status(500).json({ message: "Failed to update bid status" });
    }
  });

  // Transaction routes
  app.get('/api/transactions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const transactions = await storage.listTransactions(userId);
      res.json(transactions);
    } catch (error) {
      console.error("Error listing transactions:", error);
      res.status(500).json({ message: "Failed to list transactions" });
    }
  });

  app.get('/api/transactions/:id', isAuthenticated, async (req, res) => {
    try {
      const transaction = await storage.getTransaction(req.params.id);
      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }
      res.json(transaction);
    } catch (error) {
      console.error("Error fetching transaction:", error);
      res.status(500).json({ message: "Failed to fetch transaction" });
    }
  });

  app.patch('/api/transactions/:id/status', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const { status } = req.body;
      
      const transaction = await storage.getTransaction(req.params.id);
      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }
      
      // Only shipper, carrier involved in transaction, or admin can update status
      if (transaction.shipperId !== userId && 
          transaction.carrierId !== userId && 
          user?.role !== "admin") {
        return res.status(403).json({ message: "You don't have permission to update this transaction" });
      }
      
      const updatedTransaction = await storage.updateTransactionStatus(req.params.id, status);
      
      if (status === "confirmed") {
        const existingETTN = await storage.getETTNByTransaction(req.params.id);
        if (!existingETTN) {
          const cargo = await storage.getCargo(updatedTransaction.cargoId);
          if (cargo) {
            const ettn = await storage.createETTN({
              transactionId: req.params.id,
              cargoDescription: cargo.description || cargo.title,
              origin: cargo.origin,
              destination: cargo.destination,
              weight: cargo.weight,
              shipperId: updatedTransaction.shipperId,
              carrierId: updatedTransaction.carrierId,
              status: "pending_signature",
            });
            
            await storage.createNotification({
              userId: updatedTransaction.shipperId === userId ? updatedTransaction.carrierId : updatedTransaction.shipperId,
              type: "status_update",
              title: "Создана е-ТТН",
              message: `Автоматически создана электронная товарно-транспортная накладная ${ettn.ettnNumber}`,
              link: `/transactions/${req.params.id}`,
            });
          }
        }
      }
      
      if (status === "completed") {
        const cargo = await storage.getCargo(updatedTransaction.cargoId);
        if (cargo) {
          await storage.updateCargo(cargo.id, cargo.userId, { status: "completed" });
        }
        
        await autoUpdateRWSOnTransactionComplete(req.params.id);
      }
      
      res.json(updatedTransaction);
    } catch (error) {
      console.error("Error updating transaction status:", error);
      res.status(500).json({ message: "Failed to update transaction status" });
    }
  });

  // RWS routes
  app.post('/api/rws', isAuthenticated, async (req: any, res) => {
    try {
      const metricData = insertRWSMetricSchema.parse(req.body);
      const metric = await storage.createRWSMetric(metricData);
      
      const newScore = await storage.calculateUserRWS(metricData.userId);
      
      res.json({ metric, rwsScore: newScore });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid metric data", errors: error.errors });
      }
      console.error("Error creating RWS metric:", error);
      res.status(500).json({ message: "Failed to create RWS metric" });
    }
  });

  app.get('/api/rws/:userId', async (req, res) => {
    try {
      const metrics = await storage.getRWSMetricsForUser(req.params.userId);
      const user = await storage.getUser(req.params.userId);
      res.json({ metrics, rwsScore: user?.rwsScore || 0 });
    } catch (error) {
      console.error("Error fetching RWS metrics:", error);
      res.status(500).json({ message: "Failed to fetch RWS metrics" });
    }
  });

  app.get('/api/rws/:userId/extended', isAuthenticated, async (req, res) => {
    try {
      const user = await storage.getUser(req.params.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const metrics = await storage.getRWSMetricsForUser(req.params.userId);
      
      res.json({
        rwsScore: user.rwsScore || 0,
        otdRate: parseFloat(user.otdRate || "0"),
        acceptanceRate: parseFloat(user.acceptanceRate || "0"),
        reliabilityScore: parseFloat(user.reliabilityScore || "0"),
        totalTransactions: user.totalTransactions || 0,
        onTimeDeliveries: user.onTimeDeliveries || 0,
        lateDeliveries: user.lateDeliveries || 0,
        totalBids: user.totalBids || 0,
        acceptedBids: user.acceptedBids || 0,
        isRecommended: user.isRecommended || false,
        ratings: metrics,
      });
    } catch (error) {
      console.error("Error fetching extended RWS metrics:", error);
      res.status(500).json({ message: "Failed to fetch extended RWS metrics" });
    }
  });

  // Analytics routes
  app.get('/api/analytics/dashboard', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      const allCargo = await storage.listCargo({ userId });
      const activeCargo = allCargo.filter(c => c.status === "active");
      const inProgressCargo = allCargo.filter(c => c.status === "in_progress");
      const completedCargo = allCargo.filter(c => c.status === "completed");
      
      const transactions = await storage.listTransactions(userId);
      
      let totalBids = 0;
      if (user?.role === "carrier") {
        const myBids = await storage.listBidsByCarrier(userId);
        totalBids = myBids.length;
      } else if (user?.role === "shipper") {
        for (const cargo of allCargo) {
          const bids = await storage.listBidsForCargo(cargo.id);
          totalBids += bids.length;
        }
      }
      
      res.json({
        activeCargo: activeCargo.length,
        inProgressCargo: inProgressCargo.length,
        completedCargo: completedCargo.length,
        totalBids,
        totalTransactions: transactions.length,
        rwsScore: user?.rwsScore || 0,
      });
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // Message routes
  app.post('/api/messages', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const messageData = insertMessageSchema.parse(req.body);
      
      const transaction = await storage.getTransaction(messageData.transactionId);
      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }
      
      if (transaction.shipperId !== userId && transaction.carrierId !== userId) {
        return res.status(403).json({ message: "Not authorized to send messages in this transaction" });
      }
      
      const message = await storage.createMessage(userId, messageData);
      res.json(message);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid message data", errors: error.errors });
      }
      console.error("Error creating message:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  app.get('/api/messages/:transactionId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const transaction = await storage.getTransaction(req.params.transactionId);
      
      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }
      
      if (transaction.shipperId !== userId && transaction.carrierId !== userId) {
        return res.status(403).json({ message: "Not authorized to view messages in this transaction" });
      }
      
      const messages = await storage.getMessages(req.params.transactionId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  // Notification routes
  app.get('/api/notifications', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const notifications = await storage.getNotifications(userId);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.patch('/api/notifications/:id/read', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const notification = await storage.markNotificationAsRead(req.params.id, userId);
      res.json(notification);
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  app.patch('/api/notifications/read-all', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await storage.markAllNotificationsAsRead(userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      res.status(500).json({ message: "Failed to mark all notifications as read" });
    }
  });

  app.delete('/api/notifications/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await storage.deleteNotification(req.params.id, userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting notification:", error);
      res.status(500).json({ message: "Failed to delete notification" });
    }
  });

  // E-TTN routes
  app.post('/api/ettn', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { transactionId } = req.body;
      
      if (!transactionId) {
        return res.status(400).json({ message: "Transaction ID is required" });
      }
      
      const transaction = await storage.getTransaction(transactionId);
      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }
      
      if (transaction.shipperId !== userId && transaction.carrierId !== userId) {
        return res.status(403).json({ message: "Not authorized to create E-TTN for this transaction" });
      }
      
      const existingETTN = await storage.getETTNByTransaction(transactionId);
      if (existingETTN) {
        return res.status(400).json({ message: "E-TTN already exists for this transaction" });
      }
      
      const cargo = await storage.getCargo(transaction.cargoId);
      if (!cargo) {
        return res.status(404).json({ message: "Cargo not found" });
      }
      
      const ettnDataFromTransaction = {
        transactionId,
        cargoDescription: cargo.description || cargo.title,
        origin: cargo.origin,
        destination: cargo.destination,
        weight: cargo.weight,
        shipperId: transaction.shipperId,
        carrierId: transaction.carrierId,
        status: "pending_signature" as const,
      };
      
      const ettn = await storage.createETTN(ettnDataFromTransaction);
      
      await storage.createNotification({
        userId: transaction.shipperId === userId ? transaction.carrierId : transaction.shipperId,
        type: "status_update",
        title: "Создана е-ТТН",
        message: `Создана электронная товарно-транспортная накладная ${ettn.ettnNumber}`,
        link: `/transactions/${transactionId}`,
      });
      
      res.json(ettn);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid E-TTN data", errors: error.errors });
      }
      console.error("Error creating E-TTN:", error);
      res.status(500).json({ message: "Failed to create E-TTN" });
    }
  });

  app.get('/api/ettn/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const ettn = await storage.getETTN(req.params.id);
      
      if (!ettn) {
        return res.status(404).json({ message: "E-TTN not found" });
      }
      
      if (ettn.shipperId !== userId && ettn.carrierId !== userId) {
        return res.status(403).json({ message: "Not authorized to view this E-TTN" });
      }
      
      res.json(ettn);
    } catch (error) {
      console.error("Error fetching E-TTN:", error);
      res.status(500).json({ message: "Failed to fetch E-TTN" });
    }
  });

  app.get('/api/transactions/:id/ettn', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const transaction = await storage.getTransaction(req.params.id);
      
      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }
      
      if (transaction.shipperId !== userId && transaction.carrierId !== userId) {
        return res.status(403).json({ message: "Not authorized to view E-TTN for this transaction" });
      }
      
      const ettn = await storage.getETTNByTransaction(req.params.id);
      if (!ettn) {
        return res.status(404).json({ message: "E-TTN not found for this transaction" });
      }
      
      res.json(ettn);
    } catch (error) {
      console.error("Error fetching E-TTN:", error);
      res.status(500).json({ message: "Failed to fetch E-TTN" });
    }
  });

  app.patch('/api/ettn/:id/sign', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const ettn = await storage.getETTN(req.params.id);
      
      if (!ettn) {
        return res.status(404).json({ message: "E-TTN not found" });
      }
      
      if (ettn.shipperId !== userId && ettn.carrierId !== userId) {
        return res.status(403).json({ message: "Not authorized to sign this E-TTN" });
      }
      
      if (ettn.shipperId === userId && ettn.shipperSignature) {
        return res.status(400).json({ message: "Shipper has already signed this E-TTN" });
      }
      
      if (ettn.carrierId === userId && ettn.carrierSignature) {
        return res.status(400).json({ message: "Carrier has already signed this E-TTN" });
      }
      
      let certificateId = user?.edsCertId;
      if (!certificateId) {
        const mockCert = edsService.generateMockCertificate(
          userId,
          `${user?.firstName} ${user?.lastName}`,
          user?.iin || "",
          user?.bin || undefined
        );
        certificateId = mockCert.id;
        
        await storage.updateUserProfile(userId, {});
      }
      
      const documentData = JSON.stringify({
        ettnNumber: ettn.ettnNumber,
        transactionId: ettn.transactionId,
        cargo: ettn.cargoDescription,
        route: `${ettn.origin} -> ${ettn.destination}`,
        weight: ettn.weight,
      });
      
      const signatureResult = await edsService.signDocument(documentData, certificateId);
      
      const updatedETTN = await storage.signETTN(
        req.params.id,
        userId,
        signatureResult.signature,
        certificateId
      );
      
      if (updatedETTN.status === "fully_signed") {
        await storage.updateTransactionStatus(ettn.transactionId, "in_transit");
        
        await storage.createNotification({
          userId: ettn.shipperId === userId ? ettn.carrierId : ettn.shipperId,
          type: "status_update",
          title: "E-TTN Fully Signed",
          message: `E-TTN ${ettn.ettnNumber} has been fully signed and the shipment is now in transit`,
          link: `/transactions/${ettn.transactionId}`,
        });
      }
      
      res.json(updatedETTN);
    } catch (error) {
      console.error("Error signing E-TTN:", error);
      res.status(500).json({ message: "Failed to sign E-TTN" });
    }
  });

  app.get('/api/ettn/:id/signatures', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const ettn = await storage.getETTN(req.params.id);
      
      if (!ettn) {
        return res.status(404).json({ message: "E-TTN not found" });
      }
      
      if (ettn.shipperId !== userId && ettn.carrierId !== userId) {
        return res.status(403).json({ message: "Not authorized to view signatures for this E-TTN" });
      }
      
      const signatures = await storage.getSignaturesForETTN(req.params.id);
      res.json(signatures);
    } catch (error) {
      console.error("Error fetching signatures:", error);
      res.status(500).json({ message: "Failed to fetch signatures" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}