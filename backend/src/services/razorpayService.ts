import Razorpay from 'razorpay';
import crypto from 'crypto';

// ─── Razorpay Service ────────────────────────────────────────────────────────
// Encapsulates all Razorpay SDK interactions. Keeps route handlers thin.

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID!;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET!;
const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET!;

if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
  console.warn('⚠️  Razorpay keys missing — payment endpoints will fail');
}

const razorpay = new Razorpay({
  key_id: RAZORPAY_KEY_ID,
  key_secret: RAZORPAY_KEY_SECRET,
});

export interface RazorpayOrderOptions {
  amountInPaise: number;     // Total amount in paise (₹1 = 100 paise)
  receipt: string;           // Our internal order number / ID
  currency?: string;
  notes?: Record<string, string>;
}

export interface RazorpayOrderResult {
  id: string;                // Razorpay order ID (order_xxx)
  amount: number;
  currency: string;
  receipt: string;
  status: string;
}

export const razorpayService = {
  /**
   * Create a Razorpay order. This must be called BEFORE opening the checkout popup.
   * The `amountInPaise` is always recomputed server-side — never trust the client.
   */
  createOrder: async (options: RazorpayOrderOptions): Promise<RazorpayOrderResult> => {
    const order = await razorpay.orders.create({
      amount: options.amountInPaise,
      currency: options.currency || 'INR',
      receipt: options.receipt,
      notes: options.notes || {},
    });

    return {
      id: order.id,
      amount: order.amount as number,
      currency: order.currency,
      receipt: order.receipt as string,
      status: order.status,
    };
  },

  /**
   * Verify the payment signature from the Razorpay checkout popup.
   * This MUST succeed before updating any order or stock.
   *
   * Razorpay signature = HMAC-SHA256(razorpayOrderId + "|" + razorpayPaymentId, key_secret)
   */
  verifyPaymentSignature: (params: {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
  }): boolean => {
    const body = `${params.razorpayOrderId}|${params.razorpayPaymentId}`;
    const expectedSignature = crypto
      .createHmac('sha256', RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    return expectedSignature === params.razorpaySignature;
  },

  /**
   * Verify webhook signature.
   * Razorpay signs webhooks with HMAC-SHA256(body, webhook_secret).
   */
  verifyWebhookSignature: (body: string, signature: string): boolean => {
    if (!RAZORPAY_WEBHOOK_SECRET) return false;

    const expectedSignature = crypto
      .createHmac('sha256', RAZORPAY_WEBHOOK_SECRET)
      .update(body)
      .digest('hex');

    return expectedSignature === signature;
  },

  /**
   * Fetch a payment by ID from Razorpay (for reconciliation / status checks).
   */
  fetchPayment: async (paymentId: string) => {
    return razorpay.payments.fetch(paymentId);
  },

  /**
   * Returns the public key ID for the frontend checkout popup.
   */
  getKeyId: (): string => {
    return RAZORPAY_KEY_ID;
  },
};
