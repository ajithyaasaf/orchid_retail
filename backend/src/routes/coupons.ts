import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';

const router = Router();

// ─── GET /api/coupons/validate ────────────────────────────────────────────────
// Validates a coupon code and returns the computed discount for given subtotal.
// Used by checkout page to show real discount BEFORE order creation.
// Query params: code, userId, subtotal
router.get('/validate', async (req: Request, res: Response) => {
  try {
    const { code, userId, subtotal: subtotalStr } = req.query;

    if (!code || !userId || !subtotalStr) {
      return res.status(400).json({ success: false, error: 'Missing code, userId, or subtotal' });
    }

    const subtotal = parseFloat(subtotalStr as string);
    if (isNaN(subtotal) || subtotal <= 0) {
      return res.status(400).json({ success: false, error: 'Invalid subtotal' });
    }

    const upperCode = (code as string).toUpperCase().trim();
    const coupon = await prisma.coupon.findUnique({ where: { code: upperCode } });

    if (!coupon) {
      return res.status(404).json({ success: false, error: `Coupon "${upperCode}" does not exist` });
    }
    if (!coupon.isActive) {
      return res.status(400).json({ success: false, error: `Coupon "${upperCode}" is no longer active` });
    }
    const now = new Date();
    if (now < coupon.validFrom) {
      return res.status(400).json({ success: false, error: `Coupon "${upperCode}" is not yet valid` });
    }
    if (now > coupon.validUntil) {
      return res.status(400).json({ success: false, error: `Coupon "${upperCode}" has expired` });
    }
    if (coupon.minOrder && subtotal < coupon.minOrder) {
      return res.status(400).json({ success: false, error: `Minimum order of ₹${coupon.minOrder} required for this coupon` });
    }
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return res.status(400).json({ success: false, error: `Coupon "${upperCode}" usage limit has been reached` });
    }

    // Per-user check
    const alreadyUsed = await prisma.couponUsage.findUnique({
      where: { couponId_userId: { couponId: coupon.id, userId: userId as string } },
    });
    if (alreadyUsed) {
      return res.status(400).json({ success: false, error: `You have already used coupon "${upperCode}"` });
    }

    // Compute discount
    const discount =
      coupon.type === 'flat'
        ? Math.min(coupon.value, subtotal)
        : Math.min((subtotal * coupon.value) / 100, coupon.maxDiscount ?? Infinity);

    const roundedDiscount = Math.round(discount * 100) / 100;

    res.json({
      success: true,
      data: {
        code: upperCode,
        type: coupon.type,
        value: coupon.value,
        discount: roundedDiscount,
        maxDiscount: coupon.maxDiscount,
        minOrder: coupon.minOrder,
      },
    });
  } catch (error) {
    console.error('Error validating coupon:', error);
    res.status(500).json({ success: false, error: 'Failed to validate coupon' });
  }
});

export default router;
