import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { authMiddleware, adminMiddleware, superAdminMiddleware } from '../lib/authMiddleware';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const router = Router();

// Apply security to all admin routes
router.use(authMiddleware);
router.use(adminMiddleware);

// ─── Dashboard ───────────────────────────────────────────────────────────────
router.get('/dashboard', async (_req: Request, res: Response) => {
  try {
    const [totalRevenue, totalOrders, totalProducts, totalCustomers, recentOrders, lowStockVariants] = await Promise.all([
      prisma.order.aggregate({ where: { paymentStatus: 'paid' }, _sum: { total: true } }),
      prisma.order.count(),
      prisma.product.count({ where: { isActive: true } }),
      prisma.user.count({ where: { role: 'customer' } }),
      prisma.order.findMany({ orderBy: { createdAt: 'desc' }, take: 10, include: { items: true, user: { select: { name: true, email: true } } } }),
      prisma.variant.findMany({ where: { stock: { lte: 5 }, isActive: true }, include: { product: { select: { name: true } } }, orderBy: { stock: 'asc' }, take: 20 }),
    ]);
    const topProducts = await prisma.orderItem.groupBy({ by: ['productId', 'productName'], _sum: { quantity: true, lineTotal: true }, orderBy: { _sum: { lineTotal: 'desc' } }, take: 10 });
    res.json({
      success: true,
      data: {
        totalRevenue: totalRevenue._sum.total || 0, totalOrders, totalProducts, totalCustomers, recentOrders,
        topProducts: topProducts.map(tp => ({ productId: tp.productId, productName: tp.productName, totalSold: tp._sum.quantity || 0, revenue: tp._sum.lineTotal || 0 })),
        lowStockAlerts: lowStockVariants.map(v => ({ variantId: v.id, productName: v.product.name, sku: v.sku, size: v.size, color: v.color, stock: v.stock })),
      },
    });
  } catch (error) { console.error('Error fetching dashboard:', error); res.status(500).json({ success: false, error: 'Failed to fetch dashboard' }); }
});

router.get('/cloudinary-signature', async (_req: Request, res: Response) => {
  try {
    const timestamp = Math.round(new Date().getTime() / 1000);
    const signature = cloudinary.utils.api_sign_request(
      { timestamp, folder: 'products' },
      process.env.CLOUDINARY_API_SECRET!
    );
    res.json({
      success: true,
      data: {
        signature,
        timestamp,
        cloudName: process.env.CLOUDINARY_CLOUD_NAME,
        apiKey: process.env.CLOUDINARY_API_KEY,
      }
    });
  } catch (error) {
    console.error('Cloudinary signature error:', error);
    res.status(500).json({ success: false, error: 'Failed to generate signature' });
  }
});

// ─── Products CRUD ───────────────────────────────────────────────────────────
router.use('/products', superAdminMiddleware);
router.use('/variants', superAdminMiddleware); // Variants are part of product management

router.get('/products', async (req: Request, res: Response) => {
  try {
    const { search, category, status, page = '1', limit = '20' } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = Math.min(parseInt(limit as string) || 20, 100);
    const where: Record<string, unknown> = {};
    if (search) where.name = { contains: search as string, mode: 'insensitive' };
    if (category) where.categoryId = category;
    if (status === 'active') where.isActive = true;
    else if (status === 'inactive') where.isActive = false;

    const [products, total] = await Promise.all([
      prisma.product.findMany({ where, include: { variants: true, category: { select: { name: true, slug: true } } }, orderBy: { createdAt: 'desc' }, skip: (pageNum - 1) * limitNum, take: limitNum }),
      prisma.product.count({ where }),
    ]);
    res.json({ success: true, data: products, pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) } });
  } catch (error) { console.error('Error listing products:', error); res.status(500).json({ success: false, error: 'Failed to list products' }); }
});

router.post('/products', async (req: Request, res: Response) => {
  try {
    const { name, slug, description, categoryId, images, tags, exportBadge, isFeatured, variants } = req.body;
    if (!name || !slug || !categoryId || !variants?.length) return res.status(400).json({ success: false, error: 'Missing required fields' });
    // Check slug uniqueness
    const existing = await prisma.product.findUnique({ where: { slug } });
    if (existing) return res.status(409).json({ success: false, error: 'Product with this slug already exists' });
    const product = await prisma.product.create({
      data: {
        name, slug, description: description || '', categoryId, images: images || [], tags: tags || [],
        exportBadge: exportBadge || false, isFeatured: isFeatured || false,
        variants: { create: variants.map((v: any) => ({ sku: v.sku, size: v.size, color: v.color, colorHex: v.colorHex, price: v.price, mrp: v.mrp, stock: v.stock || 0, reservedStock: 0 })) },
      },
      include: { variants: true, category: true },
    });
    res.status(201).json({ success: true, data: product });
  } catch (error: any) {
    if (error.code === 'P2002') return res.status(409).json({ success: false, error: 'Duplicate SKU detected' });
    console.error('Error creating product:', error); res.status(500).json({ success: false, error: 'Failed to create product' });
  }
});

router.put('/products/:id', async (req: Request, res: Response) => {
  try {
    const { name, slug, description, categoryId, images, tags, exportBadge, isFeatured, isActive } = req.body;
    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: { ...(name && { name }), ...(slug && { slug }), ...(description !== undefined && { description }), ...(categoryId && { categoryId }), ...(images && { images }), ...(tags && { tags }), ...(exportBadge !== undefined && { exportBadge }), ...(isFeatured !== undefined && { isFeatured }), ...(isActive !== undefined && { isActive }) },
      include: { variants: true, category: true },
    });
    res.json({ success: true, data: product });
  } catch (error) { console.error('Error updating product:', error); res.status(500).json({ success: false, error: 'Failed to update product' }); }
});

router.delete('/products/:id', async (req: Request, res: Response) => {
  try {
    const pendingOrders = await prisma.orderItem.count({ where: { productId: req.params.id, order: { orderStatus: { in: ['pending', 'confirmed', 'processing'] } } } });
    if (pendingOrders > 0) return res.status(409).json({ success: false, error: `Cannot delete: ${pendingOrders} active orders reference this product` });
    await prisma.product.update({ where: { id: req.params.id }, data: { isActive: false } });
    res.json({ success: true });
  } catch (error) { console.error('Error deleting product:', error); res.status(500).json({ success: false, error: 'Failed to delete product' }); }
});

// ─── Variants ────────────────────────────────────────────────────────────────
router.post('/products/:id/variants', async (req: Request, res: Response) => {
  try {
    const variant = await prisma.variant.create({ data: { productId: req.params.id, ...req.body, reservedStock: 0 } });
    res.status(201).json({ success: true, data: variant });
  } catch (error: any) {
    if (error.code === 'P2002') return res.status(409).json({ success: false, error: 'SKU already exists' });
    console.error('Error adding variant:', error); res.status(500).json({ success: false, error: 'Failed to add variant' });
  }
});

router.put('/variants/:id', async (req: Request, res: Response) => {
  try {
    const { price, mrp, stock, isActive, size, color, colorHex, sku } = req.body;
    const variant = await prisma.variant.update({
      where: { id: req.params.id },
      data: { ...(price !== undefined && { price }), ...(mrp !== undefined && { mrp }), ...(stock !== undefined && { stock }), ...(isActive !== undefined && { isActive }), ...(size && { size }), ...(color && { color }), ...(colorHex && { colorHex }), ...(sku && { sku }) },
    });
    res.json({ success: true, data: variant });
  } catch (error) { console.error('Error updating variant:', error); res.status(500).json({ success: false, error: 'Failed to update variant' }); }
});

router.delete('/variants/:id', async (req: Request, res: Response) => {
  try {
    await prisma.variant.update({ where: { id: req.params.id }, data: { isActive: false } });
    res.json({ success: true });
  } catch (error) { console.error('Error deleting variant:', error); res.status(500).json({ success: false, error: 'Failed to delete variant' }); }
});

// ─── Orders ──────────────────────────────────────────────────────────────────
router.get('/orders', async (req: Request, res: Response) => {
  try {
    const { status, payment, search, page = '1', limit = '20' } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const where: Record<string, unknown> = {};
    if (status) where.orderStatus = status;
    if (payment) where.paymentStatus = payment;
    if (search) where.orderNumber = { contains: search as string, mode: 'insensitive' };

    const [orders, total] = await Promise.all([
      prisma.order.findMany({ where, include: { items: true, user: { select: { name: true, email: true, phone: true } }, shippingAddress: true }, orderBy: { createdAt: 'desc' }, skip: (pageNum - 1) * limitNum, take: limitNum }),
      prisma.order.count({ where }),
    ]);
    res.json({ success: true, data: orders, pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) } });
  } catch (error) { console.error('Error fetching orders:', error); res.status(500).json({ success: false, error: 'Failed to fetch orders' }); }
});

router.get('/orders/:id', async (req: Request, res: Response) => {
  try {
    const order = await prisma.order.findUnique({ where: { id: req.params.id }, include: { items: true, user: { select: { name: true, email: true, phone: true } }, shippingAddress: true } });
    if (!order) return res.status(404).json({ success: false, error: 'Order not found' });
    res.json({ success: true, data: order });
  } catch (error) { console.error('Error fetching order:', error); res.status(500).json({ success: false, error: 'Failed to fetch order' }); }
});

router.put('/orders/:id', async (req: Request, res: Response) => {
  try {
    const { orderStatus, trackingNumber, courierName } = req.body;
    const order = await prisma.order.update({
      where: { id: req.params.id },
      data: { ...(orderStatus && { orderStatus }), ...(trackingNumber && { trackingNumber }), ...(courierName && { courierName }) },
      include: { items: true },
    });
    res.json({ success: true, data: order });
  } catch (error) { console.error('Error updating order:', error); res.status(500).json({ success: false, error: 'Failed to update order' }); }
});

// ─── Customers ───────────────────────────────────────────────────────────────
router.get('/customers', async (req: Request, res: Response) => {
  try {
    const { search, page = '1', limit = '20' } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const where: Record<string, unknown> = { role: 'customer' };
    if (search) where.OR = [{ name: { contains: search, mode: 'insensitive' } }, { email: { contains: search, mode: 'insensitive' } }, { phone: { contains: search } }];

    const [customers, total] = await Promise.all([
      prisma.user.findMany({
        where: where as any, select: { id: true, name: true, email: true, phone: true, createdAt: true, _count: { select: { orders: true } },
          orders: { select: { total: true, paymentStatus: true }, where: { paymentStatus: 'paid' } } },
        orderBy: { createdAt: 'desc' }, skip: (pageNum - 1) * limitNum, take: limitNum,
      }),
      prisma.user.count({ where: where as any }),
    ]);
    const data = customers.map(c => ({ ...c, totalSpent: c.orders.reduce((s, o) => s + o.total, 0), orderCount: c._count.orders, orders: undefined, _count: undefined }));
    res.json({ success: true, data, pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) } });
  } catch (error) { console.error('Error fetching customers:', error); res.status(500).json({ success: false, error: 'Failed to fetch customers' }); }
});

router.get('/customers/:id', async (req: Request, res: Response) => {
  try {
    const customer = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: { id: true, name: true, email: true, phone: true, createdAt: true, addresses: true, orders: { include: { items: true }, orderBy: { createdAt: 'desc' }, take: 20 } },
    });
    if (!customer) return res.status(404).json({ success: false, error: 'Customer not found' });
    res.json({ success: true, data: customer });
  } catch (error) { console.error('Error fetching customer:', error); res.status(500).json({ success: false, error: 'Failed to fetch customer' }); }
});

// ─── Coupons CRUD ────────────────────────────────────────────────────────────
router.use('/coupons', superAdminMiddleware);

router.get('/coupons', async (_req: Request, res: Response) => {
  try {
    const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: 'desc' }, include: { _count: { select: { usages: true } } } });
    res.json({ success: true, data: coupons });
  } catch (error) { console.error('Error fetching coupons:', error); res.status(500).json({ success: false, error: 'Failed to fetch coupons' }); }
});

router.post('/coupons', async (req: Request, res: Response) => {
  try {
    const { code, type, value, minOrder, maxDiscount, usageLimit, validFrom, validUntil } = req.body;
    if (!code || !type || value === undefined || !validFrom || !validUntil) return res.status(400).json({ success: false, error: 'Missing required fields' });
    const upperCode = code.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (type === 'percentage' && (value <= 0 || value > 100)) return res.status(400).json({ success: false, error: 'Percentage must be 1-100' });
    if (new Date(validUntil) <= new Date(validFrom)) return res.status(400).json({ success: false, error: 'End date must be after start date' });

    const coupon = await prisma.coupon.create({ data: { code: upperCode, type, value, minOrder, maxDiscount, usageLimit, validFrom: new Date(validFrom), validUntil: new Date(validUntil) } });
    res.status(201).json({ success: true, data: coupon });
  } catch (error: any) {
    if (error.code === 'P2002') return res.status(409).json({ success: false, error: 'Coupon code already exists' });
    console.error('Error creating coupon:', error); res.status(500).json({ success: false, error: 'Failed to create coupon' });
  }
});

router.put('/coupons/:id', async (req: Request, res: Response) => {
  try {
    const coupon = await prisma.coupon.update({ where: { id: req.params.id }, data: req.body });
    res.json({ success: true, data: coupon });
  } catch (error) { console.error('Error updating coupon:', error); res.status(500).json({ success: false, error: 'Failed to update coupon' }); }
});

router.delete('/coupons/:id', async (req: Request, res: Response) => {
  try {
    await prisma.coupon.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) { console.error('Error deleting coupon:', error); res.status(500).json({ success: false, error: 'Failed to delete coupon' }); }
});

// ─── Categories CRUD ─────────────────────────────────────────────────────────
router.get('/categories', async (_req: Request, res: Response) => {
  try {
    const categories = await prisma.category.findMany({
      where: { parentId: null },
      include: { children: { include: { _count: { select: { products: true } } }, orderBy: { sortOrder: 'asc' } }, _count: { select: { products: true } } },
      orderBy: { sortOrder: 'asc' },
    });
    res.json({ success: true, data: categories });
  } catch (error) { console.error('Error fetching categories:', error); res.status(500).json({ success: false, error: 'Failed to fetch categories' }); }
});

router.post('/categories', async (req: Request, res: Response) => {
  try {
    const category = await prisma.category.create({ data: req.body });
    res.status(201).json({ success: true, data: category });
  } catch (error: any) {
    if (error.code === 'P2002') return res.status(409).json({ success: false, error: 'Category slug already exists' });
    console.error('Error creating category:', error); res.status(500).json({ success: false, error: 'Failed to create category' });
  }
});

router.put('/categories/:id', async (req: Request, res: Response) => {
  try {
    const category = await prisma.category.update({ where: { id: req.params.id }, data: req.body });
    res.json({ success: true, data: category });
  } catch (error) { console.error('Error updating category:', error); res.status(500).json({ success: false, error: 'Failed to update category' }); }
});

router.delete('/categories/:id', async (req: Request, res: Response) => {
  try {
    const [childCount, productCount] = await Promise.all([
      prisma.category.count({ where: { parentId: req.params.id } }),
      prisma.product.count({ where: { categoryId: req.params.id } }),
    ]);
    if (childCount > 0) return res.status(409).json({ success: false, error: `Cannot delete: has ${childCount} subcategories` });
    if (productCount > 0) return res.status(409).json({ success: false, error: `Cannot delete: has ${productCount} products` });
    await prisma.category.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) { console.error('Error deleting category:', error); res.status(500).json({ success: false, error: 'Failed to delete category' }); }
});

// ─── Collections CRUD ────────────────────────────────────────────────────────
router.use('/collections', superAdminMiddleware);

router.get('/collections', async (_req: Request, res: Response) => {
  try {
    const collections = await prisma.collection.findMany({ orderBy: { sortOrder: 'asc' }, include: { _count: { select: { products: true } } } });
    res.json({ success: true, data: collections });
  } catch (error) { console.error('Error fetching collections:', error); res.status(500).json({ success: false, error: 'Failed to fetch collections' }); }
});

router.post('/collections', async (req: Request, res: Response) => {
  try {
    const collection = await prisma.collection.create({ data: req.body });
    res.status(201).json({ success: true, data: collection });
  } catch (error: any) {
    if (error.code === 'P2002') return res.status(409).json({ success: false, error: 'Collection slug already exists' });
    console.error('Error creating collection:', error); res.status(500).json({ success: false, error: 'Failed to create collection' });
  }
});

router.put('/collections/:id', async (req: Request, res: Response) => {
  try {
    const collection = await prisma.collection.update({ where: { id: req.params.id }, data: req.body });
    res.json({ success: true, data: collection });
  } catch (error) { console.error('Error updating collection:', error); res.status(500).json({ success: false, error: 'Failed to update collection' }); }
});

router.delete('/collections/:id', async (req: Request, res: Response) => {
  try {
    await prisma.collection.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) { console.error('Error deleting collection:', error); res.status(500).json({ success: false, error: 'Failed to delete collection' }); }
});

router.post('/collections/:id/products', async (req: Request, res: Response) => {
  try {
    const { productIds } = req.body;
    if (!Array.isArray(productIds) || productIds.length === 0) return res.status(400).json({ success: false, error: 'productIds array required' });
    await prisma.collectionProduct.createMany({ data: productIds.map((pid: string, i: number) => ({ collectionId: req.params.id, productId: pid, sortOrder: i })), skipDuplicates: true });
    res.json({ success: true });
  } catch (error) { console.error('Error adding products to collection:', error); res.status(500).json({ success: false, error: 'Failed to add products' }); }
});

router.delete('/collections/:id/products/:productId', async (req: Request, res: Response) => {
  try {
    await prisma.collectionProduct.delete({ where: { collectionId_productId: { collectionId: req.params.id, productId: req.params.productId } } });
    res.json({ success: true });
  } catch (error) { console.error('Error removing product from collection:', error); res.status(500).json({ success: false, error: 'Failed to remove product' }); }
});

// ─── Combos CRUD ─────────────────────────────────────────────────────────────
router.use('/combos', superAdminMiddleware);

router.get('/combos', async (req: Request, res: Response) => {
  try {
    const { search, page = '1', limit = '20' } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const where: any = {};
    if (search) where.name = { contains: search as string, mode: 'insensitive' };

    const [combos, total] = await Promise.all([
      prisma.combo.findMany({
        where,
        include: { products: { include: { product: { select: { name: true, images: true, variants: true } } } } },
        orderBy: { createdAt: 'desc' },
        skip: (pageNum - 1) * limitNum,
        take: limitNum
      }),
      prisma.combo.count({ where }),
    ]);
    res.json({ success: true, data: combos, pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) } });
  } catch (error) { console.error('Error fetching combos:', error); res.status(500).json({ success: false, error: 'Failed to fetch combos' }); }
});

router.post('/combos', async (req: Request, res: Response) => {
  try {
    const { name, slug, description, images, price, mrp, isFeatured, productIds } = req.body;
    if (!name || !slug || !price || !productIds?.length) return res.status(400).json({ success: false, error: 'Missing required fields' });

    const combo = await prisma.combo.create({
      data: {
        name, slug, description: description || '', images: images || [], price: Number(price), mrp: Number(mrp || 0), isFeatured: isFeatured || false,
        products: { create: productIds.map((pid: string) => ({ productId: pid })) }
      },
      include: { products: true }
    });
    res.status(201).json({ success: true, data: combo });
  } catch (error: any) {
    if (error.code === 'P2002') return res.status(409).json({ success: false, error: 'Slug already exists' });
    console.error('Error creating combo:', error); res.status(500).json({ success: false, error: 'Failed to create combo' });
  }
});

router.put('/combos/:id', async (req: Request, res: Response) => {
  try {
    const { name, slug, description, images, price, mrp, isFeatured, isActive, productIds } = req.body;
    
    // Update basic info
    const combo = await prisma.combo.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name }), ...(slug && { slug }), ...(description !== undefined && { description }), 
        ...(images && { images }), ...(price !== undefined && { price: Number(price) }), 
        ...(mrp !== undefined && { mrp: Number(mrp) }), ...(isFeatured !== undefined && { isFeatured }), 
        ...(isActive !== undefined && { isActive })
      }
    });

    // Update products if provided
    if (productIds && Array.isArray(productIds)) {
      await prisma.comboProduct.deleteMany({ where: { comboId: req.params.id } });
      await prisma.comboProduct.createMany({ data: productIds.map((pid: string) => ({ comboId: req.params.id, productId: pid })) });
    }

    const updatedCombo = await prisma.combo.findUnique({ where: { id: req.params.id }, include: { products: true } });
    res.json({ success: true, data: updatedCombo });
  } catch (error) { console.error('Error updating combo:', error); res.status(500).json({ success: false, error: 'Failed to update combo' }); }
});

router.delete('/combos/:id', async (req: Request, res: Response) => {
  try {
    await prisma.combo.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) { console.error('Error deleting combo:', error); res.status(500).json({ success: false, error: 'Failed to delete combo' }); }
});

export default router;
