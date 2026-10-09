import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';

const router = Router();

// ─── POST /api/cart/validate — Validate cart items against real stock ─────────
router.post('/validate', async (req: Request, res: Response) => {
  try {
    interface CartItemInput {
      variantId: string;
      quantity: number;
      comboId?: string;
      subItems?: Array<{ variantId: string; productId: string }>;
    }

    const { items } = req.body;
    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ success: false, error: 'Invalid or missing items array' });
    }

    const cartItems = items as CartItemInput[];
    const directVariantIds = cartItems.filter(i => !i.comboId).map(i => i.variantId);
    const subItemVariantIds = cartItems
      .filter(i => i.comboId && i.subItems)
      .flatMap(i => i.subItems!.map(s => s.variantId));

    const allVariantIds = Array.from(new Set([...directVariantIds, ...subItemVariantIds]));

    const variants = await prisma.variant.findMany({
      where: { id: { in: allVariantIds }, isActive: true },
      include: { product: { select: { name: true, images: true, isActive: true } } },
    });

    const validationResults = cartItems.map(item => {
      // If item is a combo bundle
      if (item.comboId && item.subItems && item.subItems.length > 0) {
        let comboValid = true;
        let failMessage: string | undefined;

        for (const sub of item.subItems) {
          const v = variants.find(vr => vr.id === sub.variantId);
          if (!v || !v.isActive || !v.product.isActive) {
            comboValid = false;
            failMessage = `Bundle item "${v?.product.name || 'product'}" is no longer available`;
            break;
          }
          const available = v.stock - v.reservedStock;
          if (item.quantity > available) {
            comboValid = false;
            failMessage = `Only ${available} unit(s) available for ${v.product.name} in bundle`;
            break;
          }
        }

        return {
          variantId: item.variantId,
          requestedQty: item.quantity,
          availableStock: comboValid ? item.quantity : 0,
          isValid: comboValid,
          message: failMessage,
        };
      }

      // Standard single variant
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
