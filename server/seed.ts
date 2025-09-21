import { db } from "./db";
import { regions, users, inventoryItems } from "@shared/schema";

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