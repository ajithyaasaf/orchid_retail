import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';

const router = Router();

// ─── GET /api/combos — List all active combos ───────────────────────────────
router.get('/', async (req: Request, res: Response) => {
  try {
    const { isFeatured } = req.query;
    const where: any = { isActive: true };
    if (isFeatured === 'true') where.isFeatured = true;

    const combos = await prisma.combo.findMany({
      where,
      include: {
        products: {
          include: {
            product: {
              include: {
                variants: { where: { isActive: true }, orderBy: { price: 'asc' } }
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, data: combos });
  } catch (error) {
    console.error('Error fetching public combos:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch combos' });
  }
});

// ─── GET /api/combos/:slug — Single combo details ───────────────────────────
router.get('/:slug', async (req: Request, res: Response) => {
  try {
    const combo = await prisma.combo.findUnique({
      where: { slug: req.params.slug, isActive: true },
      include: {
        products: {
          include: {
            product: {
              include: {
                variants: { where: { isActive: true }, orderBy: { price: 'asc' } }
              }
            }
          }
        }
      }
    });

    if (!combo) {
      return res.status(404).json({ success: false, error: 'Combo not found' });
    }

    res.json({ success: true, data: combo });
  } catch (error) {
    console.error('Error fetching combo details:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch combo' });
  }
});

export default router;
