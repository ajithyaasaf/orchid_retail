import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import prisma from '../lib/prisma';

const router = Router();

// PhonePe configuration (from env)
const PHONEPE_MERCHANT_ID = process.env.PHONEPE_MERCHANT_ID || 'MERCHANT_TEST';
const PHONEPE_SALT_KEY = process.env.PHONEPE_SALT_KEY || 'test_salt_key';
const PHONEPE_SALT_INDEX = process.env.PHONEPE_SALT_INDEX || '1';
const PHONEPE_BASE_URL = process.env.PHONEPE_BASE_URL || 'https://api-preprod.phonepe.com/apis/pg-sandbox';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// ─── POST /api/payments/initiate — Create PhonePe payment ────────────────────
router.post('/initiate', async (req: Request, res: Response) => {
  try {
    const { orderId } = req.body;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    if (order.paymentStatus === 'paid') {
      return res.status(400).json({ success: false, error: 'Order is already paid' });
    }

    const merchantTransactionId = `ORD_${order.id}_${Date.now()}`;

    // PhonePe payload
    const payload = {
      merchantId: PHONEPE_MERCHANT_ID,
      merchantTransactionId,
      merchantUserId: order.userId,
      amount: Math.round(order.total * 100), // In paise
      redirectUrl: `${FRONTEND_URL}/order-success?orderId=${order.id}`,
      redirectMode: 'REDIRECT',
      callbackUrl: `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/payments/webhook`,
      paymentInstrument: { type: 'PAY_PAGE' },
    };

    const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64');
    const checksum = crypto
      .createHash('sha256')
      .update(`${base64Payload}/pg/v1/pay${PHONEPE_SALT_KEY}`)
      .digest('hex');
    const xVerify = `${checksum}###${PHONEPE_SALT_INDEX}`;

    // In production, make actual API call to PhonePe
    // For now, store the transaction ID and return a redirect URL
    await prisma.order.update({
      where: { id: orderId },
      data: { merchantTransactionId },
    });

    // Simulated response for dev (in production, call PhonePe API)
    const redirectUrl = `${PHONEPE_BASE_URL}/pg/v1/pay`;

    res.json({
      success: true,
      data: {
        redirectUrl,
        merchantTransactionId,
        // Include these for frontend debugging only
        _dev: process.env.NODE_ENV === 'development' ? { base64Payload, xVerify } : undefined,
      },
    });
  } catch (error) {
    console.error('Error initiating payment:', error);
    res.status(500).json({ success: false, error: 'Failed to initiate payment' });
  }
});

// ─── POST /api/payments/webhook — PhonePe webhook callback ───────────────────
router.post('/webhook', async (req: Request, res: Response) => {
  try {
    const { response: encodedResponse } = req.body;

    if (!encodedResponse) {
      return res.status(400).json({ success: false, error: 'Missing response payload' });
    }

    // Verify checksum
    const checksum = crypto
      .createHash('sha256')
      .update(`${encodedResponse}${PHONEPE_SALT_KEY}`)
      .digest('hex');
    const expectedChecksum = `${checksum}###${PHONEPE_SALT_INDEX}`;
    const receivedChecksum = req.headers['x-verify'] as string;

    if (expectedChecksum !== receivedChecksum) {
      console.error('Checksum verification failed');
      return res.status(400).json({ success: false, error: 'Invalid checksum' });
    }

    // Decode response
    const decodedResponse = JSON.parse(Buffer.from(encodedResponse, 'base64').toString());
    const { merchantTransactionId, code, transactionId } = decodedResponse.data || decodedResponse;

    const order = await prisma.order.findFirst({
      where: { merchantTransactionId },
      include: { items: true },
    });

    if (!order) {
      console.error('Order not found for transaction:', merchantTransactionId);
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    if (code === 'PAYMENT_SUCCESS') {
      // Payment succeeded — deduct stock, update status
      await prisma.$transaction(async (tx) => {
        // Deduct stock for each item
        for (const item of order.items) {
          await tx.variant.update({
            where: { id: item.variantId },
            data: {
              stock: { decrement: item.quantity },
              reservedStock: { decrement: item.quantity },
            },
          });
        }

        // Update order
        await tx.order.update({
          where: { id: order.id },
          data: {
            paymentStatus: 'paid',
            orderStatus: 'confirmed',
            gatewayTransactionId: transactionId,
            stockDeducted: true,
            stockReserved: false,
          },
        });
      });
    } else {
      // Payment failed — release reserved stock
      await prisma.$transaction(async (tx) => {
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
            gatewayTransactionId: transactionId,
            stockReserved: false,
          },
        });
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ success: false, error: 'Webhook processing failed' });
  }
});

// ─── GET /api/payments/status/:merchantTransactionId — Check payment status ──
router.get('/status/:merchantTransactionId', async (req: Request, res: Response) => {
  try {
    const order = await prisma.order.findFirst({
      where: { merchantTransactionId: req.params.merchantTransactionId },
      select: { id: true, paymentStatus: true, orderStatus: true, orderNumber: true },
    });

    if (!order) {
      return res.status(404).json({ success: false, error: 'Transaction not found' });
    }

    res.json({ success: true, data: order });
  } catch (error) {
    console.error('Error checking payment status:', error);
    res.status(500).json({ success: false, error: 'Failed to check status' });
  }
});

export default router;
