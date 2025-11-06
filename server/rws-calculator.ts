import { db } from "./db";
import { users, transactions, bids, rwsMetrics, cargo } from "@shared/schema";
import { eq, and, sql } from "drizzle-orm";

export interface RWSMetrics {
  otdRate: number;
  acceptanceRate: number;
  reliabilityScore: number;
  totalTransactions: number;
  onTimeDeliveries: number;
  lateDeliveries: number;
  totalBids: number;
  acceptedBids: number;
  isRecommended: boolean;
  rwsScore: number;
}

export async function calculateUserRWS(userId: string): Promise<RWSMetrics> {
  const completedTransactions = await db
    .select({
      transaction: transactions,
      cargo: cargo,
    })
    .from(transactions)
    .leftJoin(cargo, eq(transactions.cargoId, cargo.id))
    .where(
      and(
        eq(transactions.status, "completed"),
        sql`${transactions.carrierId} = ${userId} OR ${transactions.shipperId} = ${userId}`
      )
    );

  const userBids = await db
    .select()
    .from(bids)
    .where(eq(bids.carrierId, userId));

  const acceptedBidsCount = userBids.filter(
    (b) => b.status === "accepted"
  ).length;

  let onTimeCount = 0;
  let lateCount = 0;
  let transactionsWithTimestamps = 0;

  for (const { transaction, cargo: cargoData } of completedTransactions) {
    if (cargoData?.deliveryDate && transaction.completedAt) {
      transactionsWithTimestamps++;
      const expectedDelivery = new Date(cargoData.deliveryDate);
      const actualDelivery = new Date(transaction.completedAt);

      if (actualDelivery <= expectedDelivery) {
        onTimeCount++;
      } else {
        lateCount++;
      }
    }
  }

  const totalTransactions = completedTransactions.length;
  const totalBids = userBids.length;

  const otdRate = transactionsWithTimestamps > 0 
    ? (onTimeCount / transactionsWithTimestamps) * 100 
    : 0;

  const acceptanceRate = totalBids > 0 
    ? (acceptedBidsCount / totalBids) * 100 
    : 0;

  const userRatings = await db
    .select()
    .from(rwsMetrics)
    .where(eq(rwsMetrics.userId, userId));

  const avgRating = userRatings.length > 0
    ? userRatings.reduce((sum, r) => sum + r.overallScore, 0) / userRatings.length
    : 0;

  const reliabilityScore = (
    (otdRate * 0.4) +
    (acceptanceRate * 0.3) +
    (avgRating * 20 * 0.3)
  );

  const rwsScore = Math.round(reliabilityScore);

  const isRecommended = 
    totalTransactions >= 5 &&
    otdRate >= 85 &&
    acceptanceRate >= 70 &&
    avgRating >= 4.0;

  return {
    otdRate: Math.round(otdRate * 100) / 100,
    acceptanceRate: Math.round(acceptanceRate * 100) / 100,
    reliabilityScore: Math.round(reliabilityScore * 100) / 100,
    totalTransactions,
    onTimeDeliveries: onTimeCount,
    lateDeliveries: lateCount,
    totalBids,
    acceptedBids: acceptedBidsCount,
    isRecommended,
    rwsScore,
  };
}

export async function updateUserRWS(userId: string): Promise<void> {
  const metrics = await calculateUserRWS(userId);

  await db
    .update(users)
    .set({
      rwsScore: metrics.rwsScore,
      otdRate: metrics.otdRate.toString(),
      acceptanceRate: metrics.acceptanceRate.toString(),
      reliabilityScore: metrics.reliabilityScore.toString(),
      totalTransactions: metrics.totalTransactions,
      onTimeDeliveries: metrics.onTimeDeliveries,
      lateDeliveries: metrics.lateDeliveries,
      totalBids: metrics.totalBids,
      acceptedBids: metrics.acceptedBids,
      isRecommended: metrics.isRecommended,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));
}

export async function autoUpdateRWSOnTransactionComplete(
  transactionId: string
): Promise<void> {
  const transaction = await db
    .select()
    .from(transactions)
    .where(eq(transactions.id, transactionId))
    .limit(1);

  if (transaction.length === 0 || transaction[0].status !== "completed") {
    return;
  }

  const { shipperId, carrierId } = transaction[0];

  await updateUserRWS(shipperId);
  await updateUserRWS(carrierId);
}

export async function autoUpdateRWSOnBidAccepted(bidId: string): Promise<void> {
  const bid = await db
    .select()
    .from(bids)
    .where(eq(bids.id, bidId))
    .limit(1);

  if (bid.length === 0 || bid[0].status !== "accepted") {
    return;
  }

  await updateUserRWS(bid[0].carrierId);
}
