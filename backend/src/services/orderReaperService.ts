import prisma from '../lib/prisma';

/**
 * ORCHID RETAIL — ORDER REAPER SERVICE
 * 
 * Periodically sweeps uncompleted/abandoned checkout orders that have been pending
 * past the expiration threshold (default: 15 minutes).
 * 
 * Atomically releases reserved inventory back to available stock, restores
 * coupon usage limits, and marks the abandoned orders as cancelled.
 */

const ORDER_EXPIRATION_MINUTES = 15;
let isReaping = false;

export async function reapExpiredOrders(): Promise<number> {
  if (isReaping) {
    return 0; // Prevent overlapping runs
  }

  isReaping = true;
  try {
    const expirationThreshold = new Date(Date.now() - ORDER_EXPIRATION_MINUTES * 60 * 1000);

    // Find all orders that are still pending payment past the expiration window
    const expiredOrders = await prisma.order.findMany({
      where: {
        paymentStatus: 'pending',
        orderStatus: 'pending',
        stockReserved: true,
        createdAt: { lt: expirationThreshold },
      },
      include: {
        items: true,
      },
      take: 50, // Batch size to limit transaction duration
    });

    if (expiredOrders.length === 0) {
      return 0;
    }

    console.log(`[OrderReaper] Found ${expiredOrders.length} expired pending order(s) to reclaim.`);

    for (const order of expiredOrders) {
      try {
        await prisma.$transaction(async (tx) => {
          // Re-fetch inside transaction to avoid race conditions with webhook or user completion
          const currentOrder = await tx.order.findUnique({
            where: { id: order.id },
            select: { paymentStatus: true, stockReserved: true, couponId: true, userId: true },
          });

          if (!currentOrder || currentOrder.paymentStatus !== 'pending' || !currentOrder.stockReserved) {
            return; // Order was paid or already handled
          }

          // Step 1: Release reserved stock back to the active inventory pool
          for (const item of order.items) {
            await tx.variant.update({
              where: { id: item.variantId },
              data: {
                reservedStock: { decrement: item.quantity },
              },
            });
          }

          // Step 2: Release coupon if used so customer can reuse it
          if (currentOrder.couponId) {
            await tx.couponUsage.deleteMany({
              where: {
                couponId: currentOrder.couponId,
                userId: currentOrder.userId,
              },
            });
            await tx.coupon.update({
              where: { id: currentOrder.couponId },
              data: { usedCount: { decrement: 1 } },
            });
          }

          // Step 3: Mark order cancelled and release hold
          await tx.order.update({
            where: { id: order.id },
            data: {
              orderStatus: 'cancelled',
              paymentStatus: 'failed',
              stockReserved: false,
            },
          });
        });

        console.log(`[OrderReaper] Successfully reclaimed stock for expired order: ${order.orderNumber}`);
      } catch (orderError) {
        console.error(`[OrderReaper] Error reclaiming order ${order.id}:`, orderError);
      }
    }

    return expiredOrders.length;
  } catch (error) {
    console.error('[OrderReaper] Fatal error during reap cycle:', error);
    return 0;
  } finally {
    isReaping = false;
  }
}

/**
 * Starts the order reaper background interval.
 * Runs every `intervalMs` (default: 60 seconds).
 */
export function startOrderReaper(intervalMs: number = 60000): NodeJS.Timeout {
  console.log(`[OrderReaper] Background stock reaper initialized (TTL: ${ORDER_EXPIRATION_MINUTES}m, Interval: ${intervalMs / 1000}s)`);
  
  // Initial run after brief startup delay
  setTimeout(() => {
    reapExpiredOrders().catch(err => console.error('[OrderReaper] Initial cycle error:', err));
  }, 5000);

  return setInterval(() => {
    reapExpiredOrders().catch(err => console.error('[OrderReaper] Periodic cycle error:', err));
  }, intervalMs);
}
