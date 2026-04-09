import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';

const router = Router();

// ─── GET /api/products — List products with filters, sort, pagination, search ─
router.get('/', async (req: Request, res: Response) => {
  try {
    const {
      page = '1',
      limit = '20',
      category,
      search,
      minPrice,
      maxPrice,
      sizes,
      colors,
      tags,
      inStock,
      exportBadge,
      isFeatured,
      sort = 'newest',
    } = req.query;

    const pageNum = Math.max(1, parseInt(page as string));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string)));
    const skip = (pageNum - 1) * limitNum;

    // Build where clause
    const where: Record<string, unknown> = { isActive: true };

    if (category) {
      where.category = { slug: category as string };
    }

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
        { tags: { hasSome: [(search as string).toLowerCase()] } },
      ];
    }

    if (tags) {
      const tagList = (tags as string).split(',');
      where.tags = { hasSome: tagList };
    }

    if (exportBadge === 'true') where.exportBadge = true;
    if (isFeatured === 'true') where.isFeatured = true;

    // Variant-level filters
    const variantWhere: Record<string, unknown> = { isActive: true };
    if (minPrice) variantWhere.price = { ...(variantWhere.price as object || {}), gte: parseFloat(minPrice as string) };
    if (maxPrice) variantWhere.price = { ...(variantWhere.price as object || {}), lte: parseFloat(maxPrice as string) };
    if (sizes) variantWhere.size = { in: (sizes as string).split(',') };
    if (colors) variantWhere.color = { in: (colors as string).split(',') };
    if (inStock === 'true') variantWhere.stock = { gt: 0 };

    // If variant filters exist, filter products that have matching variants
    const hasVariantFilters = Object.keys(variantWhere).length > 1;
    if (hasVariantFilters) {
      where.variants = { some: variantWhere };
    }

    // Sort
    let orderBy: Record<string, string> = {};
    switch (sort) {
      case 'price_asc': orderBy = { createdAt: 'asc' }; break; // Will sort by computed price client-side
      case 'price_desc': orderBy = { createdAt: 'desc' }; break;
      case 'oldest': orderBy = { createdAt: 'asc' }; break;
      case 'newest': default: orderBy = { createdAt: 'desc' }; break;
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: true,
          variants: { where: { isActive: true }, orderBy: { price: 'asc' } },
          _count: { select: { reviews: true } },
        },
        orderBy,
        skip,
        take: limitNum,
      }),
      prisma.product.count({ where }),
    ]);

    // Compute avg rating, min/max price per product
    const enrichedProducts = await Promise.all(
      products.map(async (p) => {
        const avgRating = await prisma.review.aggregate({
          where: { productId: p.id },
          _avg: { rating: true },
        });
        const prices = p.variants.map(v => v.price);
        const mrps = p.variants.map(v => v.mrp);
        return {
          ...p,
          averageRating: avgRating._avg.rating || 0,
          reviewCount: p._count.reviews,
          minPrice: prices.length ? Math.min(...prices) : 0,
          maxPrice: prices.length ? Math.max(...prices) : 0,
          minMrp: mrps.length ? Math.min(...mrps) : 0,
          totalStock: p.variants.reduce((sum, v) => sum + v.stock, 0),
        };
      })
    );

    // Sort by price if requested (using computed minPrice)
    if (sort === 'price_asc') {
      enrichedProducts.sort((a, b) => a.minPrice - b.minPrice);
    } else if (sort === 'price_desc') {
      enrichedProducts.sort((a, b) => b.minPrice - a.minPrice);
    }

    res.json({
      success: true,
      data: enrichedProducts,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch products' });
  }
});

// ─── GET /api/products/:slug — Single product with variants ──────────────────
router.get('/:slug', async (req: Request, res: Response) => {
  try {
    const product = await prisma.product.findUnique({
      where: { slug: req.params.slug },
      include: {
        category: true,
        variants: { where: { isActive: true }, orderBy: { price: 'asc' } },
        reviews: {
          include: { user: { select: { name: true } } },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        _count: { select: { reviews: true } },
      },
    });

    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    const avgRating = await prisma.review.aggregate({
      where: { productId: product.id },
      _avg: { rating: true },
    });

    const prices = product.variants.map(v => v.price);
    const mrps = product.variants.map(v => v.mrp);

    // Related products from same category
    const relatedProducts = await prisma.product.findMany({
      where: {
        categoryId: product.categoryId,
        id: { not: product.id },
        isActive: true,
      },
      include: {
        variants: { where: { isActive: true }, orderBy: { price: 'asc' } },
        _count: { select: { reviews: true } },
      },
      take: 8,
    });

    res.json({
      success: true,
      data: {
        ...product,
        averageRating: avgRating._avg.rating || 0,
        reviewCount: product._count.reviews,
        minPrice: prices.length ? Math.min(...prices) : 0,
        maxPrice: prices.length ? Math.max(...prices) : 0,
        minMrp: mrps.length ? Math.min(...mrps) : 0,
        totalStock: product.variants.reduce((sum, v) => sum + v.stock, 0),
        relatedProducts: relatedProducts.map(rp => ({
          ...rp,
          minPrice: rp.variants.length ? Math.min(...rp.variants.map(v => v.price)) : 0,
          minMrp: rp.variants.length ? Math.min(...rp.variants.map(v => v.mrp)) : 0,
          totalStock: rp.variants.reduce((sum, v) => sum + v.stock, 0),
          reviewCount: rp._count.reviews,
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch product' });
  }
});

export default router;
