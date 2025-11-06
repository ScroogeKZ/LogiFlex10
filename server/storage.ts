import {
  users,
  cargo,
  bids,
  transactions,
  rwsMetrics,
  messages,
  notifications,
  sessions,
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