import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// ─── Seed Data ─────────────────────────────────────────────────────────────

const CATEGORIES = [
  { name: "Women's Tops", slug: 'women-tops', description: 'T-shirts, dresses, and more for women', sortOrder: 1 },
  { name: "Women's Dresses", slug: 'women-dresses', description: 'Dresses and gowns for women', sortOrder: 2 },
  { name: "Women's Bottoms", slug: 'women-bottoms', description: 'Pants, skirts, and leggings for women', sortOrder: 3 },
  { name: "Men's Shirts", slug: 'men-shirts', description: 'Premium shirts and t-shirts for men', sortOrder: 4 },
  { name: "Men's Trousers", slug: 'men-trousers', description: 'Pants and joggers for men', sortOrder: 5 },
  { name: "Kids' Wear", slug: 'kids-wear', description: 'Comfortable clothing for children', sortOrder: 6 },
  { name: 'Accessories', slug: 'accessories', description: 'Bags, belts, and more', sortOrder: 7 },
  { name: 'Footwear', slug: 'footwear', description: 'Premium shoes and sandals', sortOrder: 8 },
];

const PRODUCT_TEMPLATES: Record<string, { names: string[]; tags: string[]; priceRange: [number, number]; mrpMultiplier: number }> = {
  'women-tops': {
    names: ['Premium Cotton Tee', 'Silk Blouse', 'Linen Top', 'Knitted Sweater', 'V-Neck T-Shirt', 'Floral Print Top'],
    tags: ['women', 'top', 'casual', 'premium'],
    priceRange: [399, 1299],
    mrpMultiplier: 2.5,
  },
  'women-dresses': {
    names: ['Maxi Summer Dress', 'Cocktail Dress', 'Midi Skirt', 'Evening Gown', 'Bodycon Dress', 'A-Line Dress'],
    tags: ['women', 'dress', 'formal', 'party'],
    priceRange: [799, 2999],
    mrpMultiplier: 2.8,
  },
  'women-bottoms': {
    names: ['High-Waist Jeans', 'Wide-Leg Trousers', 'Active Leggings', 'Denim Shorts', 'Formal Slacks'],
    tags: ['women', 'bottom', 'denim', 'active'],
    priceRange: [599, 1999],
    mrpMultiplier: 2.5,
  },
  'men-shirts': {
    names: ['Oxford Button-Down', 'Casual Flannel', 'Slim-Fit Polo', 'Formal White Shirt', 'Printed Cuban Shirt'],
    tags: ['men', 'shirt', 'formal', 'casual'],
    priceRange: [499, 1599],
    mrpMultiplier: 2.5,
  },
  'men-trousers': {
    names: ['Chino Pants', 'Cargo Trousers', 'Slim-Fit Jeans', 'Formal Dress Pants', 'Jogger Pants'],
    tags: ['men', 'bottom', 'casual', 'formal'],
    priceRange: [699, 2199],
    mrpMultiplier: 2.5,
  },
  'kids-wear': {
    names: ['Cotton Onesie', 'Cartoon Print Tee', 'Soft Denim Dungarees', 'Fleece Hoodie', 'Kids Tracksuit'],
    tags: ['kids', 'comfortable', 'cotton', 'unisex'],
    priceRange: [299, 999],
    mrpMultiplier: 2.0,
  },
  'accessories': {
    names: ['Leather Belt', 'Canvas Backpack', 'Polarized Sunglasses', 'Minimalist Wallet', 'Cotton Tote Bag'],
    tags: ['accessories', 'lifestyle', 'premium'],
    priceRange: [199, 1499],
    mrpMultiplier: 2.2,
  },
  'footwear': {
    names: ['Classic Sneakers', 'Leather Loafers', 'Running Shoes', 'Summer Sandals', 'Formal Boots'],
    tags: ['footwear', 'shoes', 'casual', 'formal'],
    priceRange: [899, 3999],
    mrpMultiplier: 2.6,
  },
};

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const COLORS = [
  { name: 'Black', hex: '#000000' },
  { name: 'White', hex: '#FFFFFF' },
  { name: 'Navy', hex: '#1B2A4A' },
  { name: 'Red', hex: '#DC2626' },
  { name: 'Pink', hex: '#EC4899' },
  { name: 'Beige', hex: '#D4B896' },
  { name: 'Grey', hex: '#6B7280' },
  { name: 'Blue', hex: '#3B82F6' },
  { name: 'Green', hex: '#16A34A' },
  { name: 'Maroon', hex: '#7F1D1D' },
  { name: 'Olive', hex: '#65712B' },
  { name: 'Teal', hex: '#0D9488' },
  { name: 'Coral', hex: '#F97316' },
  { name: 'Lavender', hex: '#A78BFA' },
];

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickRandom<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function generateSlug(name: string, index: number): string {
  return `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '')}-${index}`;
}

// Curated Unsplash fashion image URLs
const UNSPLASH_IMAGES = [
  'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&h=800&fit=crop', // yellow dress
  'https://images.unsplash.com/photo-1434389678369-1822d54e50dc?w=600&h=800&fit=crop', // jacket
  'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=600&h=800&fit=crop', // denim
  'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=600&h=800&fit=crop', // white dress
  'https://images.unsplash.com/photo-1509319117193-57bab727e09d?w=600&h=800&fit=crop', // green top
  'https://images.unsplash.com/photo-1539008835657-9e8e9680c956?w=600&h=800&fit=crop', // woman coat
  'https://images.unsplash.com/photo-1550614000-4b95d41b6375?w=600&h=800&fit=crop', // formal shirt
  'https://images.unsplash.com/photo-1559551409-dadc959f76b8?w=600&h=800&fit=crop', // man shirt
  'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&h=800&fit=crop', // men formal
  'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&h=800&fit=crop', // leather jacket
  'https://images.unsplash.com/photo-1618244972963-dbee1a7edc95?w=600&h=800&fit=crop', // kid wear
  'https://images.unsplash.com/photo-1584370848010-d7fe6bc767eb?w=600&h=800&fit=crop', // jeans
  'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=600&h=800&fit=crop', // shoes
  'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=600&h=800&fit=crop', // casual shoes
];

// Temporary Unsplash image URLs (will be replaced with Cloudinary URLs later)
function generateImageUrls(category: string, index: number): string[] {
  // Use index to deterministically pick an image from the array
  const imgIndex = index % UNSPLASH_IMAGES.length;
  const base = UNSPLASH_IMAGES[imgIndex];
  return [base, base, base, base];
}

async function main() {
  console.log('🌱 Seeding Orchid Retail database...');

  // Clear existing data
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.review.deleteMany();
  await prisma.variant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.coupon.deleteMany();
  // await prisma.address.deleteMany();
  // await prisma.user.deleteMany();

  // Create categories
  console.log('📁 Creating categories...');
  const categoryMap: Record<string, string> = {};
  for (const cat of CATEGORIES) {
    const created = await prisma.category.create({ data: cat });
    categoryMap[cat.slug] = created.id;
  }

  // Create products with variants
  console.log('📦 Creating products with variants...');
  let productCount = 0;

  for (const [categorySlug, template] of Object.entries(PRODUCT_TEMPLATES)) {
    const categoryId = categoryMap[categorySlug];
    const productNames = template.names;

    for (let i = 0; i < productNames.length; i++) {
      productCount++;
      const name = productNames[i];
      const slug = generateSlug(name, productCount);
      const basePrice = randomBetween(template.priceRange[0], template.priceRange[1]);
      const mrp = Math.round(basePrice * template.mrpMultiplier);
      const tags = pickRandom(template.tags, randomBetween(1, 3));
      const exportBadge = Math.random() > 0.3; // 70% chance of export badge
      const isFeatured = Math.random() > 0.7; // 30% featured

      // Pick 2-4 colors for this product
      const productColors = pickRandom(COLORS, randomBetween(2, 4));
      // Pick 4-6 sizes (less for accessories/footwear)
      const isApparel = !['accessories', 'footwear'].includes(categorySlug);
      const productSizes = isApparel
        ? pickRandom(SIZES, randomBetween(4, 6))
        : ['One Size'];

      // Create variants (each size × color combo)
      const variants = [];
      let skuCounter = 0;
      for (const color of productColors) {
        for (const size of productSizes) {
          skuCounter++;
          const priceVariation = randomBetween(-50, 100); // Slight price variation per variant
          const variantPrice = Math.max(199, basePrice + priceVariation);
          const variantMrp = Math.round(variantPrice * template.mrpMultiplier);

          variants.push({
            sku: `ORE-${categorySlug.substring(0, 3).toUpperCase()}-${String(productCount).padStart(3, '0')}-${String(skuCounter).padStart(2, '0')}`,
            size,
            color: color.name,
            colorHex: color.hex,
            price: variantPrice,
            mrp: variantMrp,
            stock: randomBetween(0, 50),
            reservedStock: 0,
          });
        }
      }

      await prisma.product.create({
        data: {
          name,
          slug,
          description: `Premium export-quality ${name.toLowerCase()}. This premium factory-direct item offers exceptional value — manufactured with the same standards as international brands, now available at our store at a fraction of the retail price. Crafted with attention to detail and superior materials.`,
          categoryId,
          images: generateImageUrls(categorySlug, productCount),
          tags,
          exportBadge,
          isFeatured,
          variants: { create: variants },
        },
      });

      if (productCount % 10 === 0) {
        console.log(`  Created ${productCount} products...`);
      }
    }
  }

  // Create/Upsert admin users
  console.log('👤 Setting up admin users...');
  const adminPassword = await bcrypt.hash('admin123', 10);

  await prisma.user.upsert({
    where: { email: 'superadmin@orchidhub.in' },
    update: { role: 'super_admin', password: adminPassword },
    create: {
      name: 'Super Admin',
      email: 'superadmin@orchidhub.in',
      phone: '+919999999999',
      role: 'super_admin',
      password: adminPassword,
    },
  });

  await prisma.user.upsert({
    where: { email: 'admin@orchidhub.in' },
    update: { role: 'admin', password: adminPassword },
    create: {
      name: 'Admin',
      email: 'admin@orchidhub.in',
      phone: '+918888888888',
      role: 'admin',
      password: adminPassword,
    },
  });

  // Create sample coupons
  console.log('🎫 Creating coupons...');
  await prisma.coupon.createMany({
    data: [
      {
        code: 'WELCOME10',
        type: 'percentage',
        value: 10,
        minOrder: 499,
        maxDiscount: 200,
        usageLimit: 1000,
        usedCount: 0,
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        isActive: true,
      },
      {
        code: 'FLAT200',
        type: 'flat',
        value: 200,
        minOrder: 999,
        usageLimit: 500,
        usedCount: 0,
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
        isActive: true,
      },
      {
        code: 'ORCHID30',
        type: 'percentage',
        value: 30,
        minOrder: 1499,
        maxDiscount: 500,
        usageLimit: 200,
        usedCount: 0,
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        isActive: true,
      },
    ],
  });

  console.log(`\n✅ Seed complete! Created:`);
  console.log(`   ${CATEGORIES.length} categories`);
  console.log(`   ${productCount} products`);
  console.log(`   3 coupons`);
  console.log(`   1 admin user`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
