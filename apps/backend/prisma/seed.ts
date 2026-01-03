import { PrismaClient, Role, ProductStatus } from '../src/generated/prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const adapter = new PrismaMariaDb(process.env.DATABASE_URL);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding database...');
  await prisma.$connect();
  // 1. Create Users
  const salt = await bcrypt.genSalt();
  const password = await bcrypt.hash('admin123', salt);

  const adminEmail = 'admin@example.com';
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      firstName: 'Admin',
      lastName: 'User',
      password: password,
      role: Role.ADMIN,
      isActive: true,
    },
  });
  console.log({ admin });

  const customerEmail = 'customer@example.com';
  const customer = await prisma.user.upsert({
    where: { email: customerEmail },
    update: {},
    create: {
      email: customerEmail,
      firstName: 'John',
      lastName: 'Doe',
      password: password,
      role: Role.CUSTOMER,
      isActive: true,
    },
  });
  console.log({ customer });

  // 2. Create Categories (5 different domains)
  const electronics = await prisma.category.upsert({
    where: { slug: 'electronics' },
    update: {},
    create: {
      name: 'Electronics & Technology',
      slug: 'electronics',
      description: 'Latest gadgets, smartphones, laptops, and tech accessories',
    },
  });

  const fashion = await prisma.category.upsert({
    where: { slug: 'fashion-apparel' },
    update: {},
    create: {
      name: 'Fashion & Apparel',
      slug: 'fashion-apparel',
      description: 'Trendy clothing, shoes, and fashion accessories',
    },
  });

  const homeKitchen = await prisma.category.upsert({
    where: { slug: 'home-kitchen' },
    update: {},
    create: {
      name: 'Home & Kitchen',
      slug: 'home-kitchen',
      description: 'Home essentials, kitchen appliances, and decor',
    },
  });

  const sportsFitness = await prisma.category.upsert({
    where: { slug: 'sports-fitness' },
    update: {},
    create: {
      name: 'Sports & Fitness',
      slug: 'sports-fitness',
      description: 'Sports equipment, fitness gear, and athletic wear',
    },
  });

  const booksMedia = await prisma.category.upsert({
    where: { slug: 'books-media' },
    update: {},
    create: {
      name: 'Books & Media',
      slug: 'books-media',
      description: 'Books, e-books, audiobooks, and digital media',
    },
  });

  console.log('Categories created:', { electronics, fashion, homeKitchen, sportsFitness, booksMedia });

  // 3. Create Products - Electronics & Technology (8 products)
  const electronicsProducts = [
    { sku: 'IPHONE-15-PRO-256', name: 'iPhone 15 Pro 256GB', description: 'Apple iPhone 15 Pro with Titanium design, A17 Pro chip, 256GB storage', price: 999.99 },
    { sku: 'SAMSUNG-S24-ULTRA', name: 'Samsung Galaxy S24 Ultra', description: 'Samsung Galaxy S24 Ultra 512GB, S Pen included, AI-powered camera', price: 1199.99 },
    { sku: 'MACBOOK-PRO-14-M3', name: 'MacBook Pro 14" M3', description: 'Apple MacBook Pro 14-inch with M3 chip, 18GB RAM, 512GB SSD', price: 1999.00 },
    { sku: 'DELL-XPS-15-9530', name: 'Dell XPS 15 9530', description: 'Dell XPS 15 laptop, Intel i7-13700H, 16GB RAM, 1TB SSD, OLED display', price: 1899.99 },
    { sku: 'AIRPODS-PRO-2', name: 'AirPods Pro (2nd Gen)', description: 'Apple AirPods Pro with Active Noise Cancellation and Spatial Audio', price: 249.99 },
    { sku: 'SONY-WH-1000XM5', name: 'Sony WH-1000XM5 Headphones', description: 'Sony WH-1000XM5 wireless noise-canceling over-ear headphones', price: 399.99 },
    { sku: 'IPAD-AIR-M2', name: 'iPad Air M2', description: 'Apple iPad Air 11-inch with M2 chip, 256GB, Wi-Fi + Cellular', price: 899.99 },
    { sku: 'APPLE-WATCH-ULTRA', name: 'Apple Watch Ultra 2', description: 'Apple Watch Ultra 2, 49mm Titanium case, GPS + Cellular', price: 799.99 },
  ];

  // 4. Create Products - Fashion & Apparel (8 products)
  const fashionProducts = [
    { sku: 'NIKE-AIR-JORDAN-1', name: 'Nike Air Jordan 1 Retro High', description: 'Nike Air Jordan 1 Retro High OG, Men\'s Basketball Shoes, Black/White', price: 170.00 },
    { sku: 'ADIDAS-ULTRA-BOOST-22', name: 'Adidas Ultraboost 22', description: 'Adidas Ultraboost 22 Running Shoes, Primeknit upper, Boost midsole', price: 180.00 },
    { sku: 'LEVI-501-JEANS', name: 'Levi\'s 501 Original Fit Jeans', description: 'Levi\'s 501 Original Fit Jeans, Men\'s, Dark Blue Wash', price: 89.50 },
    { sku: 'TOMMY-HILFIGER-POLO', name: 'Tommy Hilfiger Classic Polo Shirt', description: 'Tommy Hilfiger Men\'s Classic Fit Polo Shirt, 100% Cotton', price: 65.00 },
    { sku: 'RAY-BAN-AVIATOR', name: 'Ray-Ban Aviator Classic', description: 'Ray-Ban Aviator Classic Sunglasses, RB3025, Gold Frame, Green Lens', price: 154.00 },
    { sku: 'MICHAEL-KORS-HANDBAG', name: 'Michael Kors Jet Set Tote', description: 'Michael Kors Jet Set Large Tote Bag, Leather, Crossbody Strap', price: 298.00 },
    { sku: 'CALVIN-KLEIN-JACKET', name: 'Calvin Klein Bomber Jacket', description: 'Calvin Klein Men\'s Bomber Jacket, Quilted, Water Resistant', price: 149.99 },
    { sku: 'VANS-OLD-SKOOL', name: 'Vans Old Skool Classic', description: 'Vans Old Skool Classic Skate Shoes, Black/White Checkerboard', price: 65.00 },
  ];

  // 5. Create Products - Home & Kitchen (8 products)
  const homeKitchenProducts = [
    { sku: 'INSTANT-POT-DUO', name: 'Instant Pot Duo 7-in-1', description: 'Instant Pot Duo 7-in-1 Electric Pressure Cooker, 6 Quart', price: 99.99 },
    { sku: 'KITCHENAID-STAND-MIXER', name: 'KitchenAid Artisan Stand Mixer', description: 'KitchenAid Artisan Series 5-Qt Stand Mixer, Empire Red', price: 379.99 },
    { sku: 'NINJA-BLENDER-PRO', name: 'Ninja Professional Blender', description: 'Ninja Professional Blender 1000W, 72oz Pitcher, 4 Auto-iQ Programs', price: 89.99 },
    { sku: 'DYSON-V15-DETECT', name: 'Dyson V15 Detect Vacuum', description: 'Dyson V15 Detect Cordless Vacuum, Laser Dust Detection, HEPA Filter', price: 749.99 },
    { sku: 'KEURIG-K-CLASSIC', name: 'Keurig K-Classic Coffee Maker', description: 'Keurig K-Classic Single-Serve K-Cup Pod Coffee Maker, Black', price: 99.99 },
    { sku: 'LODGE-CAST-IRON-SKILLET', name: 'Lodge Cast Iron Skillet 12"', description: 'Lodge Pre-Seasoned Cast Iron Skillet, 12-inch, Black', price: 29.99 },
    { sku: 'OXO-GOOD-GRIPS-CAN-OPENER', name: 'OXO Good Grips Can Opener', description: 'OXO Good Grips Smooth Edge Can Opener, Safety Lid Lifter', price: 19.99 },
    { sku: 'PHILIPS-HUE-STARTER', name: 'Philips Hue White & Color Starter Kit', description: 'Philips Hue White and Color Ambiance Starter Kit, 3 A19 Bulbs + Hub', price: 199.99 },
  ];

  // 6. Create Products - Sports & Fitness (8 products)
  const sportsFitnessProducts = [
    { sku: 'PELOTON-BIKE', name: 'Peloton Bike', description: 'Peloton Original Bike, 21.5" HD Touchscreen, Live & On-Demand Classes', price: 1445.00 },
    { sku: 'BOWFLEX-XTREME-2SE', name: 'Bowflex Xtreme 2 SE Home Gym', description: 'Bowflex Xtreme 2 SE Home Gym, 210 lbs Resistance, 70 Exercises', price: 999.99 },
    { sku: 'YETI-RAMBLER-30OZ', name: 'Yeti Rambler 30oz Tumbler', description: 'Yeti Rambler 30oz Tumbler with Handle, Vacuum Insulated, Stainless Steel', price: 45.00 },
    { sku: 'NORDICTRACK-TREADMILL', name: 'NordicTrack T Series Treadmill', description: 'NordicTrack T 6.5 S Treadmill, 10" Smart HD Touchscreen, iFit Enabled', price: 999.99 },
    { sku: 'RENPHO-SCALE-BLUE', name: 'RENPHO Smart Scale', description: 'RENPHO Smart Scale for Body Weight, Digital Bathroom Scale, Bluetooth', price: 29.99 },
    { sku: 'LULULEMON-ALIGN-LEGGINGS', name: 'Lululemon Align High-Rise Leggings', description: 'Lululemon Align High-Rise Leggings 25", Nulu Fabric, Black', price: 98.00 },
    { sku: 'GARMIN-FORERUNNER-255', name: 'Garmin Forerunner 255', description: 'Garmin Forerunner 255 GPS Running Watch, Music, Advanced Training', price: 349.99 },
    { sku: 'PRO-FORM-CYCLING-BIKE', name: 'ProForm Studio Bike Pro 22', description: 'ProForm Studio Bike Pro 22, 22" HD Touchscreen, iFit Enabled', price: 999.99 },
  ];

  // 7. Create Products - Books & Media (8 products)
  const booksMediaProducts = [
    { sku: 'ATOMIC-HABITS-BOOK', name: 'Atomic Habits by James Clear', description: 'Atomic Habits: An Easy & Proven Way to Build Good Habits & Break Bad Ones', price: 27.00 },
    { sku: 'SAPIENS-BOOK', name: 'Sapiens by Yuval Noah Harari', description: 'Sapiens: A Brief History of Humankind, Hardcover Edition', price: 23.00 },
    { sku: 'KINDLE-PAPERWHITE', name: 'Kindle Paperwhite', description: 'Amazon Kindle Paperwhite, 6.8" Display, 8GB, Waterproof, Wi-Fi', price: 139.99 },
    { sku: 'AUDIBLE-MEMBERSHIP', name: 'Audible Premium Plus Membership', description: 'Audible Premium Plus 12-Month Membership, 1 Credit per Month', price: 149.50 },
    { sku: 'HARRY-POTTER-BOX-SET', name: 'Harry Potter Complete Box Set', description: 'Harry Potter Complete Collection: All 7 Books, Paperback Box Set', price: 69.99 },
    { sku: 'THE-7-HABITS-BOOK', name: 'The 7 Habits of Highly Effective People', description: 'The 7 Habits of Highly Effective People: Powerful Lessons in Personal Change', price: 15.99 },
    { sku: 'DUNE-BOOK-SERIES', name: 'Dune Chronicles Box Set', description: 'Dune Chronicles: The Complete 6-Book Series by Frank Herbert, Paperback', price: 89.99 },
    { sku: 'MASTERCLASS-ANNUAL', name: 'MasterClass Annual Membership', description: 'MasterClass Annual Membership, Learn from World-Class Instructors', price: 180.00 },
  ];

  // Create all products
  const allProducts = [
    ...electronicsProducts.map(p => ({ ...p, categoryId: electronics.id })),
    ...fashionProducts.map(p => ({ ...p, categoryId: fashion.id })),
    ...homeKitchenProducts.map(p => ({ ...p, categoryId: homeKitchen.id })),
    ...sportsFitnessProducts.map(p => ({ ...p, categoryId: sportsFitness.id })),
    ...booksMediaProducts.map(p => ({ ...p, categoryId: booksMedia.id })),
  ];

  const createdProducts: any[] = [];
  for (const product of allProducts) {
    const created = await prisma.product.upsert({
      where: { sku: product.sku },
      update: {},
      create: {
        name: product.name,
        sku: product.sku,
        description: product.description,
        price: product.price,
        stock: 20,
        status: ProductStatus.ACTIVE,
        categoryId: product.categoryId,
      },
    });
    createdProducts.push(created);
  }

  console.log(`Created ${createdProducts.length} products across 5 categories`);

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
