import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';

const router = Router();

// ─── POST /api/orders/create — Create order + reserve stock ──────────────────
router.post('/create', async (req: Request, res: Response) => {
  try {
    const { userId, items, shippingAddressId, couponCode } = req.body;

    if (!items?.length || !shippingAddressId) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    // Validate address
    const address = await prisma.address.findFirst({
      where: { id: shippingAddressId },
    });
    if (!address) {
      return res.status(400).json({ success: false, error: 'Invalid address' });
    }

    // Use a transaction for stock reservation
    const result = await prisma.$transaction(async (tx) => {
      // 1. Validate and lock variants
      const orderItems = [];
      let subtotal = 0;

      for (const item of items) {
        const variant = await tx.variant.findUnique({
          where: { id: item.variantId },
          include: { product: { select: { name: true, images: true, isActive: true } } },
        });

        if (!variant || !variant.isActive || !variant.product.isActive) {
          throw new Error(`Variant ${item.variantId} is not available`);
        }

        const available = variant.stock - variant.reservedStock;
        if (item.quantity > available) {
          throw new Error(`Insufficient stock for ${variant.product.name} (${variant.size}/${variant.color})`);
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

        // 2. Reserve stock
        await tx.variant.update({
          where: { id: variant.id },
          data: { reservedStock: { increment: item.quantity } },
        });
      }

      // 3. Apply coupon if provided
      let discount = 0;
      let couponId: string | undefined;
      if (couponCode) {
        const coupon = await tx.coupon.findUnique({ where: { code: couponCode.toUpperCase() } });
        if (coupon && coupon.isActive && new Date() >= coupon.validFrom && new Date() <= coupon.validUntil) {
          if (coupon.minOrder && subtotal < coupon.minOrder) {
            throw new Error(`Minimum order of ₹${coupon.minOrder} required for this coupon`);
          }
          if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
            throw new Error('Coupon usage limit reached');
          }
          discount = coupon.type === 'flat'
            ? coupon.value
            : Math.min(subtotal * coupon.value / 100, coupon.maxDiscount || Infinity);
          couponId = coupon.id;
        }
      }

      const deliveryCharge = subtotal >= 999 ? 0 : 79;
      const total = subtotal - discount + deliveryCharge;

      // Generate order number
      const orderCount = await tx.order.count();
      const orderNumber = `ORD-${new Date().getFullYear()}-${String(orderCount + 1).padStart(6, '0')}`;

      // 4. Create order
      const order = await tx.order.create({
        data: {
          orderNumber,
          userId: userId || 'guest',
          subtotal,
          discount,
          deliveryCharge,
          total,
          couponId,
          couponCode: couponCode?.toUpperCase(),
          orderStatus: 'pending',
          paymentStatus: 'pending',
          stockReserved: true,
          stockDeducted: false,
          shippingAddressId,
          items: { create: orderItems },
        },
        include: { items: true },
      });

      // Update coupon usage
      if (couponId) {
        await tx.coupon.update({
          where: { id: couponId },
          data: { usedCount: { increment: 1 } },
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

// ─── GET /api/orders/:id — Get order status ──────────────────────────────────
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: {
        items: true,
        shippingAddress: true,
      },
    });

    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    res.json({ success: true, data: order });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch order' });
  }
});

// ─── GET /api/orders/user/:userId — User's order history ─────────────────────
router.get('/user/:userId', async (req: Request, res: Response) => {
  try {
    const orders = await prisma.order.findMany({
      where: { userId: req.params.userId },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: orders });
  } catch (error) {
    console.error('Error fetching user orders:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch orders' });
  }
});

export default router;
