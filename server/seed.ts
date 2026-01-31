import { db } from "./db";
import { regions, users, inventoryItems, itemTypes } from "@shared/schema";
import type { InsertItemType } from "@shared/schema";

async function seedDatabase() {
  try {
    // Create default region
    const [defaultRegion] = await db
      .insert(regions)
      .values({
        name: "المنطقة الرئيسية",
        description: "المنطقة الافتراضية للنظام",
        isActive: true,
      })
      .returning();

    console.log("✅ Created default region:", defaultRegion.name);

    // Create default admin user
    const [adminUser] = await db
      .insert(users)
      .values({
        username: "admin",
        email: "admin@company.com",
        password: "admin123", // In production, this should be hashed
        fullName: "مدير النظام",
        role: "admin",
        regionId: defaultRegion.id,
        isActive: true,
      })
      .returning();

    console.log("✅ Created admin user:", adminUser.fullName);

    // Create sample employee
    const [employeeUser] = await db
      .insert(users)
      .values({
        username: "employee1",
        email: "employee1@company.com",
        password: "emp123", // In production, this should be hashed
        fullName: "محمد أحمد",
        role: "employee",
        regionId: defaultRegion.id,
        isActive: true,
      })
      .returning();

    console.log("✅ Created employee user:", employeeUser.fullName);

    // Create sample inventory items
    const sampleItems = [
      {
        name: "نيوليب POS",
        type: "أجهزة",
        unit: "جهاز",
        quantity: 25,
        minThreshold: 5,
        regionId: defaultRegion.id,
      },
      {
        name: "نيولاند POS",
        type: "أجهزة", 
        unit: "جهاز",
        quantity: 15,
        minThreshold: 3,
        regionId: defaultRegion.id,
      },
      {
        name: "يوروفو POS",
        type: "أجهزة",
        unit: "جهاز", 
        quantity: 8,
        minThreshold: 2,
        regionId: defaultRegion.id,
      },
      {
        name: "شريحة STC",
        type: "شرائح",
        unit: "شريحة",
        quantity: 100,
        minThreshold: 20,
        regionId: defaultRegion.id,
      },
      {
        name: "شريحة موبايلي",
        type: "شرائح",
        unit: "شريحة",
        quantity: 85,
        minThreshold: 15,
        regionId: defaultRegion.id,
      },
      {
        name: "أوراق A4",
        type: "أوراق",
        unit: "علبة",
        quantity: 2,
        minThreshold: 5,
        regionId: defaultRegion.id,
      },
      {
        name: "أوراق حرارية",
        type: "أوراق",
        unit: "لفة",
        quantity: 12,
        minThreshold: 10,
        regionId: defaultRegion.id,
      },
    ];

    const createdItems = await db
      .insert(inventoryItems)
      .values(sampleItems)
      .returning();

    console.log(`✅ Created ${createdItems.length} sample inventory items`);

    // Seed default item types
    const existingItemTypes = await db.select().from(itemTypes);
    if (existingItemTypes.length === 0) {
      const defaultItemTypes: InsertItemType[] = [
        { id: 'n950', nameAr: 'N950', nameEn: 'N950', category: 'devices', unitsPerBox: 10, isActive: true, isVisible: true, sortOrder: 1 },
        { id: 'i9000s', nameAr: 'I9000S', nameEn: 'I9000S', category: 'devices', unitsPerBox: 10, isActive: true, isVisible: true, sortOrder: 2 },
        { id: 'i9100', nameAr: 'I9100', nameEn: 'I9100', category: 'devices', unitsPerBox: 10, isActive: true, isVisible: true, sortOrder: 3 },
        { id: 'rollPaper', nameAr: 'ورق الطباعة', nameEn: 'Roll Paper', category: 'papers', unitsPerBox: 50, isActive: true, isVisible: true, sortOrder: 4 },
        { id: 'stickers', nameAr: 'الملصقات', nameEn: 'Stickers', category: 'papers', unitsPerBox: 100, isActive: true, isVisible: true, sortOrder: 5 },
        { id: 'newBatteries', nameAr: 'البطاريات الجديدة', nameEn: 'New Batteries', category: 'accessories', unitsPerBox: 20, isActive: true, isVisible: true, sortOrder: 6 },
        { id: 'mobilySim', nameAr: 'شريحة موبايلي', nameEn: 'Mobily SIM', category: 'sim', unitsPerBox: 50, isActive: true, isVisible: true, sortOrder: 7 },
        { id: 'stcSim', nameAr: 'شريحة STC', nameEn: 'STC SIM', category: 'sim', unitsPerBox: 50, isActive: true, isVisible: true, sortOrder: 8 },
        { id: 'zainSim', nameAr: 'شريحة زين', nameEn: 'Zain SIM', category: 'sim', unitsPerBox: 50, isActive: true, isVisible: true, sortOrder: 9 },
        { id: 'lebaraSim', nameAr: 'شريحة ليبارا', nameEn: 'Lebara SIM', category: 'sim', unitsPerBox: 50, isActive: true, isVisible: true, sortOrder: 10 }
      ];
      await db.insert(itemTypes).values(defaultItemTypes);
      console.log("✅ Created default item types");
    }

    console.log("🎉 Database seeded successfully!");
  } catch (error) {
    console.error("❌ Error seeding database:", error);
  }
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase().then(() => process.exit(0));
}

export { seedDatabase };