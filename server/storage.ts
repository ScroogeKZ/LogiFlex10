import {
  users,
  cargo,
  bids,
  transactions,
  rwsMetrics,
  messages,
  notifications,
  sessions,
  ettn,
  digitalSignatures,
  type User,
  type UpsertUser,
  type UpdateUserProfile,
  type Cargo,
  type InsertCargo,
  type Bid,
  type InsertBid,
  type Transaction,
  type InsertTransaction,
  type RWSMetric,
  type InsertRWSMetric,
  type Message,
  type InsertMessage,
  type Notification,
  type InsertNotification,
  type ETTN,
  type InsertETTN,
  type DigitalSignature,
  type InsertDigitalSignature,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserRole(id: string, role: "shipper" | "carrier" | "admin"): Promise<User>;
  updateUserProfile(id: string, profile: UpdateUserProfile): Promise<User>;
  
  // Cargo operations
  createCargo(userId: string, cargo: InsertCargo): Promise<Cargo>;
  getCargo(id: string): Promise<Cargo | undefined>;
  listCargo(filters?: { status?: string; userId?: string; companyId?: string }): Promise<Cargo[]>;
  updateCargo(id: string, userId: string, updates: Partial<InsertCargo>): Promise<Cargo>;
  deleteCargo(id: string, userId: string): Promise<void>;
  
  // Bid operations
  createBid(carrierId: string, bid: InsertBid): Promise<Bid>;
  getBid(id: string): Promise<Bid | undefined>;
  listBidsForCargo(cargoId: string): Promise<Bid[]>;
  listBidsByCarrier(carrierId: string): Promise<Bid[]>;
  updateBidStatus(id: string, status: "pending" | "accepted" | "rejected"): Promise<Bid>;
  
  // Transaction operations
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  getTransaction(id: string): Promise<Transaction | undefined>;
  listTransactions(userId: string): Promise<Transaction[]>;
  updateTransactionStatus(id: string, status: string): Promise<Transaction>;
  
  // RWS operations
  createRWSMetric(metric: InsertRWSMetric): Promise<RWSMetric>;
  getRWSMetricsForUser(userId: string): Promise<RWSMetric[]>;
  calculateUserRWS(userId: string): Promise<number>;
  
  // Message operations
  createMessage(senderId: string, message: InsertMessage): Promise<Message>;
  getMessages(transactionId: string): Promise<Message[]>;
  
  // Notification operations
  createNotification(notification: InsertNotification): Promise<Notification>;
  getNotifications(userId: string): Promise<Notification[]>;
  markNotificationAsRead(id: string, userId: string): Promise<Notification>;
  markAllNotificationsAsRead(userId: string): Promise<void>;
  deleteNotification(id: string, userId: string): Promise<void>;
  
  // E-TTN operations
  createETTN(ettnData: InsertETTN): Promise<ETTN>;
  getETTN(id: string): Promise<ETTN | undefined>;
  getETTNByTransaction(transactionId: string): Promise<ETTN | undefined>;
  signETTN(id: string, userId: string, signatureData: string, certificateId: string): Promise<ETTN>;
  updateETTNStatus(id: string, status: "draft" | "pending_signature" | "partially_signed" | "fully_signed" | "completed"): Promise<ETTN>;
  
  // Digital Signature operations
  createDigitalSignature(signature: InsertDigitalSignature): Promise<DigitalSignature>;
  getSignaturesForETTN(ettnId: string): Promise<DigitalSignature[]>;
  validateSignature(id: string): Promise<boolean>;
  
  // Session operations
  getSession(sid: string): Promise<any | undefined>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUserRole(id: string, role: "shipper" | "carrier" | "admin"): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async updateUserProfile(id: string, profile: UpdateUserProfile): Promise<User> {
    let companyId: string | undefined = undefined;
    
    if (profile.bin) {
      companyId = profile.bin;
    } else if (profile.iin) {
      companyId = profile.iin;
    }
    
    const [user] = await db
      .update(users)
      .set({ 
        ...profile, 
        companyId,
        updatedAt: new Date() 
      })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  // Cargo operations
  async createCargo(userId: string, cargoData: InsertCargo): Promise<Cargo> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error("User not found");
    }
    if (!user.companyId) {
      throw new Error("User must have a company ID to create cargo");
    }
    const [newCargo] = await db
      .insert(cargo)
      .values({ ...cargoData, userId, companyId: user.companyId })
      .returning();
    return newCargo;
  }

  async getCargo(id: string): Promise<Cargo | undefined> {
    const [cargoItem] = await db.select().from(cargo).where(eq(cargo.id, id));
    return cargoItem;
  }

  async listCargo(filters?: { status?: string; userId?: string; companyId?: string }): Promise<Cargo[]> {
    const conditions = [];
    
    if (filters?.status) {
      conditions.push(eq(cargo.status, filters.status as any));
    }
    
    if (filters?.userId) {
      conditions.push(eq(cargo.userId, filters.userId));
    }
    
    if (filters?.companyId) {
      conditions.push(eq(cargo.companyId, filters.companyId));
    }
    
    if (conditions.length > 0) {
      return await db
        .select()
        .from(cargo)
        .where(and(...conditions))
        .orderBy(desc(cargo.createdAt));
    }
    
    return await db.select().from(cargo).orderBy(desc(cargo.createdAt));
  }

  async updateCargo(id: string, userId: string, updates: Partial<InsertCargo>): Promise<Cargo> {
    const [updated] = await db
      .update(cargo)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(cargo.id, id), eq(cargo.userId, userId)))
      .returning();
    
    if (!updated) {
      throw new Error("Cargo not found or unauthorized");
    }
    
    return updated;
  }

  async deleteCargo(id: string, userId: string): Promise<void> {
    const result = await db
      .delete(cargo)
      .where(and(eq(cargo.id, id), eq(cargo.userId, userId)))
      .returning();
    
    if (result.length === 0) {
      throw new Error("Cargo not found or unauthorized");
    }
  }

  // Bid operations
  async createBid(carrierId: string, bidData: InsertBid): Promise<Bid> {
    const [newBid] = await db
      .insert(bids)
      .values({ ...bidData, carrierId })
      .returning();
    return newBid;
  }

  async getBid(id: string): Promise<Bid | undefined> {
    const [bid] = await db.select().from(bids).where(eq(bids.id, id));
    return bid;
  }

  async listBidsForCargo(cargoId: string): Promise<Bid[]> {
    return await db
      .select()
      .from(bids)
      .where(eq(bids.cargoId, cargoId))
      .orderBy(desc(bids.createdAt));
  }

  async listBidsByCarrier(carrierId: string): Promise<Bid[]> {
    return await db
      .select()
      .from(bids)
      .where(eq(bids.carrierId, carrierId))
      .orderBy(desc(bids.createdAt));
  }

  async updateBidStatus(id: string, status: "pending" | "accepted" | "rejected"): Promise<Bid> {
    const [updated] = await db
      .update(bids)
      .set({ status, updatedAt: new Date() })
      .where(eq(bids.id, id))
      .returning();
    return updated;
  }

  // Transaction operations
  async createTransaction(transactionData: InsertTransaction): Promise<Transaction> {
    const [newTransaction] = await db
      .insert(transactions)
      .values(transactionData)
      .returning();
    return newTransaction;
  }

  async getTransaction(id: string): Promise<Transaction | undefined> {
    const [transaction] = await db.select().from(transactions).where(eq(transactions.id, id));
    return transaction;
  }

  async listTransactions(userId: string): Promise<Transaction[]> {
    return await db
      .select()
      .from(transactions)
      .where(
        sql`${transactions.shipperId} = ${userId} OR ${transactions.carrierId} = ${userId}`
      )
      .orderBy(desc(transactions.createdAt));
  }

  async updateTransactionStatus(id: string, status: string): Promise<Transaction> {
    const updates: any = { 
      status: status as any, 
      updatedAt: new Date(),
    };
    
    if (status === "completed") {
      updates.completedAt = new Date();
    }
    
    const [updated] = await db
      .update(transactions)
      .set(updates)
      .where(eq(transactions.id, id))
      .returning();
    return updated;
  }

  // RWS operations
  async createRWSMetric(metricData: InsertRWSMetric): Promise<RWSMetric> {
    const [newMetric] = await db
      .insert(rwsMetrics)
      .values(metricData)
      .returning();
    return newMetric;
  }

  async getRWSMetricsForUser(userId: string): Promise<RWSMetric[]> {
    return await db
      .select()
      .from(rwsMetrics)
      .where(eq(rwsMetrics.userId, userId))
      .orderBy(desc(rwsMetrics.createdAt));
  }

  async calculateUserRWS(userId: string): Promise<number> {
    const metrics = await this.getRWSMetricsForUser(userId);
    
    if (metrics.length === 0) {
      return 0;
    }
    
    const totalScore = metrics.reduce((sum, metric) => sum + metric.overallScore, 0);
    const averageScore = Math.round(totalScore / metrics.length);
    
    await db
      .update(users)
      .set({ rwsScore: averageScore, updatedAt: new Date() })
      .where(eq(users.id, userId));
    
    return averageScore;
  }

  // Message operations
  async createMessage(senderId: string, messageData: InsertMessage): Promise<Message> {
    const [newMessage] = await db
      .insert(messages)
      .values({ ...messageData, senderId })
      .returning();
    return newMessage;
  }

  async getMessages(transactionId: string): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(eq(messages.transactionId, transactionId))
      .orderBy(messages.createdAt);
  }

  // Notification operations
  async createNotification(notificationData: InsertNotification): Promise<Notification> {
    const [newNotification] = await db
      .insert(notifications)
      .values(notificationData)
      .returning();
    return newNotification;
  }

  async getNotifications(userId: string): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
  }

  async markNotificationAsRead(id: string, userId: string): Promise<Notification> {
    const [notification] = await db
      .update(notifications)
      .set({ isRead: true })
      .where(and(eq(notifications.id, id), eq(notifications.userId, userId)))
      .returning();
    return notification;
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.userId, userId));
  }

  async deleteNotification(id: string, userId: string): Promise<void> {
    await db
      .delete(notifications)
      .where(and(eq(notifications.id, id), eq(notifications.userId, userId)));
  }

  // E-TTN operations
  async createETTN(ettnData: InsertETTN): Promise<ETTN> {
    const ettnNumber = `ETTN-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    
    const [newETTN] = await db
      .insert(ettn)
      .values({ 
        ...ettnData, 
        ettnNumber,
        status: "pending_signature"
      })
      .returning();
    return newETTN;
  }

  async getETTN(id: string): Promise<ETTN | undefined> {
    const [ettnRecord] = await db
      .select()
      .from(ettn)
      .where(eq(ettn.id, id));
    return ettnRecord;
  }

  async getETTNByTransaction(transactionId: string): Promise<ETTN | undefined> {
    const [ettnRecord] = await db
      .select()
      .from(ettn)
      .where(eq(ettn.transactionId, transactionId));
    return ettnRecord;
  }

  async signETTN(id: string, userId: string, signatureData: string, certificateId: string): Promise<ETTN> {
    const ettnRecord = await this.getETTN(id);
    if (!ettnRecord) {
      throw new Error("E-TTN not found");
    }

    const updates: any = { updatedAt: new Date() };
    const currentDate = new Date();

    if (ettnRecord.shipperId === userId && !ettnRecord.shipperSignature) {
      updates.shipperSignature = signatureData;
      updates.shipperSignedAt = currentDate;
      
      await this.createDigitalSignature({
        ettnId: id,
        userId,
        signatureData,
        certificateId,
        isValid: true,
        metadata: { role: "shipper" },
      });
    } else if (ettnRecord.carrierId === userId && !ettnRecord.carrierSignature) {
      updates.carrierSignature = signatureData;
      updates.carrierSignedAt = currentDate;
      
      await this.createDigitalSignature({
        ettnId: id,
        userId,
        signatureData,
        certificateId,
        isValid: true,
        metadata: { role: "carrier" },
      });
    }

    const hasShipperSig = updates.shipperSignature || ettnRecord.shipperSignature;
    const hasCarrierSig = updates.carrierSignature || ettnRecord.carrierSignature;

    if (hasShipperSig && hasCarrierSig) {
      updates.status = "fully_signed";
      
      await this.createNotification({
        userId: ettnRecord.shipperId === userId ? ettnRecord.carrierId : ettnRecord.shipperId,
        type: "status_update",
        title: "е-ТТН полностью подписана",
        message: `Электронная товарно-транспортная накладная ${ettnRecord.ettnNumber} подписана обеими сторонами`,
        link: `/transactions/${ettnRecord.transactionId}`,
      });
      
      await this.updateTransactionStatus(ettnRecord.transactionId, "in_transit");
    } else if (hasShipperSig || hasCarrierSig) {
      updates.status = "partially_signed";
    }

    const [updatedETTN] = await db
      .update(ettn)
      .set(updates)
      .where(eq(ettn.id, id))
      .returning();

    return updatedETTN;
  }

  async updateETTNStatus(id: string, status: "draft" | "pending_signature" | "partially_signed" | "fully_signed" | "completed"): Promise<ETTN> {
    const [updatedETTN] = await db
      .update(ettn)
      .set({ status, updatedAt: new Date() })
      .where(eq(ettn.id, id))
      .returning();
    return updatedETTN;
  }

  // Digital Signature operations
  async createDigitalSignature(signatureData: InsertDigitalSignature): Promise<DigitalSignature> {
    const [newSignature] = await db
      .insert(digitalSignatures)
      .values(signatureData)
      .returning();
    return newSignature;
  }

  async getSignaturesForETTN(ettnId: string): Promise<DigitalSignature[]> {
    return await db
      .select()
      .from(digitalSignatures)
      .where(eq(digitalSignatures.ettnId, ettnId))
      .orderBy(digitalSignatures.signedAt);
  }

  async validateSignature(id: string): Promise<boolean> {
    const [signature] = await db
      .select()
      .from(digitalSignatures)
      .where(eq(digitalSignatures.id, id));
    
    if (!signature) return false;
    
    if (signature.certificateExpiry && signature.certificateExpiry < new Date()) {
      await db
        .update(digitalSignatures)
        .set({ isValid: false })
        .where(eq(digitalSignatures.id, id));
      return false;
    }
    
    return signature.isValid ?? false;
  }
  
  // Session operations
  async getSession(sid: string): Promise<any | undefined> {
    const [session] = await db
      .select()
      .from(sessions)
      .where(eq(sessions.sid, sid));
    return session?.sess;
  }
}

export const storage = new DatabaseStorage();