import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';

const router = Router();

// ─── POST /api/reviews — Submit a review ─────────────────────────────────────
router.post('/', async (req: Request, res: Response) => {
  try {
    const { productId, userId, rating, comment, images } = req.body;

    if (!productId || !userId || !rating || !comment) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, error: 'Rating must be 1-5' });
    }

    // Check if user purchased this product
    const hasPurchased = await prisma.orderItem.findFirst({
      where: {
        productId,
        order: { userId, paymentStatus: 'paid' },
      },
    });

    const review = await prisma.review.create({
      data: {
        productId,
        userId,
        rating,
        comment,
        images: images || [],
        isVerified: !!hasPurchased,
      },
      include: { user: { select: { name: true } } },
    });

    res.status(201).json({ success: true, data: review });
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({ success: false, error: 'Failed to submit review' });
  }
});

// ─── GET /api/reviews/:productId — Get reviews for a product ─────────────────
router.get('/:productId', async (req: Request, res: Response) => {
  try {
    const reviews = await prisma.review.findMany({
      where: { productId: req.params.productId },
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });

    const avgRating = await prisma.review.aggregate({
      where: { productId: req.params.productId },
      _avg: { rating: true },
      _count: { rating: true },
    });

    res.json({
      success: true,
      data: {
        reviews,
        averageRating: avgRating._avg.rating || 0,
        totalReviews: avgRating._count.rating,
      },
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch reviews' });
  }
});

export default router;
