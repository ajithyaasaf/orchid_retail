import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ─── Seed Data ─────────────────────────────────────────────────────────────

const CATEGORIES = [
  { name: "Women's Tops", slug: 'women-tops', description: 'Export-quality tops, blouses, and shirts for women', sortOrder: 1 },
  { name: "Women's Dresses", slug: 'women-dresses', description: 'Elegant dresses and gowns at surplus prices', sortOrder: 2 },
  { name: "Women's Bottoms", slug: 'women-bottoms', description: 'Jeans, trousers, skirts, and palazzos', sortOrder: 3 },
  { name: "Men's Shirts", slug: 'men-shirts', description: 'Premium export-quality shirts for men', sortOrder: 4 },
  { name: "Men's Trousers", slug: 'men-trousers', description: 'Formal and casual trousers for men', sortOrder: 5 },
  { name: "Kids' Wear", slug: 'kids-wear', description: 'Comfortable and stylish clothes for children', sortOrder: 6 },
  { name: 'Accessories', slug: 'accessories', description: 'Bags, scarves, belts, and fashion accessories', sortOrder: 7 },
  { name: 'Footwear', slug: 'footwear', description: 'Shoes, sandals, and sneakers', sortOrder: 8 },
];

const PRODUCT_TEMPLATES: Record<string, { names: string[]; tags: string[]; priceRange: [number, number]; mrpMultiplier: number }> = {
  'women-tops': {
    names: ['Floral Print Blouse', 'Cotton Casual Top', 'Embroidered Peasant Top', 'V-Neck Wrap Top', 'Ruffle Sleeve Blouse', 'Striped Linen Shirt', 'Off-Shoulder Crop Top', 'Button-Down Oxford Shirt', 'Peplum Lace Top', 'Tie-Front Knot Blouse', 'Printed Rayon Tunic', 'Pleated Chiffon Blouse', 'Mandarin Collar Top', 'Polka Dot Pussy Bow Blouse', 'Satin Camisole Top', 'Boho Print Kaftan Top', 'Denim Chambray Shirt', 'Asymmetric Hem Top', 'Gingham Check Blouse', 'Smocked Bodice Top', 'Lace Panel Insert Top', 'Color Block Tunic', 'Pintuck Cotton Blouse', 'Boyfriend Fit Shirt', 'Surplice Wrap Blouse'],
    tags: ['casual', 'formal', 'party', 'office', 'ethnic'],
    priceRange: [399, 1299],
    mrpMultiplier: 2.5,
  },
  'women-dresses': {
    names: ['Floral Maxi Dress', 'A-Line Midi Dress', 'Bodycon Party Dress', 'Shirt Dress with Belt', 'Wrap Around Dress', 'Tiered Boho Dress', 'Fit and Flare Dress', 'Pleated Cocktail Dress', 'Embroidered Kurta Dress', 'Slip Dress Satin', 'Off-Shoulder Maxi Dress', 'Denim Shirt Dress', 'Lace Overlay Dress', 'Smocked Waist Dress', 'Printed Shift Dress', 'Ruffled Hem Midi', 'Halter Neck Dress', 'Blazer Style Dress', 'Sweater Knit Dress', 'Pin Stripe Formal Dress', 'Cutwork Cotton Dress', 'Puff Sleeve Mini Dress', 'Tropical Print Dress', 'Button-Through Dress', 'Gathered Waist Dress'],
    tags: ['casual', 'party', 'wedding', 'boho', 'formal'],
    priceRange: [699, 2499],
    mrpMultiplier: 2.8,
  },
  'women-bottoms': {
    names: ['High-Rise Skinny Jeans', 'Wide Leg Palazzo', 'Cigarette Trousers', 'Pleated Culottes', 'A-Line Midi Skirt', 'Cargo Jogger Pants', 'Paper Bag Waist Trouser', 'Pencil Skirt', 'Bootcut Flare Jeans', 'Linen Straight Pants', 'Printed Palazzo Set', 'Corduroy Trousers', 'Denim Shorts', 'Wrap Front Skirt', 'High-Waist Mom Jeans', 'Harem Pants', 'Layered Tulle Skirt', 'Straight Fit Chinos', 'Embroidered Ankle Pants', 'Knit Ribbed Skirt', 'Distressed Boyfriend Jeans', 'Paperbag Shorts', 'Tiered Maxi Skirt', 'Cropped Flare Jeans', 'Jacquard Wide Leg Pants'],
    tags: ['casual', 'formal', 'denim', 'ethnic', 'lounge'],
    priceRange: [499, 1799],
    mrpMultiplier: 2.5,
  },
  'men-shirts': {
    names: ['Oxford Cotton Shirt', 'Slim Fit Formal Shirt', 'Checked Flannel Shirt', 'Linen Casual Shirt', 'Mandarin Collar Shirt', 'Printed Hawaiian Shirt', 'Denim Shirt', 'Structured Dress Shirt', 'Band Collar Shirt', 'Micro Print Shirt', 'Seersucker Summer Shirt', 'Double Pocket Shirt', 'Stretch Poplin Shirt', 'Chambray Work Shirt', 'French Cuff Shirt', 'Brushed Twill Shirt', 'Cutaway Collar Shirt', 'Short Sleeve Camp Shirt', 'Vertical Stripe Shirt', 'Herringbone Dress Shirt', 'Cuban Collar Shirt', 'Oversized Relaxed Shirt', 'Dobby Weave Shirt', 'Gingham Button-Down', 'Garment Dyed Shirt'],
    tags: ['formal', 'casual', 'party', 'office', 'summer'],
    priceRange: [499, 1499],
    mrpMultiplier: 2.5,
  },
  'men-trousers': {
    names: ['Slim Fit Chinos', 'Formal Pleated Trousers', 'Cargo Pants', 'Jogger Pants', 'Straight Fit Jeans', 'Linen Drawstring Pants', 'Tailored Wool Trousers', 'Stretch Cotton Pants', 'Flat Front Dress Pants', 'Corduroy Trousers', 'Relaxed Fit Jeans', 'Ankle-Length Trousers', 'Track Pants', 'Bermuda Shorts', 'Cropped Pants', 'Selvedge Denim Jeans', 'Twill Work Pants', 'Pinstripe Trousers', 'Tech Fabric Pants', 'Pleated Wide-Leg Pants', 'Brushed Fleece Joggers', 'Tapered Fit Trousers', 'Patchwork Denim Jeans', 'Drawstring Linen Shorts', 'Slub Cotton Pants'],
    tags: ['formal', 'casual', 'denim', 'sports', 'lounge'],
    priceRange: [599, 1699],
    mrpMultiplier: 2.5,
  },
  'kids-wear': {
    names: ['Printed T-Shirt Set', 'Dungaree with T-Shirt', 'Floral Frock', 'Shorts & Tee Combo', 'Embroidered Kurta Set', 'Striped Polo T-Shirt', 'Denim Jacket Set', 'Tutu Dress', 'Cargo Shorts Set', 'Leggings & Top Set', 'Animal Print Romper', 'Party Wear Dress', 'Track Suit', 'Cotton Pajama Set', 'Checked Shirt & Shorts', 'Ruffled Tunic Set', 'Fleece Hoodie Set', 'Ethnic Wear Set', 'Rain Jacket & Pants', 'Sequin Work Dress', 'Sports Jersey Set', 'Knit Cardigan Set', 'Printed Jumpsuit', 'Bow Detail Dress', 'Camouflage Cargo Set'],
    tags: ['casual', 'party', 'ethnic', 'sleepwear', 'sports'],
    priceRange: [349, 1099],
    mrpMultiplier: 3.0,
  },
  'accessories': {
    names: ['Printed Silk Scarf', 'Leather Crossbody Bag', 'Woven Tote Bag', 'Statement Belt', 'Beanie Cap', 'Sunglasses Classic', 'Pearl Earrings Set', 'Canvas Backpack', 'Silk Hair Scrunchie Set', 'Leather Wallet', 'Charm Bracelet', 'Emboidered Clutch', 'Cotton Bandana Set', 'Bucket Hat', 'Layered Necklace', 'Keychain Pouch', 'Geometric Drop Earrings', 'Mini Sling Bag', 'Hair Claw Clip Set', 'Printed Phone Pouch', 'Coin Purse', 'Straw Beach Bag', 'Metal Bangle Set', 'Travel Wash Bag', 'Reversible Belt'],
    tags: ['bags', 'jewellery', 'hair', 'travel', 'fashion'],
    priceRange: [199, 999],
    mrpMultiplier: 3.0,
  },
  'footwear': {
    names: ['Canvas Sneakers', 'Leather Loafers', 'Strappy Block Heels', 'Flat Sandals', 'Running Shoes', 'Ankle Boots', 'Slide Slippers', 'Oxford Brogues', 'Platform Wedges', 'Kolhapuri Chappals', 'High-Top Sneakers', 'Ballet Flats', 'Espadrilles', 'Chelsea Boots', 'Gladiator Sandals', 'Mule Heels', 'Boat Shoes', 'Flip Flops', 'Kitten Heel Pumps', 'Chunky Dad Sneakers', 'Woven Juttis', 'Cork Sole Sandals', 'Peep Toe Heels', 'Slip-On Loafers', 'Trail Hiking Shoes'],
    tags: ['casual', 'formal', 'sports', 'party', 'ethnic'],
    priceRange: [399, 1999],
    mrpMultiplier: 2.5,
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

// Placeholder image URLs (will be replaced with Cloudinary URLs later)
function generateImageUrls(category: string, index: number): string[] {
  const base = `https://placehold.co/600x800/f5f5f5/E8007A?text=${encodeURIComponent(category.replace('-', '+'))}+${index}`;
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
  await prisma.address.deleteMany();
  await prisma.user.deleteMany();

  // Create categories
  console.log('📁 Creating categories...');
  const categoryMap: Record<string, string> = {};
  for (const cat of CATEGORIES) {
    const created = await prisma.category.create({ data: cat });
    categoryMap[cat.slug] = created.id;
  }

  // Create products with variants
  console.log('📦 Creating 200 products with variants...');
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
          description: `Premium export-quality ${name.toLowerCase()}. This surplus item offers exceptional value — originally manufactured for international brands, now available at our store at a fraction of the retail price. Crafted with attention to detail and superior materials.`,
          categoryId,
          images: generateImageUrls(categorySlug, productCount),
          tags,
          exportBadge,
          isFeatured,
          variants: { create: variants },
        },
      });

      if (productCount % 50 === 0) {
        console.log(`  Created ${productCount} products...`);
      }
    }
  }

  // Create admin user
  console.log('👤 Creating admin user...');
  await prisma.user.create({
    data: {
      name: 'Admin',
      email: 'admin@orchidsurplus.com',
      phone: '+919999999999',
      role: 'admin',
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
        code: 'SURPLUS30',
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
