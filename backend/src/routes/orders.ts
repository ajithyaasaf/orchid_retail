import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';

const router = Router();

// ─── POST /api/orders/create ──────────────────────────────────────────────────
// Creates an order + reserves stock atomically.
// The deliveryCharge must be sent from the frontend (user's selected method).
// Server validates it falls within allowed values — never blindly trusts it.
router.post('/create', async (req: Request, res: Response) => {
  try {
    const { userId, items, shippingAddressId, couponCode, deliveryOption } = req.body;

    if (!items?.length || !shippingAddressId || !userId) {
      return res.status(400).json({ success: false, error: 'Missing required fields: items, shippingAddressId, userId' });
    }

    // Validate address belongs to this user
    const address = await prisma.address.findFirst({
      where: { id: shippingAddressId, userId },
    });
    if (!address) {
      return res.status(400).json({ success: false, error: 'Invalid shipping address' });
    }

    const result = await prisma.$transaction(async (tx) => {
      // ── Step 1: Validate variants & compute subtotal ──────────────────────
      const orderItems = [];
      let subtotal = 0;

      for (const item of items) {
        if (!item.variantId || !item.quantity || item.quantity < 1) {
          throw new Error('Invalid item in cart');
        }

        const variant = await tx.variant.findUnique({
          where: { id: item.variantId },
          include: { product: { select: { name: true, images: true, isActive: true } } },
        });

        if (!variant || !variant.isActive || !variant.product.isActive) {
          throw new Error(`"${variant?.product?.name || 'A product'}" is no longer available`);
        }

        const available = variant.stock - variant.reservedStock;
        if (item.quantity > available) {
          throw new Error(
            `Only ${available} unit(s) available for ${variant.product.name} (${variant.size}/${variant.color})`
          );
        }

        const lineTotal = variant.price * item.quantity;
        subtotal += lineTotal;

        orderItems.push({
          productId: variant.productId,
          variantId: variant.id,
          productName: variant.product.name,
          productImage: variant.product.images[0] || '',
          variantSize: variant.size,
          variantColor: variant.color,
          sku: variant.sku,
          price: variant.price,
          mrp: variant.mrp,
          quantity: item.quantity,
          lineTotal,
        });

        // Reserve stock immediately
        await tx.variant.update({
          where: { id: variant.id },
          data: { reservedStock: { increment: item.quantity } },
        });
      }

      // ── Step 2: Compute delivery charge server-side ───────────────────────
      // Allowed values: 0 (free for orders ≥999), 79 (standard), 149 (express)
      // The server recomputes based on subtotal + deliveryOption — never trusts raw client value.
      const STANDARD_CHARGE = subtotal >= 999 ? 0 : 79;
      const EXPRESS_CHARGE = 149;
      const deliveryCharge = deliveryOption === 'express' ? EXPRESS_CHARGE : STANDARD_CHARGE;

      // ── Step 3: Apply coupon with per-user validation ─────────────────────
      let discount = 0;
      let couponId: string | undefined;
      let appliedCouponCode: string | undefined;

      if (couponCode) {
        const upperCode = couponCode.toUpperCase().trim();
        const coupon = await tx.coupon.findUnique({ where: { code: upperCode } });

        if (!coupon) {
          throw new Error(`Coupon "${upperCode}" does not exist`);
        }
        if (!coupon.isActive) {
          throw new Error(`Coupon "${upperCode}" is no longer active`);
        }
        const now = new Date();
        if (now < coupon.validFrom || now > coupon.validUntil) {
          throw new Error(`Coupon "${upperCode}" has expired`);
        }
        if (coupon.minOrder && subtotal < coupon.minOrder) {
          throw new Error(`Minimum order of ₹${coupon.minOrder} required for this coupon`);
        }
        // Global usage limit
        if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
          throw new Error(`Coupon "${upperCode}" usage limit has been reached`);
        }
        // Per-user limit: check CouponUsage table
        const alreadyUsed = await tx.couponUsage.findUnique({
          where: { couponId_userId: { couponId: coupon.id, userId } },
        });
        if (alreadyUsed) {
          throw new Error(`You have already used coupon "${upperCode}"`);
        }

        discount =
          coupon.type === 'flat'
            ? Math.min(coupon.value, subtotal) // Never discount more than subtotal
            : Math.min((subtotal * coupon.value) / 100, coupon.maxDiscount ?? Infinity);

        discount = Math.round(discount * 100) / 100; // Round to 2 decimal places
        couponId = coupon.id;
        appliedCouponCode = upperCode;
      }

      const total = Math.max(0, subtotal - discount + deliveryCharge);

      // ── Step 4: Generate order number ─────────────────────────────────────
      // Using count + 1 is race-safe inside a transaction
      const orderCount = await tx.order.count();
      const orderNumber = `ORD-${new Date().getFullYear()}-${String(orderCount + 1).padStart(6, '0')}`;

      // ── Step 5: Create order ──────────────────────────────────────────────
      const order = await tx.order.create({
        data: {
          orderNumber,
          userId,
          subtotal,
          discount,
          deliveryCharge,
          total,
          couponId,
          couponCode: appliedCouponCode,
          orderStatus: 'pending',
          paymentStatus: 'pending',
          paymentMethod: 'razorpay',
          stockReserved: true,
          stockDeducted: false,
          shippingAddressId,
          items: { create: orderItems },
        },
        include: { items: true, shippingAddress: true },
      });

      // ── Step 6: Record coupon usage ───────────────────────────────────────
      if (couponId) {
        await tx.coupon.update({
          where: { id: couponId },
          data: { usedCount: { increment: 1 } },
        });
        await tx.couponUsage.create({
          data: { couponId, userId, orderId: order.id },
        });
      }

      return order;
    });

    res.status(201).json({ success: true, data: result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create order';
    console.error('Error creating order:', error);
    res.status(400).json({ success: false, error: message });
  }
});

// ─── GET /api/orders/:id ──────────────────────────────────────────────────────
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: { items: true, shippingAddress: true },
    });
    if (!order) return res.status(404).json({ success: false, error: 'Order not found' });
    res.json({ success: true, data: order });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch order' });
  }
});

// ─── GET /api/orders/user/:userId ────────────────────────────────────────────
router.get('/user/:userId', async (req: Request, res: Response) => {
  try {
    const orders = await prisma.order.findMany({
      where: { userId: req.params.userId },
      include: { items: true, shippingAddress: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: orders });
  } catch (error) {
    console.error('Error fetching user orders:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch orders' });
  }
});

export default router;
