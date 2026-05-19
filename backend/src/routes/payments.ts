import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { razorpayService } from '../services/razorpayService';

const router = Router();

// ─── POST /api/payments/create-order — Create Razorpay order ─────────────────
// Called by frontend AFTER our DB order is created. Returns Razorpay order ID
// for the checkout popup.
router.post('/create-order', async (req: Request, res: Response) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({ success: false, error: 'Missing orderId' });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    // Idempotency: if we already have a Razorpay order ID, return it
    if (order.razorpayOrderId) {
      return res.json({
        success: true,
        data: {
          razorpayOrderId: order.razorpayOrderId,
          amount: Math.round(order.total * 100),
          currency: 'INR',
          keyId: razorpayService.getKeyId(),
        },
      });
    }

    if (order.paymentStatus === 'paid') {
      return res.status(400).json({ success: false, error: 'Order is already paid' });
    }

    // CRITICAL: Amount is always computed server-side from our DB — never trust client
    const amountInPaise = Math.round(order.total * 100);

    const razorpayOrder = await razorpayService.createOrder({
      amountInPaise,
      receipt: order.orderNumber,
      notes: {
        orderId: order.id,
        orderNumber: order.orderNumber,
      },
    });

    // Store the Razorpay order ID on our order
    await prisma.order.update({
      where: { id: orderId },
      data: {
        razorpayOrderId: razorpayOrder.id,
        paymentMethod: 'razorpay',
      },
    });

    res.json({
      success: true,
      data: {
        razorpayOrderId: razorpayOrder.id,
        amount: amountInPaise,
        currency: razorpayOrder.currency,
        keyId: razorpayService.getKeyId(),
      },
    });
  } catch (error) {
    console.error('[Payment] Error creating Razorpay order:', error);
    res.status(500).json({ success: false, error: 'Failed to create payment order' });
  }
});

// ─── POST /api/payments/verify — Verify payment after checkout popup ─────────
// Called by frontend immediately after Razorpay popup success callback.
// Verifies HMAC signature, then updates order + deducts stock atomically.
router.post('/verify', async (req: Request, res: Response) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, orderId } = req.body;

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature || !orderId) {
      return res.status(400).json({ success: false, error: 'Missing payment verification fields' });
    }

    // Step 1: Verify signature BEFORE any DB writes
    const isValid = razorpayService.verifyPaymentSignature({
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    });

    if (!isValid) {
      console.error('[Payment] Signature verification failed for order:', orderId);
      return res.status(400).json({ success: false, error: 'Payment verification failed' });
    }

    // Step 2: Load order
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    // Idempotency guard: skip if already paid (webhook may have arrived first)
    if (order.paymentStatus === 'paid') {
      return res.json({ success: true, data: { orderId: order.id, status: 'already_paid' } });
    }

    // Step 3: Atomic stock deduction + order update
    const statusResult = await prisma.$transaction(async (tx) => {
      // Re-fetch order inside transaction to lock it and prevent concurrent double stock-deduction
      const freshOrder = await tx.order.findUnique({
        where: { id: orderId },
        select: { paymentStatus: true }
      });

      if (!freshOrder) {
        throw new Error('Order not found');
      }

      if (freshOrder.paymentStatus === 'paid') {
        return 'already_paid';
      }

      for (const item of order.items) {
        await tx.variant.update({
          where: { id: item.variantId },
          data: {
            stock: { decrement: item.quantity },
            reservedStock: { decrement: item.quantity },
          },
        });
      }

      await tx.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: 'paid',
          orderStatus: 'confirmed',
          razorpayPaymentId,
          razorpaySignature,
          stockDeducted: true,
          stockReserved: false,
        },
      });

      return 'paid';
    });

    res.json({ success: true, data: { orderId: order.id, status: statusResult } });
  } catch (error) {
    console.error('[Payment] Error verifying payment:', error);
    res.status(500).json({ success: false, error: 'Payment verification failed' });
  }
});

// ─── POST /api/payments/webhook — Razorpay webhook (server-to-server) ────────
// Backup reconciliation. Handles `payment.captured` and `payment.failed`.
// Both this and /verify are idempotent — whichever arrives first wins.
router.post('/webhook', async (req: Request, res: Response) => {
  try {
    const signature = req.headers['x-razorpay-signature'] as string;
    const rawBody = JSON.stringify(req.body);

    // Verify webhook signature
    if (!signature || !razorpayService.verifyWebhookSignature(rawBody, signature)) {
      console.error('[Webhook] Signature verification failed');
      return res.status(400).json({ success: false });
    }

    const event = req.body.event;
    const payload = req.body.payload?.payment?.entity;

    if (!payload) {
      return res.status(200).json({ success: true }); // Acknowledge unknown events
    }

    const razorpayOrderId = payload.order_id;
    const razorpayPaymentId = payload.id;

    const order = await prisma.order.findFirst({
      where: { razorpayOrderId },
      include: { items: true },
    });

    if (!order) {
      console.warn('[Webhook] Order not found for razorpayOrderId:', razorpayOrderId);
      return res.status(200).json({ success: true }); // Acknowledge but ignore
    }

    if (event === 'payment.captured') {
      // Skip if already paid (verify endpoint handled it first)
      if (order.paymentStatus === 'paid') {
        return res.status(200).json({ success: true });
      }

      await prisma.$transaction(async (tx) => {
        // Re-fetch order inside transaction to prevent race conditions
        const freshOrder = await tx.order.findUnique({
          where: { id: order.id },
          select: { paymentStatus: true }
        });

        if (!freshOrder || freshOrder.paymentStatus === 'paid') {
          return; // Already marked paid
        }

        for (const item of order.items) {
          await tx.variant.update({
            where: { id: item.variantId },
            data: {
              stock: { decrement: item.quantity },
              reservedStock: { decrement: item.quantity },
            },
          });
        }

        await tx.order.update({
          where: { id: order.id },
          data: {
            paymentStatus: 'paid',
            orderStatus: 'confirmed',
            razorpayPaymentId,
            stockDeducted: true,
            stockReserved: false,
          },
        });
      });
    } else if (event === 'payment.failed') {
      // Release reserved stock
      if (order.paymentStatus !== 'paid') {
        await prisma.$transaction(async (tx) => {
          // Re-fetch order inside transaction to prevent race conditions
          const freshOrder = await tx.order.findUnique({
            where: { id: order.id },
            select: { paymentStatus: true, stockReserved: true }
          });

          if (!freshOrder || freshOrder.paymentStatus === 'paid' || freshOrder.paymentStatus === 'failed' || !freshOrder.stockReserved) {
            return; // Already paid, already failed, or stock already released
          }

          for (const item of order.items) {
            await tx.variant.update({
              where: { id: item.variantId },
              data: { reservedStock: { decrement: item.quantity } },
            });
          }

          await tx.order.update({
            where: { id: order.id },
            data: {
              paymentStatus: 'failed',
              orderStatus: 'cancelled',
              razorpayPaymentId,
              stockReserved: false,
            },
          });
        });
      }
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('[Webhook] Error processing webhook:', error);
    res.status(500).json({ success: false });
  }
});

// ─── GET /api/payments/status/:orderId — Check payment status ────────────────
router.get('/status/:orderId', async (req: Request, res: Response) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.orderId },
      select: {
        id: true,
        orderNumber: true,
        paymentStatus: true,
        orderStatus: true,
        total: true,
        razorpayOrderId: true,
        razorpayPaymentId: true,
      },
    });

    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    res.json({ success: true, data: order });
  } catch (error) {
    console.error('[Payment] Error checking payment status:', error);
    res.status(500).json({ success: false, error: 'Failed to check status' });
  }
});

// ─── GET /api/payments/key — Return public Razorpay key for frontend ─────────
router.get('/key', (_req: Request, res: Response) => {
  res.json({ success: true, data: { keyId: razorpayService.getKeyId() } });
});

export default router;
