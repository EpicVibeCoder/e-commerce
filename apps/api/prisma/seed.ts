import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcrypt";
import { Prisma, PrismaClient, ProductStatus, Role } from "../src/generated/prisma/client.js";
import { config } from "dotenv";
import { join } from "node:path";


config({ path: join(__dirname, "../../.env") }); // monorepo root .env


/** Demo password for local / portfolio reviewers — change in production. */
export const DEMO_PASSWORD = "DemoPassword123!";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function upsertCategory(slug: string, name: string, sortOrder: number, parentId?: string) {
      return prisma.category.upsert({
            where: { slug },
            create: { slug, name, sortOrder, parentId: parentId ?? null },
            update: { name, sortOrder, parentId: parentId ?? null },
      });
}

async function upsertProduct(data: {
      sku: string;
      name: string;
      description: string;
      price: string;
      stock: number;
      categoryId: string;
      status?: ProductStatus;
}) {
      return prisma.product.upsert({
            where: { sku: data.sku },
            create: {
                  sku: data.sku,
                  name: data.name,
                  description: data.description,
                  price: new Prisma.Decimal(data.price),
                  stock: data.stock,
                  categoryId: data.categoryId,
                  status: data.status ?? ProductStatus.active,
            },
            update: {
                  name: data.name,
                  description: data.description,
                  price: new Prisma.Decimal(data.price),
                  stock: data.stock,
                  categoryId: data.categoryId,
                  status: data.status ?? ProductStatus.active,
            },
      });
}

async function main() {
      const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);

      await prisma.user.upsert({
            where: { email: "admin@demo.local" },
            create: {
                  email: "admin@demo.local",
                  passwordHash,
                  name: "Demo Admin",
                  role: Role.admin,
            },
            update: { passwordHash, name: "Demo Admin", role: Role.admin },
      });

      await prisma.user.upsert({
            where: { email: "demo@customer.com" },
            create: {
                  email: "demo@customer.com",
                  passwordHash,
                  name: "Demo Customer",
                  role: Role.customer,
            },
            update: {
                  passwordHash,
                  name: "Demo Customer",
                  role: Role.customer,
            },
      });

      const electronics = await upsertCategory("electronics", "Electronics", 1);
      const clothing = await upsertCategory("clothing", "Clothing", 2);
      const home = await upsertCategory("home-garden", "Home & Garden", 3);

      const phones = await upsertCategory("phones", "Phones", 1, electronics.id);
      const laptops = await upsertCategory("laptops", "Laptops", 2, electronics.id);
      const phoneAccessories = await upsertCategory("phone-accessories", "Phone Accessories", 3, phones.id);

      const mens = await upsertCategory("mens", "Men's", 1, clothing.id);
      const womens = await upsertCategory("womens", "Women's", 2, clothing.id);

      const kitchen = await upsertCategory("kitchen", "Kitchen", 1, home.id);

      const products: Parameters<typeof upsertProduct>[0][] = [
            {
                  sku: "PHONE-001",
                  name: "Aurora X Pro",
                  description: '6.7" OLED, 256GB, dual SIM.',
                  price: "899.00",
                  stock: 42,
                  categoryId: phones.id,
            },
            {
                  sku: "PHONE-002",
                  name: "Nova Mini",
                  description: 'Compact 5.4" phone with all-day battery.',
                  price: "449.00",
                  stock: 78,
                  categoryId: phones.id,
            },
            {
                  sku: "ACC-001",
                  name: "USB-C Fast Charger 65W",
                  description: "GaN charger for phones and laptops.",
                  price: "39.99",
                  stock: 200,
                  categoryId: phoneAccessories.id,
            },
            {
                  sku: "ACC-002",
                  name: "MagSafe Slim Case",
                  description: "Shock-absorbing case with magnetic mount.",
                  price: "24.50",
                  stock: 150,
                  categoryId: phoneAccessories.id,
            },
            {
                  sku: "ACC-003",
                  name: "Wireless Earbuds Pro",
                  description: "ANC earbuds with 32h total battery.",
                  price: "129.00",
                  stock: 95,
                  categoryId: phoneAccessories.id,
            },
            {
                  sku: "LAP-001",
                  name: "DevBook 14",
                  description: '14" laptop, 16GB RAM, 512GB SSD.',
                  price: "1199.00",
                  stock: 25,
                  categoryId: laptops.id,
            },
            {
                  sku: "LAP-002",
                  name: "UltraSlim 15",
                  description: 'Lightweight 15" for travel and meetings.',
                  price: "999.00",
                  stock: 18,
                  categoryId: laptops.id,
            },
            {
                  sku: "LAP-003",
                  name: "Creator Studio 16",
                  description: '16" display, dedicated GPU for design work.',
                  price: "1899.00",
                  stock: 8,
                  categoryId: laptops.id,
            },
            {
                  sku: "MEN-001",
                  name: "Classic Oxford Shirt",
                  description: "Cotton blend, regular fit.",
                  price: "49.99",
                  stock: 120,
                  categoryId: mens.id,
            },
            {
                  sku: "MEN-002",
                  name: "Slim Chino Pants",
                  description: "Stretch fabric, multiple colors.",
                  price: "59.00",
                  stock: 85,
                  categoryId: mens.id,
            },
            {
                  sku: "MEN-003",
                  name: "Wool Blend Overcoat",
                  description: "Warm winter coat, tailored cut.",
                  price: "189.00",
                  stock: 30,
                  categoryId: mens.id,
            },
            {
                  sku: "WOM-001",
                  name: "Linen Midi Dress",
                  description: "Breathable summer dress.",
                  price: "79.50",
                  stock: 64,
                  categoryId: womens.id,
            },
            {
                  sku: "WOM-002",
                  name: "High-Rise Denim Jeans",
                  description: "Comfort stretch denim.",
                  price: "69.00",
                  stock: 90,
                  categoryId: womens.id,
            },
            {
                  sku: "WOM-003",
                  name: "Cashmere Knit Sweater",
                  description: "Soft crew-neck sweater.",
                  price: "99.00",
                  stock: 45,
                  categoryId: womens.id,
            },
            {
                  sku: "KIT-001",
                  name: "Stainless Steel Cookware Set",
                  description: "10-piece set with glass lids.",
                  price: "149.99",
                  stock: 40,
                  categoryId: kitchen.id,
            },
            {
                  sku: "KIT-002",
                  name: "Ceramic Non-Stick Pan",
                  description: "28cm frying pan, induction ready.",
                  price: "44.00",
                  stock: 110,
                  categoryId: kitchen.id,
            },
            {
                  sku: "KIT-003",
                  name: "Electric Kettle 1.7L",
                  description: "Rapid boil with auto shut-off.",
                  price: "34.99",
                  stock: 75,
                  categoryId: kitchen.id,
            },
            {
                  sku: "DRAFT-001",
                  name: "Upcoming Smart Watch",
                  description: "Not yet released — draft listing.",
                  price: "299.00",
                  stock: 0,
                  categoryId: electronics.id,
                  status: ProductStatus.draft,
            },
      ];

      for (const product of products) {
            await upsertProduct(product);
      }

      console.log("Seed complete.");
      console.log("  Admin:    admin@demo.local");
      console.log("  Customer: demo@customer.com");
      console.log(`  Password: ${DEMO_PASSWORD}`);
      console.log(`  Categories: 3 roots, depth up to 3 (e.g. Electronics → Phones → Phone Accessories)`);
      console.log(`  Products: ${products.length} (including 1 draft)`);
}

main()
      .catch((error) => {
            console.error("Seed failed:", error);
            process.exit(1);
      })
      .finally(async () => {
            await prisma.$disconnect();
            await pool.end();
      });
