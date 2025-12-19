/**
 * Database Seed Script
 * Creates sample reseller, venue, menu, and tables for testing
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create default reseller
  const reseller = await prisma.reseller.upsert({
    where: { subdomain: "demo" },
    update: {},
    create: {
      id: "reseller_demo",
      name: "Demo Restaurant Group",
      subdomain: "demo",
      status: "active",
      qrSigningSecret: "demo-secret-change-in-production",
      branding: {
        logo: "https://via.placeholder.com/200x80?text=Demo+Resto",
        primaryColor: "#FF6B35",
        secondaryColor: "#004E89",
        fontFamily: "Inter",
      },
      settings: {
        defaultLocale: "en",
        supportedLocales: ["en", "es"],
        timezone: "America/New_York",
      },
    },
  });

  console.log("✅ Created reseller:", reseller.name);

  // Create venue
  const venue = await prisma.venue.upsert({
    where: { id: "venue_demo_bistro" },
    update: {},
    create: {
      id: "venue_demo_bistro",
      resellerId: reseller.id,
      name: "The Modern Bistro",
      slug: "modern-bistro",
      description: "Fine dining with a contemporary twist",
      logo: "https://via.placeholder.com/300?text=Modern+Bistro",
      status: "active",
      settings: {
        currency: "USD",
        taxRate: 8.5,
        serviceChargeRate: 10,
        languages: ["en", "es"],
        timezone: "America/New_York",
      },
    },
  });

  console.log("✅ Created venue:", venue.name);

  // Create branch
  const branch = await prisma.branch.upsert({
    where: { id: "branch_downtown" },
    update: {},
    create: {
      id: "branch_downtown",
      venueId: venue.id,
      name: "Downtown Location",
      address: "123 Main Street, New York, NY 10001",
      phone: "+1-555-0123",
      email: "downtown@modernbistro.com",
      status: "active",
      openingHours: {
        monday: { open: "11:00", close: "22:00" },
        tuesday: { open: "11:00", close: "22:00" },
        wednesday: { open: "11:00", close: "22:00" },
        thursday: { open: "11:00", close: "22:00" },
        friday: { open: "11:00", close: "23:00" },
        saturday: { open: "10:00", close: "23:00" },
        sunday: { open: "10:00", close: "21:00" },
      },
    },
  });

  console.log("✅ Created branch:", branch.name);

  // Create tables
  const tables = [];
  for (let i = 1; i <= 15; i++) {
    const area = i <= 8 ? "indoor" : i <= 12 ? "terrace" : "bar";
    const table = await prisma.table.upsert({
      where: { id: `table_${i}` },
      update: {},
      create: {
        id: `table_${i}`,
        branchId: branch.id,
        tableNumber: `T${i}`,
        area,
        capacity: i <= 8 ? 4 : i <= 12 ? 2 : 6,
        status: "available",
        qrVersion: 1,
      },
    });
    tables.push(table);
  }

  console.log(`✅ Created ${tables.length} tables`);

  // Create menu categories
  const appetizers = await prisma.menuCategory.create({
    data: {
      venueId: venue.id,
      name: { en: "Appetizers", es: "Entrantes" },
      description: {
        en: "Start your meal right",
        es: "Comienza bien tu comida",
      },
      displayOrder: 1,
      isActive: true,
    },
  });

  const mains = await prisma.menuCategory.create({
    data: {
      venueId: venue.id,
      name: { en: "Main Courses", es: "Platos Principales" },
      description: {
        en: "Our signature dishes",
        es: "Nuestros platos insignia",
      },
      displayOrder: 2,
      isActive: true,
    },
  });

  const desserts = await prisma.menuCategory.create({
    data: {
      venueId: venue.id,
      name: { en: "Desserts", es: "Postres" },
      description: { en: "Sweet endings", es: "Finales dulces" },
      displayOrder: 3,
      isActive: true,
    },
  });

  const drinks = await prisma.menuCategory.create({
    data: {
      venueId: venue.id,
      name: { en: "Beverages", es: "Bebidas" },
      description: { en: "Refreshments", es: "Refrescos" },
      displayOrder: 4,
      isActive: true,
    },
  });

  console.log("✅ Created menu categories");

  // Create menu items
  await prisma.menuItem.createMany({
    data: [
      // Appetizers
      {
        categoryId: appetizers.id,
        name: { en: "Bruschetta", es: "Bruschetta" },
        description: {
          en: "Toasted bread with tomatoes, garlic, and basil",
          es: "Pan tostado con tomates, ajo y albahaca",
        },
        price: 12.99,
        images: ["https://via.placeholder.com/400?text=Bruschetta"],
        isActive: true,
        isAvailable: true,
        displayOrder: 1,
        tags: ["vegetarian"],
        allergens: ["gluten"],
        modifierGroups: [],
      },
      {
        categoryId: appetizers.id,
        name: { en: "Calamari", es: "Calamares" },
        description: {
          en: "Crispy fried squid with lemon aioli",
          es: "Calamares fritos crujientes con alioli de limón",
        },
        price: 15.99,
        images: ["https://via.placeholder.com/400?text=Calamari"],
        isActive: true,
        isAvailable: true,
        displayOrder: 2,
        tags: ["seafood"],
        allergens: ["shellfish", "gluten"],
        modifierGroups: [
          {
            id: "spice_level",
            name: { en: "Spice Level", es: "Nivel de Picante" },
            required: false,
            min: 0,
            max: 1,
            options: [
              { id: "mild", name: { en: "Mild", es: "Suave" }, price: 0 },
              { id: "medium", name: { en: "Medium", es: "Medio" }, price: 0 },
              { id: "hot", name: { en: "Hot", es: "Picante" }, price: 0 },
            ],
          },
        ],
      },
      // Mains
      {
        categoryId: mains.id,
        name: { en: "Grilled Salmon", es: "Salmón a la Parrilla" },
        description: {
          en: "Fresh Atlantic salmon with seasonal vegetables",
          es: "Salmón atlántico fresco con verduras de temporada",
        },
        price: 28.99,
        images: ["https://via.placeholder.com/400?text=Salmon"],
        isActive: true,
        isAvailable: true,
        displayOrder: 1,
        tags: ["seafood", "gluten-free"],
        allergens: ["fish"],
        modifierGroups: [
          {
            id: "cooking",
            name: { en: "Cooking Preference", es: "Preferencia de Cocción" },
            required: true,
            min: 1,
            max: 1,
            options: [
              { id: "rare", name: { en: "Rare", es: "Poco Hecho" }, price: 0 },
              { id: "medium", name: { en: "Medium", es: "Medio" }, price: 0 },
              {
                id: "well",
                name: { en: "Well Done", es: "Bien Hecho" },
                price: 0,
              },
            ],
          },
        ],
      },
      {
        categoryId: mains.id,
        name: { en: "Ribeye Steak", es: "Bistec de Costilla" },
        description: {
          en: "12oz prime ribeye with mashed potatoes",
          es: "Costilla premium de 12oz con puré de papas",
        },
        price: 42.99,
        images: ["https://via.placeholder.com/400?text=Steak"],
        isActive: true,
        isAvailable: true,
        displayOrder: 2,
        tags: ["premium"],
        allergens: ["dairy"],
        modifierGroups: [],
      },
      // Desserts
      {
        categoryId: desserts.id,
        name: { en: "Tiramisu", es: "Tiramisú" },
        description: {
          en: "Classic Italian dessert with coffee and mascarpone",
          es: "Postre italiano clásico con café y mascarpone",
        },
        price: 9.99,
        images: ["https://via.placeholder.com/400?text=Tiramisu"],
        isActive: true,
        isAvailable: true,
        displayOrder: 1,
        tags: ["vegetarian"],
        allergens: ["dairy", "eggs", "gluten"],
        modifierGroups: [],
      },
      // Drinks
      {
        categoryId: drinks.id,
        name: { en: "Espresso", es: "Espresso" },
        description: {
          en: "Strong Italian coffee",
          es: "Café italiano fuerte",
        },
        price: 3.99,
        images: ["https://via.placeholder.com/400?text=Espresso"],
        isActive: true,
        isAvailable: true,
        displayOrder: 1,
        tags: [],
        allergens: [],
        modifierGroups: [
          {
            id: "size",
            name: { en: "Size", es: "Tamaño" },
            required: true,
            min: 1,
            max: 1,
            options: [
              { id: "single", name: { en: "Single", es: "Simple" }, price: 0 },
              { id: "double", name: { en: "Double", es: "Doble" }, price: 1.5 },
            ],
          },
        ],
      },
    ],
  });

  console.log("✅ Created menu items");

  // Create admin user
  const passwordHash = await bcrypt.hash("admin123", 10);
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@modernbistro.com" },
    update: {},
    create: {
      resellerId: reseller.id,
      venueId: venue.id,
      email: "admin@modernbistro.com",
      passwordHash,
      name: "Venue Admin",
      role: "venue_admin",
      permissions: [
        "manage_menu",
        "manage_orders",
        "manage_tables",
        "view_reports",
      ],
      isActive: true,
    },
  });

  console.log("✅ Created admin user:", adminUser.email);

  // Create subscription
  const subscription = await prisma.subscription.create({
    data: {
      resellerId: reseller.id,
      planName: "professional",
      status: "active",
      billingCycle: "monthly",
      pricePerVenue: 99.0,
      maxVenues: 5,
      features: {
        whiteLabel: true,
        customDomain: true,
        analytics: true,
      },
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  console.log("✅ Created subscription");

  console.log("🎉 Database seeded successfully!");
  console.log("\n📋 Test Credentials:");
  console.log("   Email: admin@modernbistro.com");
  console.log("   Password: admin123");
  console.log("\n🔗 Test URLs:");
  console.log("   Customer Menu: http://localhost:3000/menu?t=[QR_TOKEN]");
  console.log("   Admin Dashboard: http://localhost:3000/admin");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
