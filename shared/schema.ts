import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  decimal,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table with role-based access
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role", { enum: ["shipper", "carrier", "admin"] }).notNull().default("shipper"),
  companyId: varchar("company_id"),
  companyName: varchar("company_name"),
  phone: varchar("phone"),
  bin: varchar("bin", { length: 12 }),
  iin: varchar("iin", { length: 12 }),
  isVerified: boolean("is_verified").default(false),
  edsCertId: varchar("eds_cert_id"),
  edsCertExpiry: timestamp("eds_cert_expiry"),
  rwsScore: integer("rws_score").default(0),
  otdRate: decimal("otd_rate", { precision: 5, scale: 2 }).default("0"),
  acceptanceRate: decimal("acceptance_rate", { precision: 5, scale: 2 }).default("0"),
  reliabilityScore: decimal("reliability_score", { precision: 5, scale: 2 }).default("0"),
  totalTransactions: integer("total_transactions").default(0),
  onTimeDeliveries: integer("on_time_deliveries").default(0),
  lateDeliveries: integer("late_deliveries").default(0),
  totalBids: integer("total_bids").default(0),
  acceptedBids: integer("accepted_bids").default(0),
  isRecommended: boolean("is_recommended").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export const updateUserProfileSchema = createInsertSchema(users).pick({
  firstName: true,
  lastName: true,
  companyName: true,
  phone: true,
  bin: true,
  iin: true,
}).extend({
  bin: z.string().optional().transform(val => val === "" ? undefined : val).pipe(
    z.string().length(12, "БИН должен содержать 12 цифр").regex(/^\d{12}$/, "БИН должен содержать только цифры").optional()
  ),
  iin: z.string().optional().transform(val => val === "" ? undefined : val).pipe(
    z.string().length(12, "ИИН должен содержать 12 цифр").regex(/^\d{12}$/, "ИИН должен содержать только цифры").optional()
  ),
  phone: z.string().optional().transform(val => val === "" ? undefined : val).pipe(
    z.string().regex(/^\+?[0-9]{10,15}$/, "Неверный формат телефона").optional()
  ),
});

export type UpdateUserProfile = z.infer<typeof updateUserProfileSchema>;

// Cargo listings
export const cargo = pgTable("cargo", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  companyId: varchar("company_id"),
  title: text("title").notNull(),
  description: text("description"),
  category: varchar("category").notNull(),
  origin: varchar("origin").notNull(),
  destination: varchar("destination").notNull(),
  weight: decimal("weight", { precision: 10, scale: 2 }).notNull(),
  price: decimal("price", { precision: 12, scale: 2 }).notNull(),
  pickupDate: timestamp("pickup_date").notNull(),
  deliveryDate: timestamp("delivery_date"),
  auctionEndDate: timestamp("auction_end_date"),
  status: varchar("status", { enum: ["active", "in_progress", "completed", "cancelled"] }).notNull().default("active"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertCargoSchema = createInsertSchema(cargo).omit({
  id: true,
  userId: true,
  companyId: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertCargo = z.infer<typeof insertCargoSchema>;
export type Cargo = typeof cargo.$inferSelect;

// Bids on cargo
export const bids = pgTable("bids", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  cargoId: varchar("cargo_id").notNull().references(() => cargo.id),
  carrierId: varchar("carrier_id").notNull().references(() => users.id),
  bidAmount: decimal("bid_amount", { precision: 12, scale: 2 }).notNull(),
  deliveryTime: varchar("delivery_time").notNull(),
  vehicleType: varchar("vehicle_type").notNull(),
  message: text("message"),
  status: varchar("status", { enum: ["pending", "accepted", "rejected"] }).notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertBidSchema = createInsertSchema(bids).omit({
  id: true,
  carrierId: true,
  status: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertBid = z.infer<typeof insertBidSchema>;
export type Bid = typeof bids.$inferSelect;

// Transactions tracking deal lifecycle
export const transactions = pgTable("transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  cargoId: varchar("cargo_id").notNull().references(() => cargo.id),
  bidId: varchar("bid_id").notNull().references(() => bids.id),
  shipperId: varchar("shipper_id").notNull().references(() => users.id),
  carrierId: varchar("carrier_id").notNull().references(() => users.id),
  status: varchar("status", { 
    enum: ["created", "confirmed", "in_transit", "delivered", "completed", "disputed"] 
  }).notNull().default("created"),
  pickupConfirmed: boolean("pickup_confirmed").default(false),
  deliveryConfirmed: boolean("delivery_confirmed").default(false),
  edsSignature: text("eds_signature"),
  eInvoiceNumber: varchar("e_invoice_number"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  completedAt: true,
});

export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;

// RWS Quality Metrics
export const rwsMetrics = pgTable("rws_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  transactionId: varchar("transaction_id").notNull().references(() => transactions.id),
  onTimeDelivery: integer("on_time_delivery").notNull(),
  cargoCondition: integer("cargo_condition").notNull(),
  communication: integer("communication").notNull(),
  documentation: integer("documentation").notNull(),
  overallScore: integer("overall_score").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertRWSMetricSchema = createInsertSchema(rwsMetrics).omit({
  id: true,
  createdAt: true,
});

export type InsertRWSMetric = z.infer<typeof insertRWSMetricSchema>;
export type RWSMetric = typeof rwsMetrics.$inferSelect;

// Messages for transaction chat
export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  transactionId: varchar("transaction_id").notNull().references(() => transactions.id),
  senderId: varchar("sender_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  senderId: true,
  createdAt: true,
});

export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;

// Notifications for in-app alerts
export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  type: varchar("type", { 
    enum: ["new_bid", "bid_accepted", "bid_rejected", "status_update", "new_message", "auction_ending"] 
  }).notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  link: varchar("link"),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  isRead: true,
  createdAt: true,
});

export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;

// E-TTN (Electronic Transport and Transit Note) for Kazakhstan compliance
export const ettn = pgTable("ettn", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  transactionId: varchar("transaction_id").notNull().references(() => transactions.id),
  ettnNumber: varchar("ettn_number").unique().notNull(),
  cargoDescription: text("cargo_description").notNull(),
  origin: varchar("origin").notNull(),
  destination: varchar("destination").notNull(),
  weight: decimal("weight", { precision: 10, scale: 2 }).notNull(),
  shipperId: varchar("shipper_id").notNull().references(() => users.id),
  carrierId: varchar("carrier_id").notNull().references(() => users.id),
  shipperSignature: text("shipper_signature"),
  carrierSignature: text("carrier_signature"),
  shipperSignedAt: timestamp("shipper_signed_at"),
  carrierSignedAt: timestamp("carrier_signed_at"),
  status: varchar("status", { 
    enum: ["draft", "pending_signature", "partially_signed", "fully_signed", "completed"] 
  }).notNull().default("draft"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertETTNSchema = createInsertSchema(ettn).omit({
  id: true,
  ettnNumber: true,
  shipperSignature: true,
  carrierSignature: true,
  shipperSignedAt: true,
  carrierSignedAt: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertETTN = z.infer<typeof insertETTNSchema>;
export type ETTN = typeof ettn.$inferSelect;

// Digital Signatures for E-TTN and documents
export const digitalSignatures = pgTable("digital_signatures", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ettnId: varchar("ettn_id").notNull().references(() => ettn.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  signatureData: text("signature_data").notNull(),
  certificateId: varchar("certificate_id").notNull(),
  certificateExpiry: timestamp("certificate_expiry"),
  signedAt: timestamp("signed_at").defaultNow(),
  isValid: boolean("is_valid").default(true),
  metadata: jsonb("metadata"),
});

export const insertDigitalSignatureSchema = createInsertSchema(digitalSignatures).omit({
  id: true,
  signedAt: true,
});

export type InsertDigitalSignature = z.infer<typeof insertDigitalSignatureSchema>;
export type DigitalSignature = typeof digitalSignatures.$inferSelect;