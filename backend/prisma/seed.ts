import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// ─── Seed Data ─────────────────────────────────────────────────────────────

const CATEGORY_STRUCTURE = [
  {
    name: 'NEW BORN',
    slug: 'new-born',
    description: 'Essential items for your little ones',
    sortOrder: 1,
    children: [
      'Cap', 'Glouses', 'Burp cloth', 'Towels', 'Button jabla', 'Rope jabla', 
      'Half sleeve jabla set', 'Full sleeve jabla set', 'Sleeveless jabla set', 
      'Rope frocks', 'Front open frocks', 'Muslin front open sets', 
      'Muslin frocks', 'Muslin blankets', 'Muslin swaddle', 'Padded undies', 'Hooded towel'
    ]
  },
  {
    name: 'GIRLS',
    slug: 'girls',
    description: 'Stylish and comfortable wear for girls',
    sortOrder: 2,
    children: [
      'Frocks', 'Skirts', 'Pants', 'Leggings', 'Tights', 'Palazzo pants', 
      'Slips', 'Underwear', 'Shorts', '3/4 pants'
    ]
  },
  {
    name: 'BOYS',
    slug: 'boys',
    description: 'Durable and cool clothing for boys',
    sortOrder: 3,
    children: [
      'T shirts', 'Pants', 'Shorts', 'Underwear', '3/4 pants', 
      'Loobknit rib pants', 'Fine pants', 'Trunks', 
      'Half sleeve cord sets', 'Collerd cordset', 'Full sleeve co ords', 'Sleeveless co ords'
    ]
  },
  {
    name: 'WOMEN',
    slug: 'women',
    description: 'Modern and comfort-focused women\'s wear',
    sortOrder: 4,
    children: [
      'T SHIRTS', 'Full pants', 'Shorts', 'Leggings', '3/4 pants', 
      'Long polos', 'Feeding dresses', 'Dresses', 'Underwear', 'Tights'
    ]
  },
  {
    name: 'MENS',
    slug: 'mens',
    description: 'Quality essentials for men',
    sortOrder: 5,
    children: [
      'T shirts', 'Shorts', 'Full pants', 'Joggers', 'Underwear', 'Trunks'
    ]
  }
];

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
  'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&h=800&fit=crop',
  'https://images.unsplash.com/photo-1434389678369-1822d54e50dc?w=600&h=800&fit=crop',
  'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=600&h=800&fit=crop',
  'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=600&h=800&fit=crop',
  'https://images.unsplash.com/photo-1509319117193-57bab727e09d?w=600&h=800&fit=crop',
  'https://images.unsplash.com/photo-1539008835657-9e8e9680c956?w=600&h=800&fit=crop',
  'https://images.unsplash.com/photo-1550614000-4b95d41b6375?w=600&h=800&fit=crop',
  'https://images.unsplash.com/photo-1559551409-dadc959f76b8?w=600&h=800&fit=crop',
  'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&h=800&fit=crop',
  'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&h=800&fit=crop',
  'https://images.unsplash.com/photo-1618244972963-dbee1a7edc95?w=600&h=800&fit=crop',
  'https://images.unsplash.com/photo-1584370848010-d7fe6bc767eb?w=600&h=800&fit=crop',
];

function generateImageUrls(index: number): string[] {
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

  // Create categories and subcategories
  console.log('📁 Creating category hierarchy...');
  let productCount = 0;

  for (const parent of CATEGORY_STRUCTURE) {
    const parentCategory = await prisma.category.create({
      data: {
        name: parent.name,
        slug: parent.slug,
        description: parent.description,
        sortOrder: parent.sortOrder,
      }
    });

    console.log(`  Creating subcategories for ${parent.name}...`);
    for (const childName of parent.children) {
      const childSlug = `${parent.slug}-${childName.toLowerCase().replace(/\s+/g, '-')}`;
      const childCategory = await prisma.category.create({
        data: {
          name: childName,
          slug: childSlug,
          parentId: parentCategory.id,
          description: `Quality ${childName.toLowerCase()} for ${parent.name.toLowerCase()}`,
        }
      });

      // Create 2-3 sample products for EACH subcategory to show them in action
      const numProducts = randomBetween(2, 3);
      for (let i = 0; i < numProducts; i++) {
        productCount++;
        const productName = `${childName} - Style ${i + 1}`;
        const slug = generateSlug(productName, productCount);
        const basePrice = randomBetween(299, 1499);
        const mrpMultiplier = 2.2;
        
        const productColors = pickRandom(COLORS, randomBetween(2, 3));
        const productSizes = pickRandom(SIZES, randomBetween(3, 5));

        const variants = [];
        let skuCounter = 0;
        for (const color of productColors) {
          for (const size of productSizes) {
            skuCounter++;
            variants.push({
              sku: `ORE-${childSlug.substring(0, 5).toUpperCase()}-${String(productCount).padStart(3, '0')}-${skuCounter}`,
              size,
              color: color.name,
              colorHex: color.hex,
              price: basePrice,
              mrp: Math.round(basePrice * mrpMultiplier),
              stock: randomBetween(5, 100),
            });
          }
        }

        await prisma.product.create({
          data: {
            name: productName,
            slug,
            description: `Premium export-quality ${productName.toLowerCase()}. Factory-direct and crafted with superior materials.`,
            categoryId: childCategory.id,
            images: generateImageUrls(productCount),
            tags: [parent.name.toLowerCase(), childName.toLowerCase()],
            exportBadge: Math.random() > 0.4,
            isFeatured: Math.random() > 0.8,
            variants: { create: variants },
          }
        });
      }
    }
  }

  // Admin users
  const adminPassword = await bcrypt.hash('admin123', 10);
  await prisma.user.upsert({
    where: { email: 'superadmin@orchidhub.in' },
    update: { role: 'super_admin', password: adminPassword },
    create: { name: 'Super Admin', email: 'superadmin@orchidhub.in', role: 'super_admin', password: adminPassword },
  });

  console.log(`\n✅ Seed complete! Created:`);
  console.log(`   ${CATEGORY_STRUCTURE.length} parent categories`);
  console.log(`   ${productCount} products across all subcategories`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
