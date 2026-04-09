import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';

const router = Router();

// ─── POST /api/cart/validate — Validate cart items against real stock ─────────
router.post('/validate', async (req: Request, res: Response) => {
  try {
    const { items } = req.body as { items: { variantId: string; quantity: number }[] };

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, error: 'Cart items required' });
    }

    const variantIds = items.map(i => i.variantId);
    const variants = await prisma.variant.findMany({
      where: { id: { in: variantIds }, isActive: true },
      include: { product: { select: { name: true, images: true, isActive: true } } },
    });

    const validationResults = items.map(item => {
      const variant = variants.find(v => v.id === item.variantId);
      if (!variant) {
        return {
          variantId: item.variantId,
          requestedQty: item.quantity,
          availableStock: 0,
          isValid: false,
          message: 'Variant not found or inactive',
        };
      }

      if (!variant.product.isActive) {
        return {
          variantId: item.variantId,
          requestedQty: item.quantity,
          availableStock: 0,
          isValid: false,
          message: 'Product is no longer available',
        };
      }

      const availableStock = variant.stock - variant.reservedStock;
      const isValid = item.quantity <= availableStock && item.quantity > 0;

      return {
        variantId: item.variantId,
        requestedQty: item.quantity,
        availableStock,
        isValid,
        message: isValid ? undefined : `Only ${availableStock} units available`,
        variant: {
          ...variant,
          productName: variant.product.name,
          productImage: variant.product.images[0],
        },
      };
    });

    const allValid = validationResults.every(r => r.isValid);

    res.json({
      success: true,
      data: {
        valid: allValid,
        items: validationResults,
      },
    });
  } catch (error) {
    console.error('Error validating cart:', error);
    res.status(500).json({ success: false, error: 'Failed to validate cart' });
  }
});

export default router;
