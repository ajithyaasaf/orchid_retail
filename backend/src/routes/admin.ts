import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';

const router = Router();

// TODO: Add proper auth middleware for admin routes

// ─── GET /api/admin/dashboard — Dashboard analytics ──────────────────────────
router.get('/dashboard', async (_req: Request, res: Response) => {
  try {
    const [
      totalRevenue,
      totalOrders,
      totalProducts,
      totalCustomers,
      recentOrders,
      lowStockVariants,
    ] = await Promise.all([
      prisma.order.aggregate({
        where: { paymentStatus: 'paid' },
        _sum: { total: true },
      }),
      prisma.order.count(),
      prisma.product.count({ where: { isActive: true } }),
      prisma.user.count({ where: { role: 'customer' } }),
      prisma.order.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { items: true, user: { select: { name: true, email: true } } },
      }),
      prisma.variant.findMany({
        where: { stock: { lte: 5 }, isActive: true },
        include: { product: { select: { name: true } } },
        orderBy: { stock: 'asc' },
        take: 20,
      }),
    ]);

    // Top products by sales
    const topProducts = await prisma.orderItem.groupBy({
      by: ['productId', 'productName'],
      _sum: { quantity: true, lineTotal: true },
      orderBy: { _sum: { lineTotal: 'desc' } },
      take: 10,
    });

    res.json({
      success: true,
      data: {
        totalRevenue: totalRevenue._sum.total || 0,
        totalOrders,
        totalProducts,
        totalCustomers,
        recentOrders,
        topProducts: topProducts.map(tp => ({
          productId: tp.productId,
          productName: tp.productName,
          totalSold: tp._sum.quantity || 0,
          revenue: tp._sum.lineTotal || 0,
        })),
        lowStockAlerts: lowStockVariants.map(v => ({
          variantId: v.id,
          productName: v.product.name,
          sku: v.sku,
          size: v.size,
          color: v.color,
          stock: v.stock,
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching dashboard:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch dashboard' });
  }
});

// ─── POST /api/admin/products — Create product with variants ─────────────────
router.post('/products', async (req: Request, res: Response) => {
  try {
    const { name, slug, description, categoryId, images, tags, exportBadge, isFeatured, variants } = req.body;

    if (!name || !slug || !categoryId || !variants?.length) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    const product = await prisma.product.create({
      data: {
        name,
        slug,
        description: description || '',
        categoryId,
        images: images || [],
        tags: tags || [],
        exportBadge: exportBadge || false,
        isFeatured: isFeatured || false,
        variants: {
          create: variants.map((v: { sku: string; size: string; color: string; colorHex?: string; price: number; mrp: number; stock: number }) => ({
            sku: v.sku,
            size: v.size,
            color: v.color,
            colorHex: v.colorHex,
            price: v.price,
            mrp: v.mrp,
            stock: v.stock,
            reservedStock: 0,
          })),
        },
      },
      include: { variants: true, category: true },
    });

    res.status(201).json({ success: true, data: product });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ success: false, error: 'Failed to create product' });
  }
});

// ─── PUT /api/admin/products/:id — Update product ────────────────────────────
router.put('/products/:id', async (req: Request, res: Response) => {
  try {
    const { name, description, categoryId, images, tags, exportBadge, isFeatured, isActive } = req.body;

    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(categoryId && { categoryId }),
        ...(images && { images }),
        ...(tags && { tags }),
        ...(exportBadge !== undefined && { exportBadge }),
        ...(isFeatured !== undefined && { isFeatured }),
        ...(isActive !== undefined && { isActive }),
      },
      include: { variants: true, category: true },
    });

    res.json({ success: true, data: product });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ success: false, error: 'Failed to update product' });
  }
});

// ─── PUT /api/admin/variants/:id — Update variant stock/price ────────────────
router.put('/variants/:id', async (req: Request, res: Response) => {
  try {
    const { price, mrp, stock, isActive } = req.body;

    const variant = await prisma.variant.update({
      where: { id: req.params.id },
      data: {
        ...(price !== undefined && { price }),
        ...(mrp !== undefined && { mrp }),
        ...(stock !== undefined && { stock }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    res.json({ success: true, data: variant });
  } catch (error) {
    console.error('Error updating variant:', error);
    res.status(500).json({ success: false, error: 'Failed to update variant' });
  }
});

// ─── GET /api/admin/orders — All orders with filters ─────────────────────────
router.get('/orders', async (req: Request, res: Response) => {
  try {
    const { status, payment, page = '1', limit = '20' } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);

    const where: Record<string, unknown> = {};
    if (status) where.orderStatus = status;
    if (payment) where.paymentStatus = payment;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: { items: true, user: { select: { name: true, email: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
      }),
      prisma.order.count({ where }),
    ]);

    res.json({
      success: true,
      data: orders,
      pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch orders' });
  }
});

// ─── PUT /api/admin/orders/:id — Update order status ─────────────────────────
router.put('/orders/:id', async (req: Request, res: Response) => {
  try {
    const { orderStatus, trackingNumber, courierName } = req.body;

    const order = await prisma.order.update({
      where: { id: req.params.id },
      data: {
        ...(orderStatus && { orderStatus }),
        ...(trackingNumber && { trackingNumber }),
        ...(courierName && { courierName }),
      },
      include: { items: true },
    });

    res.json({ success: true, data: order });
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({ success: false, error: 'Failed to update order' });
  }
});

// ─── Coupon CRUD ─────────────────────────────────────────────────────────────
router.post('/coupons', async (req: Request, res: Response) => {
  try {
    const coupon = await prisma.coupon.create({ data: req.body });
    res.status(201).json({ success: true, data: coupon });
  } catch (error) {
    console.error('Error creating coupon:', error);
    res.status(500).json({ success: false, error: 'Failed to create coupon' });
  }
});

router.get('/coupons', async (_req: Request, res: Response) => {
  try {
    const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } });
    res.json({ success: true, data: coupons });
  } catch (error) {
    console.error('Error fetching coupons:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch coupons' });
  }
});

// ─── Category CRUD ───────────────────────────────────────────────────────────
router.post('/categories', async (req: Request, res: Response) => {
  try {
    const category = await prisma.category.create({ data: req.body });
    res.status(201).json({ success: true, data: category });
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ success: false, error: 'Failed to create category' });
  }
});

router.put('/categories/:id', async (req: Request, res: Response) => {
  try {
    const category = await prisma.category.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json({ success: true, data: category });
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ success: false, error: 'Failed to update category' });
  }
});

export default router;
