/**
 * Main routes index - registers all route modules
 */

import type { Express } from "express";
import { createServer, type Server } from "http";
import { registerAuthRoutes } from "./auth.routes";
import { storage } from "../storage";
import { logger } from "../utils/logger";
import { hashPassword } from "../utils/password";
import { asyncHandler } from "../middleware/errorHandler";

/**
 * Initialize default data on startup
 */
async function initializeDefaults() {
  try {
    // Check if any users exist
    const users = await storage.getUsers();

    if (users.length === 0) {
      logger.info("No users found. Creating default data...", { source: "init" });

      // Create default region first
      const regions = await storage.getRegions();
      let defaultRegionId: string;

      if (regions.length === 0) {
        const defaultRegion = await storage.createRegion({
          name: "المنطقة الرئيسية",
          description: "المنطقة الافتراضية للنظام",
          isActive: true,
        });
        defaultRegionId = defaultRegion.id;
        logger.info("Created default region", { source: "init" });
      } else {
        defaultRegionId = regions[0].id;
      }

      // Hash passwords for default users
      const adminPassword = await hashPassword("admin123");
      const techPassword = await hashPassword("tech123");
      const supervisorPassword = await hashPassword("super123");

      // Create default admin user
      await storage.createUser({
        username: "admin",
        email: "admin@company.com",
        password: adminPassword,
        fullName: "مدير النظام",
        city: "الرياض",
        role: "admin",
        regionId: defaultRegionId,
        isActive: true,
      });

      // Create default technician user
      await storage.createUser({
        username: "tech1",
        email: "tech1@company.com",
        password: techPassword,
        fullName: "فني تجريبي",
        city: "جدة",
        role: "technician",
        regionId: defaultRegionId,
        isActive: true,
      });

      // Create default supervisor user
      await storage.createUser({
        username: "supervisor1",
        email: "supervisor1@company.com",
        password: supervisorPassword,
        fullName: "مشرف تجريبي",
        city: "الرياض",
        role: "supervisor",
        regionId: defaultRegionId,
        isActive: true,
      });

      logger.info("Created default users: admin, tech1, supervisor1", {
        source: "init",
      });
    }

    // Always ensure item types are seeded
    await storage.seedDefaultItemTypes();
    logger.info("Item types initialized", { source: "init" });
  } catch (error) {
    logger.error("Error initializing defaults", error, { source: "init" });
    // Log detailed error for debugging
    console.error("Initialization error details:", error);
  }
}

/**
 * Register all routes
 */
export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize default data on startup
  await initializeDefaults();

  // Register new route modules
  registerAuthRoutes(app);
  
  // Register refactored route modules
  const { registerInventoryRoutes } = await import("./inventory.routes");
  registerInventoryRoutes(app);
  
  const { registerRegionsRoutes } = await import("./regions.routes");
  registerRegionsRoutes(app);
  
  const { registerUsersRoutes } = await import("./users.routes");
  registerUsersRoutes(app);
  
  const { registerDashboardRoutes } = await import("./dashboard.routes");
  registerDashboardRoutes(app);
  
  const { registerTransactionsRoutes } = await import("./transactions.routes");
  registerTransactionsRoutes(app);
  
  const { registerSystemRoutes } = await import("./system.routes");
  registerSystemRoutes(app);
  
  const { registerItemTypesRoutes } = await import("./item-types.routes");
  registerItemTypesRoutes(app);
  
  const { registerWarehousesRoutes } = await import("./warehouses.routes");
  registerWarehousesRoutes(app);
  
  const { registerTechniciansRoutes } = await import("./technicians.routes");
  registerTechniciansRoutes(app);
  
  const { registerDevicesRoutes } = await import("./devices.routes");
  registerDevicesRoutes(app);

  // Import and register legacy routes (for remaining endpoints not yet migrated)
  const { registerLegacyRoutes } = await import("../routes-legacy");
  await registerLegacyRoutes(app);

  const httpServer = createServer(app);
  return httpServer;
}
