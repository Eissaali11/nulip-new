import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertInventoryItemSchema, insertTransactionSchema, insertRegionSchema, insertUserSchema, insertTechnicianInventorySchema, insertWithdrawnDeviceSchema, insertReceivedDeviceSchema, loginSchema, techniciansInventory, insertWarehouseSchema, insertWarehouseInventorySchema, insertWarehouseTransferSchema, warehouseTransfers, warehouseInventory, inventoryRequests, insertInventoryRequestSchema, users, productTypes, insertProductTypeSchema, warehouseDynamicInventory, technicianDynamicInventory, dynamicInventoryRequests, dynamicRequestItems, dynamicWarehouseTransfers } from "@shared/schema";
import { ROLES, hasRoleOrAbove, canManageUsers } from "@shared/roles";
import { z } from "zod";
import { db } from "./db";
import { eq, inArray, or, and, desc } from "drizzle-orm";

// Simple session store for demo purposes (in production, use proper session store)
const activeSessions = new Map<string, { userId: string; role: string; username: string; regionId: string | null; expiry: number }>();

// Authentication middleware
function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
  
  if (!token) {
    return res.status(401).json({ message: "Authentication required" });
  }
  
  const session = activeSessions.get(token);
  if (!session || session.expiry < Date.now()) {
    if (session) activeSessions.delete(token);
    return res.status(401).json({ message: "Session expired" });
  }
  
  // Add user info to request
  (req as any).user = { id: session.userId, role: session.role, username: session.username, regionId: session.regionId };
  next();
}

// Admin-only middleware (System Manager only)
function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user;
  if (!user || user.role !== ROLES.ADMIN) {
    return res.status(403).json({ message: "يجب أن تكون مدير نظام للوصول إلى هذه الصفحة" });
  }
  next();
}

// Supervisor or above middleware
function requireSupervisor(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user;
  if (!user || !hasRoleOrAbove(user.role, ROLES.SUPERVISOR)) {
    return res.status(403).json({ message: "يجب أن تكون مشرف أو أعلى للوصول إلى هذه الصفحة" });
  }
  next();
}

// Require specific role or above
function requireRole(minRole: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    if (!user || !hasRoleOrAbove(user.role, minRole)) {
      return res.status(403).json({ message: "ليس لديك الصلاحيات الكافية" });
    }
    next();
  };
}

// Generate session token
function generateSessionToken(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

// Initialize default data
async function initializeDefaults() {
  try {
    // Check if any users exist
    const users = await storage.getUsers();
    
    if (users.length === 0) {
      console.log("🔧 No users found. Creating default data...");
      
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
        console.log("✅ Created default region");
      } else {
        defaultRegionId = regions[0].id;
      }
      
      // Create default admin user
      await storage.createUser({
        username: "admin",
        email: "admin@company.com",
        password: "admin123",
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
        password: "tech123",
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
        password: "super123",
        fullName: "مشرف تجريبي",
        city: "الرياض",
        role: "supervisor",
        regionId: defaultRegionId,
        isActive: true,
      });
      
      console.log("✅ Created default users:");
      console.log("   - Admin: admin/admin123");
      console.log("   - Supervisor: supervisor1/super123");
      console.log("   - Technician: tech1/tech123");
    }

    // Initialize default product types if none exist
    const existingProductTypes = await db.select().from(productTypes);
    if (existingProductTypes.length === 0) {
      console.log("🔧 No product types found. Creating default product types...");
      
      const defaultProductTypes = [
        { name: "جهاز N950", code: "n950", category: "devices", packagingType: "both", unitsPerBox: 10, sortOrder: 1 },
        { name: "جهاز I9000s", code: "i9000s", category: "devices", packagingType: "both", unitsPerBox: 10, sortOrder: 2 },
        { name: "جهاز I9100", code: "i9100", category: "devices", packagingType: "both", unitsPerBox: 10, sortOrder: 3 },
        { name: "ورق حراري", code: "rollPaper", category: "papers", packagingType: "both", unitsPerBox: 50, sortOrder: 4 },
        { name: "ملصقات", code: "stickers", category: "papers", packagingType: "both", unitsPerBox: 100, sortOrder: 5 },
        { name: "بطاريات جديدة", code: "newBatteries", category: "accessories", packagingType: "both", unitsPerBox: 20, sortOrder: 6 },
        { name: "شريحة موبايلي", code: "mobilySim", category: "sim", packagingType: "both", unitsPerBox: 50, sortOrder: 7 },
        { name: "شريحة STC", code: "stcSim", category: "sim", packagingType: "both", unitsPerBox: 50, sortOrder: 8 },
        { name: "شريحة زين", code: "zainSim", category: "sim", packagingType: "both", unitsPerBox: 50, sortOrder: 9 },
      ];

      for (const pt of defaultProductTypes) {
        await db.insert(productTypes).values({
          name: pt.name,
          code: pt.code,
          category: pt.category,
          packagingType: pt.packagingType,
          unitsPerBox: pt.unitsPerBox,
          sortOrder: pt.sortOrder,
          isActive: true,
        });
      }

      console.log("✅ Created 9 default product types");
    }
  } catch (error) {
    console.error("❌ Error initializing defaults:", error);
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize default data on startup
  await initializeDefaults();
  // Authentication routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = loginSchema.parse(req.body);
      
      // Find user by username (get full user data with password)
      const user = await storage.getUserByUsername(username);
      
      if (!user) {
        return res.status(401).json({ 
          success: false, 
          message: "اسم المستخدم أو كلمة المرور غير صحيحة" 
        });
      }
      
      if (!user.isActive) {
        return res.status(401).json({ 
          success: false, 
          message: "الحساب غير نشط" 
        });
      }
      
      if (user.password !== password) {
        return res.status(401).json({ 
          success: false, 
          message: "اسم المستخدم أو كلمة المرور غير صحيحة" 
        });
      }
      
      // Create session
      const token = generateSessionToken();
      const expiry = Date.now() + (24 * 60 * 60 * 1000); // 24 hours
      
      activeSessions.set(token, {
        userId: user.id,
        role: user.role,
        username: user.username,
        regionId: user.regionId || null,
        expiry
      });
      
      // Return user without password
      const { password: _, ...userSafe } = user;
      
      res.json({
        success: true,
        user: userSafe,
        token,
        message: "تم تسجيل الدخول بنجاح"
      });
    } catch (error) {
      console.error("Login error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          success: false, 
          message: "بيانات غير صحيحة", 
          errors: error.errors 
        });
      }
      res.status(500).json({ 
        success: false, 
        message: "خطأ في الخادم",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  
  app.post("/api/auth/logout", requireAuth, async (req, res) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.substring(7);
    
    if (token) {
      activeSessions.delete(token);
    }
    
    res.json({ success: true, message: "تم تسجيل الخروج بنجاح" });
  });
  
  app.get("/api/auth/me", requireAuth, async (req, res) => {
    const userId = (req as any).user.id;
    
    try {
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({ user });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user info" });
    }
  });
  

  // Get all inventory items
  app.get("/api/inventory", async (req, res) => {
    try {
      const items = await storage.getInventoryItems();
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch inventory items" });
    }
  });

  // Get single inventory item
  app.get("/api/inventory/:id", async (req, res) => {
    try {
      const item = await storage.getInventoryItem(req.params.id);
      if (!item) {
        return res.status(404).json({ message: "Item not found" });
      }
      res.json(item);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch inventory item" });
    }
  });

  // Create new inventory item
  app.post("/api/inventory", requireAuth, async (req, res) => {
    try {
      const validatedData = insertInventoryItemSchema.parse(req.body);
      const item = await storage.createInventoryItem(validatedData);
      res.status(201).json(item);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create inventory item" });
    }
  });

  // Update inventory item
  app.patch("/api/inventory/:id", requireAuth, async (req, res) => {
    try {
      const updates = insertInventoryItemSchema.partial().parse(req.body);
      const item = await storage.updateInventoryItem(req.params.id, updates);
      res.json(item);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      if (error instanceof Error && error.message.includes("not found")) {
        return res.status(404).json({ message: "Item not found" });
      }
      res.status(500).json({ message: "Failed to update inventory item" });
    }
  });

  // Delete inventory item
  app.delete("/api/inventory/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const deleted = await storage.deleteInventoryItem(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Item not found" });
      }
      res.json({ message: "Item deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete inventory item" });
    }
  });

  // Add stock
  app.post("/api/inventory/:id/add", requireAuth, async (req, res) => {
    try {
      const { quantity, reason } = z.object({
        quantity: z.number().positive(),
        reason: z.string().optional(),
      }).parse(req.body);
      
      const userId = (req as any).user.id; // Get user from auth middleware
      const item = await storage.addStock(req.params.id, quantity, reason, userId);
      res.json(item);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      if (error instanceof Error && error.message.includes("not found")) {
        return res.status(404).json({ message: "Item not found" });
      }
      res.status(500).json({ message: "Failed to add stock" });
    }
  });

  // Withdraw stock
  app.post("/api/inventory/:id/withdraw", requireAuth, async (req, res) => {
    try {
      const { quantity, reason } = z.object({
        quantity: z.number().positive(),
        reason: z.string().optional(),
      }).parse(req.body);
      
      const userId = (req as any).user.id; // Get user from auth middleware
      const item = await storage.withdrawStock(req.params.id, quantity, reason, userId);
      res.json(item);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      if (error instanceof Error && (error.message.includes("not found") || error.message.includes("Insufficient stock"))) {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: "Failed to withdraw stock" });
    }
  });

  // Get transactions
  app.get("/api/transactions", requireAuth, async (req, res) => {
    try {
      const {
        page,
        limit,
        type,
        userId,
        regionId,
        startDate,
        endDate,
        search,
        recent
      } = req.query;

      // If recent=true, use the old simple method
      if (recent === 'true') {
        const limitNum = limit ? parseInt(limit as string) : 10;
        const transactions = await storage.getRecentTransactions(limitNum);
        return res.json(transactions);
      }

      // Use the new enhanced method with filters
      const filters = {
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        type: type as string,
        userId: userId as string,
        regionId: regionId as string,
        startDate: startDate as string,
        endDate: endDate as string,
        search: search as string,
      };

      // Remove undefined filters
      Object.keys(filters).forEach(key => {
        if (filters[key as keyof typeof filters] === undefined) {
          delete filters[key as keyof typeof filters];
        }
      });

      const result = await storage.getTransactions(filters);
      res.json(result);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  // Transaction statistics endpoint
  app.get("/api/transactions/statistics", requireAuth, async (req, res) => {
    try {
      const { startDate, endDate, regionId } = req.query;
      
      const filters = {
        startDate: startDate as string,
        endDate: endDate as string,
        regionId: regionId as string,
      };

      // Remove undefined filters
      Object.keys(filters).forEach(key => {
        if (filters[key as keyof typeof filters] === undefined) {
          delete filters[key as keyof typeof filters];
        }
      });

      const statistics = await storage.getTransactionStatistics(filters);
      res.json(statistics);
    } catch (error) {
      console.error('Error fetching transaction statistics:', error);
      res.status(500).json({ message: "Failed to fetch transaction statistics" });
    }
  });

  // Get dashboard stats
  app.get("/api/dashboard", async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Regions endpoints
  app.get("/api/regions", requireAuth, async (req, res) => {
    try {
      const regions = await storage.getRegions();
      res.json(regions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch regions" });
    }
  });

  app.get("/api/regions/:id", async (req, res) => {
    try {
      const region = await storage.getRegion(req.params.id);
      if (!region) {
        return res.status(404).json({ message: "Region not found" });
      }
      res.json(region);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch region" });
    }
  });

  app.post("/api/regions", requireAuth, requireAdmin, async (req, res) => {
    try {
      const user = (req as any).user;
      const validatedData = insertRegionSchema.parse(req.body);
      const region = await storage.createRegion(validatedData);
      
      // Log the activity
      await storage.logSystemActivity({
        userId: user.id,
        userName: user.username,
        userRole: user.role,
        regionId: null,
        action: "create",
        entityType: "region",
        entityId: region.id,
        entityName: region.name,
        description: `تم إنشاء منطقة جديدة: ${region.name}`,
        severity: "info",
        success: true,
      });
      
      res.status(201).json(region);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create region" });
    }
  });

  app.patch("/api/regions/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const user = (req as any).user;
      const updates = insertRegionSchema.partial().parse(req.body);
      const region = await storage.updateRegion(req.params.id, updates);
      
      // Log the activity
      await storage.logSystemActivity({
        userId: user.id,
        userName: user.username,
        userRole: user.role,
        regionId: region.id,
        action: "update",
        entityType: "region",
        entityId: region.id,
        entityName: region.name,
        description: `تم تحديث منطقة: ${region.name}`,
        severity: "info",
        success: true,
      });
      
      res.json(region);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      if (error instanceof Error && error.message.includes("not found")) {
        return res.status(404).json({ message: "Region not found" });
      }
      res.status(500).json({ message: "Failed to update region" });
    }
  });

  app.delete("/api/regions/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const user = (req as any).user;
      // Get region name before deletion
      const regions = await storage.getRegions();
      const region = regions.find(r => r.id === req.params.id);
      const regionName = region?.name || "غير محدد";
      
      const deleted = await storage.deleteRegion(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Region not found" });
      }
      
      // Log the activity
      await storage.logSystemActivity({
        userId: user.id,
        userName: user.username,
        userRole: user.role,
        regionId: null,
        action: "delete",
        entityType: "region",
        entityId: req.params.id,
        entityName: regionName,
        description: `تم حذف منطقة: ${regionName}`,
        severity: "warn",
        success: true,
      });
      
      res.status(204).send();
    } catch (error) {
      if (error instanceof Error && error.message.includes("Cannot delete region")) {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: "Failed to delete region" });
    }
  });

  // Users endpoints
  app.get("/api/users", requireAuth, requireAdmin, async (req, res) => {
    try {
      const users = await storage.getUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.get("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.post("/api/users", requireAuth, requireAdmin, async (req, res) => {
    try {
      const currentUser = (req as any).user;
      const validatedData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(validatedData);
      
      // Log the activity
      await storage.logSystemActivity({
        userId: currentUser.id,
        userName: currentUser.username,
        userRole: currentUser.role,
        regionId: user.regionId || null,
        action: "create",
        entityType: "user",
        entityId: user.id,
        entityName: user.fullName,
        details: JSON.stringify({ username: user.username, role: user.role }),
        description: `تم إنشاء مستخدم جديد: ${user.fullName} (${user.role})`,
        severity: "info",
        success: true,
      });
      
      res.status(201).json(user);
    } catch (error) {
      console.error('Error creating user:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      if (error instanceof Error && (error.message.includes("already exists") || error.message.includes("duplicate"))) {
        return res.status(409).json({ message: error.message });
      }
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to create user" });
    }
  });

  app.patch("/api/users/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const updates = insertUserSchema.partial().parse(req.body);
      console.log('Updating user:', req.params.id, 'with data:', updates);
      const user = await storage.updateUser(req.params.id, updates);
      res.json(user);
    } catch (error) {
      console.error('Error updating user:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      if (error instanceof Error && error.message.includes("not found")) {
        return res.status(404).json({ message: "User not found" });
      }
      if (error instanceof Error && (error.message.includes("already exists") || error.message.includes("duplicate"))) {
        return res.status(409).json({ message: error.message });
      }
      res.status(500).json({ message: "Failed to update user", error: error instanceof Error ? error.message : String(error) });
    }
  });

  app.delete("/api/users/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteUser(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "User not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // Admin stats endpoint
  app.get("/api/admin/stats", async (req, res) => {
    try {
      const stats = await storage.getAdminStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch admin stats" });
    }
  });

  // System logs endpoint
  app.get("/api/system-logs", requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const { limit, offset, action, entityType, severity } = req.query;
      
      const filters: any = {
        limit: limit ? parseInt(limit as string) : 50,
        offset: offset ? parseInt(offset as string) : 0,
      };
      
      // Role-based filtering
      if (user.role === ROLES.TECHNICIAN) {
        // Technicians only see their own logs
        filters.userId = user.id;
      } else if (user.role === ROLES.SUPERVISOR) {
        // Supervisors see logs from their region
        if (user.regionId) {
          filters.regionId = user.regionId;
        }
      }
      // Admins see all logs (no additional filters)
      
      if (action) filters.action = action as string;
      if (entityType) filters.entityType = entityType as string;
      if (severity) filters.severity = severity as string;
      
      const logs = await storage.getSystemLogs(filters);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch system logs" });
    }
  });

  // Technicians Inventory Routes
  app.get("/api/technicians", requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const techs = await storage.getTechniciansInventory();
      
      // Filter data based on user role
      if (user.role === ROLES.ADMIN || user.role === ROLES.SUPERVISOR) {
        // Admins and supervisors see everything
        res.json(techs);
      } else {
        // Technicians only see data they created
        const filteredTechs = techs.filter(tech => tech.createdBy === user.id);
        res.json(filteredTechs);
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch technicians inventory" });
    }
  });

  app.get("/api/technicians/:id", requireAuth, async (req, res) => {
    try {
      const tech = await storage.getTechnicianInventory(req.params.id);
      if (!tech) {
        return res.status(404).json({ message: "Technician inventory not found" });
      }
      res.json(tech);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch technician inventory" });
    }
  });

  app.post("/api/technicians", requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const data = insertTechnicianInventorySchema.parse(req.body);
      
      // Add createdBy to track who created this record
      const techData = {
        ...data,
        createdBy: user.id,
      };
      
      const tech = await storage.createTechnicianInventory(techData);
      res.status(201).json(tech);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create technician inventory" });
    }
  });

  app.patch("/api/technicians/:id", requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const updates = insertTechnicianInventorySchema.partial().parse(req.body);
      const tech = await storage.updateTechnicianInventory(req.params.id, updates);
      
      // Get technician info for logging
      const technician = await storage.getUser(req.params.id);
      if (technician) {
        await storage.createSystemLog({
          userId: user.id,
          userName: user.fullName || user.username || 'Unknown',
          userRole: user.role,
          regionId: technician.regionId,
          action: 'update',
          entityType: 'technician_moving_inventory',
          entityId: req.params.id,
          entityName: technician.fullName || technician.username,
          description: `تحديث المخزون المتحرك للفني: ${technician.fullName || technician.username}`,
          severity: 'info',
          success: true,
        });
      }
      
      res.json(tech);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      if (error instanceof Error && error.message.includes("not found")) {
        return res.status(404).json({ message: "Technician inventory not found" });
      }
      res.status(500).json({ message: "Failed to update technician inventory" });
    }
  });

  app.delete("/api/technicians/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const deleted = await storage.deleteTechnicianInventory(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Technician inventory not found" });
      }
      res.json({ message: "Technician inventory deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete technician inventory" });
    }
  });

  // My Inventory Routes - for current user
  app.get("/api/my-fixed-inventory", requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const inventory = await storage.getTechnicianFixedInventory(user.id);
      res.json(inventory || null);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch fixed inventory" });
    }
  });

  app.get("/api/my-moving-inventory", requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const inventory = await storage.getTechnicianInventory(user.id);
      res.json(inventory || null);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch moving inventory" });
    }
  });

  // Withdrawn Devices Routes
  app.get("/api/withdrawn-devices", requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const devices = await storage.getWithdrawnDevices();
      
      // Filter data based on user role
      if (user.role === ROLES.ADMIN || user.role === ROLES.SUPERVISOR) {
        // Admins and supervisors see everything
        res.json(devices);
      } else {
        // Technicians only see devices they created
        const filteredDevices = devices.filter(device => device.createdBy === user.id);
        res.json(filteredDevices);
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch withdrawn devices" });
    }
  });

  app.get("/api/withdrawn-devices/:id", requireAuth, async (req, res) => {
    try {
      const device = await storage.getWithdrawnDevice(req.params.id);
      if (!device) {
        return res.status(404).json({ message: "Withdrawn device not found" });
      }
      res.json(device);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch withdrawn device" });
    }
  });

  app.post("/api/withdrawn-devices", requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const data = insertWithdrawnDeviceSchema.parse(req.body);
      
      // Add createdBy to track who created this record
      const deviceData = {
        ...data,
        createdBy: user.id,
      };
      
      const device = await storage.createWithdrawnDevice(deviceData);
      res.status(201).json(device);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create withdrawn device" });
    }
  });

  app.patch("/api/withdrawn-devices/:id", requireAuth, async (req, res) => {
    try {
      const updates = insertWithdrawnDeviceSchema.partial().parse(req.body);
      const device = await storage.updateWithdrawnDevice(req.params.id, updates);
      res.json(device);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      if (error instanceof Error && error.message.includes("not found")) {
        return res.status(404).json({ message: "Withdrawn device not found" });
      }
      res.status(500).json({ message: "Failed to update withdrawn device" });
    }
  });

  app.delete("/api/withdrawn-devices/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const deleted = await storage.deleteWithdrawnDevice(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Withdrawn device not found" });
      }
      res.json({ message: "Withdrawn device deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete withdrawn device" });
    }
  });

  // Received Devices Routes
  app.get("/api/received-devices", requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const { status } = req.query;
      
      // Build filters based on user role
      const filters: any = {};
      if (status) filters.status = status as string;
      
      if (user.role === ROLES.TECHNICIAN) {
        filters.technicianId = user.id;
      } else if (user.role === ROLES.SUPERVISOR) {
        // Supervisors see devices from their assigned technicians OR from their region
        filters.supervisorId = user.id;
        filters.regionId = user.regionId;
      }
      
      const devices = await storage.getReceivedDevices(filters);
      res.json(devices);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch received devices" });
    }
  });

  app.get("/api/received-devices/pending/count", requireAuth, requireSupervisor, async (req, res) => {
    try {
      const user = (req as any).user;
      let count = 0;
      
      if (user.role === ROLES.SUPERVISOR) {
        // Count devices assigned to this supervisor OR in their region
        count = await storage.getPendingReceivedDevicesCount(user.id, user.regionId);
      } else {
        // Admin sees all pending devices
        count = await storage.getPendingReceivedDevicesCount();
      }
      
      res.json({ count });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch pending count" });
    }
  });

  app.get("/api/received-devices/:id", requireAuth, async (req, res) => {
    try {
      const device = await storage.getReceivedDevice(req.params.id);
      if (!device) {
        return res.status(404).json({ message: "Received device not found" });
      }
      res.json(device);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch received device" });
    }
  });

  app.post("/api/received-devices", requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const data = insertReceivedDeviceSchema.parse(req.body);
      
      // Determine technicianId and supervisorId
      const technicianId = data.technicianId || user.id;
      let supervisorId = data.supervisorId;
      
      // If no supervisorId provided, try to get it from technician assignment
      if (!supervisorId && user.role === ROLES.TECHNICIAN) {
        supervisorId = await storage.getTechnicianSupervisor(user.id);
      }
      
      const deviceData = {
        ...data,
        technicianId,
        supervisorId,
        regionId: data.regionId || user.regionId,
      };
      
      const device = await storage.createReceivedDevice(deviceData);
      
      res.status(201).json(device);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create received device" });
    }
  });

  app.patch("/api/received-devices/:id/status", requireAuth, requireSupervisor, async (req, res) => {
    try {
      const user = (req as any).user;
      const { status, adminNotes } = req.body;
      
      if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      
      const device = await storage.updateReceivedDeviceStatus(req.params.id, status, user.id, adminNotes);
      
      res.json(device);
    } catch (error) {
      if (error instanceof Error && error.message.includes("not found")) {
        return res.status(404).json({ message: "Received device not found" });
      }
      res.status(500).json({ message: "Failed to update received device status" });
    }
  });

  app.delete("/api/received-devices/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const deleted = await storage.deleteReceivedDevice(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Received device not found" });
      }
      res.json({ message: "Received device deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete received device" });
    }
  });

  // Fixed Inventory Routes
  app.get("/api/admin/fixed-inventory-dashboard", requireAuth, requireAdmin, async (req, res) => {
    try {
      const techniciansWithInventory = await storage.getAllTechniciansWithFixedInventory();
      const summary = await storage.getFixedInventorySummary();
      res.json({ technicians: techniciansWithInventory, summary });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch fixed inventory dashboard" });
    }
  });

  app.get("/api/admin/all-technicians-inventory", requireAuth, requireAdmin, async (req, res) => {
    try {
      const technicians = await storage.getAllTechniciansWithBothInventories();
      res.json({ technicians });
    } catch (error) {
      console.error("Error fetching all technicians inventory:", error);
      res.status(500).json({ message: "Failed to fetch technicians inventory" });
    }
  });

  app.get("/api/supervisor/technicians-inventory", requireAuth, requireSupervisor, async (req, res) => {
    try {
      const user = (req as any).user;
      
      if (!user.regionId) {
        return res.status(400).json({ message: "المشرف يجب أن يكون مرتبط بمنطقة لعرض البيانات" });
      }
      
      const technicians = await storage.getRegionTechniciansWithInventories(user.regionId);
      res.json({ technicians });
    } catch (error) {
      console.error("Error fetching region technicians inventory:", error);
      res.status(500).json({ message: "Failed to fetch region technicians inventory" });
    }
  });

  app.get("/api/technician-fixed-inventory/:technicianId", requireAuth, async (req, res) => {
    try {
      const inventory = await storage.getTechnicianFixedInventory(req.params.technicianId);
      if (!inventory) {
        return res.status(404).json({ message: "Fixed inventory not found" });
      }
      res.json(inventory);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch fixed inventory" });
    }
  });

  app.put("/api/technician-fixed-inventory/:technicianId", requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const technicianId = req.params.technicianId;
      
      // Allow technician to update only their own inventory, or admin to update any
      if (user.role !== 'admin' && user.id !== technicianId) {
        return res.status(403).json({ message: "Forbidden: You can only update your own inventory" });
      }
      
      // Get technician info for logging
      const technician = await storage.getUser(technicianId);
      if (!technician) {
        return res.status(404).json({ message: "Technician not found" });
      }
      
      // Remove timestamp fields from request body as they're auto-managed by DB
      const { createdAt, updatedAt, id, ...inventoryData } = req.body;
      
      const existingInventory = await storage.getTechnicianFixedInventory(technicianId);
      
      if (existingInventory) {
        const updated = await storage.updateTechnicianFixedInventory(technicianId, inventoryData);
        
        // Log the update
        await storage.createSystemLog({
          userId: user.id,
          userName: user.fullName || user.username || 'Unknown',
          userRole: user.role,
          regionId: technician.regionId,
          action: 'update',
          entityType: 'technician_fixed_inventory',
          entityId: technicianId,
          entityName: technician.fullName || technician.username,
          description: `تحديث المخزون الثابت للفني: ${technician.fullName || technician.username}`,
          severity: 'info',
          success: true,
        });
        
        res.json(updated);
      } else {
        const created = await storage.createTechnicianFixedInventory({
          technicianId,
          ...inventoryData,
        });
        
        // Log the creation
        await storage.createSystemLog({
          userId: user.id,
          userName: user.fullName || user.username || 'Unknown',
          userRole: user.role,
          regionId: technician.regionId,
          action: 'create',
          entityType: 'technician_fixed_inventory',
          entityId: technicianId,
          entityName: technician.fullName || technician.username,
          description: `إنشاء مخزون ثابت للفني: ${technician.fullName || technician.username}`,
          severity: 'info',
          success: true,
        });
        
        res.status(201).json(created);
      }
    } catch (error) {
      console.error("Error updating fixed inventory:", error);
      if (error instanceof Error) {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: "Failed to update fixed inventory" });
    }
  });

  app.delete("/api/technician-fixed-inventory/:technicianId", requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const technicianId = req.params.technicianId;
      
      // Allow technician to delete only their own inventory, or admin to delete any
      if (user.role !== 'admin' && user.id !== technicianId) {
        return res.status(403).json({ message: "Forbidden: You can only delete your own inventory" });
      }
      
      const existingInventory = await storage.getTechnicianFixedInventory(technicianId);
      if (!existingInventory) {
        return res.status(404).json({ message: "Fixed inventory not found" });
      }
      
      await storage.deleteTechnicianFixedInventory(technicianId);
      res.json({ message: "Fixed inventory deleted successfully" });
    } catch (error) {
      console.error("Error deleting fixed inventory:", error);
      res.status(500).json({ message: "Failed to delete fixed inventory" });
    }
  });

  app.post("/api/stock-transfer", requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const { 
        technicianId, 
        n950, i9000s, i9100, rollPaper, stickers, newBatteries: newBatteriesAmount, mobilySim, stcSim, zainSim,
        n950PackagingType, i9000sPackagingType, i9100PackagingType, rollPaperPackagingType, stickersPackagingType,
        newBatteriesPackagingType, mobilySimPackagingType, stcSimPackagingType, zainSimPackagingType
      } = req.body;
      
      // Get current fixed inventory
      const fixedInventory = await storage.getTechnicianFixedInventory(technicianId);
      if (!fixedInventory) {
        return res.status(404).json({ message: "Fixed inventory not found" });
      }

      // Get or create moving inventory (using technicianId as id)
      let movingInventory = await storage.getTechnicianInventory(technicianId);
      if (!movingInventory) {
        // Get user info for technician name
        const techUser = await storage.getUser(technicianId);
        
        // Create moving inventory with userId as the record id
        const [created] = await db
          .insert(techniciansInventory)
          .values({
            id: technicianId, // Use userId as id
            technicianName: techUser?.fullName || 'Unknown',
            city: techUser?.city || 'N/A',
            n950Boxes: 0,
            n950Units: 0,
            i9000sBoxes: 0,
            i9000sUnits: 0,
            i9100Boxes: 0,
            i9100Units: 0,
            rollPaperBoxes: 0,
            rollPaperUnits: 0,
            stickersBoxes: 0,
            stickersUnits: 0,
            newBatteriesBoxes: 0,
            newBatteriesUnits: 0,
            mobilySimBoxes: 0,
            mobilySimUnits: 0,
            stcSimBoxes: 0,
            stcSimUnits: 0,
            zainSimBoxes: 0,
            zainSimUnits: 0,
            createdBy: user.id,
          })
          .returning();
        
        movingInventory = created;
      }

      // Validate quantities based on packaging type
      if (n950 > 0 && n950PackagingType === 'box' && n950 > fixedInventory.n950Boxes) {
        return res.status(400).json({ message: "Insufficient N950 boxes in fixed inventory" });
      }
      if (n950 > 0 && n950PackagingType === 'unit' && n950 > fixedInventory.n950Units) {
        return res.status(400).json({ message: "Insufficient N950 units in fixed inventory" });
      }
      if (i9000s > 0 && i9000sPackagingType === 'box' && i9000s > fixedInventory.i9000sBoxes) {
        return res.status(400).json({ message: "Insufficient i9000s boxes in fixed inventory" });
      }
      if (i9000s > 0 && i9000sPackagingType === 'unit' && i9000s > fixedInventory.i9000sUnits) {
        return res.status(400).json({ message: "Insufficient i9000s units in fixed inventory" });
      }
      if (i9100 > 0 && i9100PackagingType === 'box' && i9100 > fixedInventory.i9100Boxes) {
        return res.status(400).json({ message: "Insufficient i9100 boxes in fixed inventory" });
      }
      if (i9100 > 0 && i9100PackagingType === 'unit' && i9100 > fixedInventory.i9100Units) {
        return res.status(400).json({ message: "Insufficient i9100 units in fixed inventory" });
      }
      if (rollPaper > 0 && rollPaperPackagingType === 'box' && rollPaper > fixedInventory.rollPaperBoxes) {
        return res.status(400).json({ message: "Insufficient roll paper boxes in fixed inventory" });
      }
      if (rollPaper > 0 && rollPaperPackagingType === 'unit' && rollPaper > fixedInventory.rollPaperUnits) {
        return res.status(400).json({ message: "Insufficient roll paper units in fixed inventory" });
      }
      if (stickers > 0 && stickersPackagingType === 'box' && stickers > fixedInventory.stickersBoxes) {
        return res.status(400).json({ message: "Insufficient stickers boxes in fixed inventory" });
      }
      if (stickers > 0 && stickersPackagingType === 'unit' && stickers > fixedInventory.stickersUnits) {
        return res.status(400).json({ message: "Insufficient stickers units in fixed inventory" });
      }
      if (newBatteriesAmount > 0 && newBatteriesPackagingType === 'box' && newBatteriesAmount > fixedInventory.newBatteriesBoxes) {
        return res.status(400).json({ message: "Insufficient batteries boxes in fixed inventory" });
      }
      if (newBatteriesAmount > 0 && newBatteriesPackagingType === 'unit' && newBatteriesAmount > fixedInventory.newBatteriesUnits) {
        return res.status(400).json({ message: "Insufficient batteries units in fixed inventory" });
      }
      if (mobilySim > 0 && mobilySimPackagingType === 'box' && mobilySim > fixedInventory.mobilySimBoxes) {
        return res.status(400).json({ message: "Insufficient Mobily SIM boxes in fixed inventory" });
      }
      if (mobilySim > 0 && mobilySimPackagingType === 'unit' && mobilySim > fixedInventory.mobilySimUnits) {
        return res.status(400).json({ message: "Insufficient Mobily SIM units in fixed inventory" });
      }
      if (stcSim > 0 && stcSimPackagingType === 'box' && stcSim > fixedInventory.stcSimBoxes) {
        return res.status(400).json({ message: "Insufficient STC SIM boxes in fixed inventory" });
      }
      if (stcSim > 0 && stcSimPackagingType === 'unit' && stcSim > fixedInventory.stcSimUnits) {
        return res.status(400).json({ message: "Insufficient STC SIM units in fixed inventory" });
      }
      if (zainSim > 0 && zainSimPackagingType === 'box' && zainSim > fixedInventory.zainSimBoxes) {
        return res.status(400).json({ message: "Insufficient Zain SIM boxes in fixed inventory" });
      }
      if (zainSim > 0 && zainSimPackagingType === 'unit' && zainSim > fixedInventory.zainSimUnits) {
        return res.status(400).json({ message: "Insufficient Zain SIM units in fixed inventory" });
      }

      // Update fixed inventory - subtract from the specified packaging type only
      await storage.updateTechnicianFixedInventory(technicianId, {
        n950Boxes: n950PackagingType === 'box' ? fixedInventory.n950Boxes - n950 : fixedInventory.n950Boxes,
        n950Units: n950PackagingType === 'unit' ? fixedInventory.n950Units - n950 : fixedInventory.n950Units,
        i9000sBoxes: i9000sPackagingType === 'box' ? fixedInventory.i9000sBoxes - i9000s : fixedInventory.i9000sBoxes,
        i9000sUnits: i9000sPackagingType === 'unit' ? fixedInventory.i9000sUnits - i9000s : fixedInventory.i9000sUnits,
        i9100Boxes: i9100PackagingType === 'box' ? fixedInventory.i9100Boxes - i9100 : fixedInventory.i9100Boxes,
        i9100Units: i9100PackagingType === 'unit' ? fixedInventory.i9100Units - i9100 : fixedInventory.i9100Units,
        rollPaperBoxes: rollPaperPackagingType === 'box' ? fixedInventory.rollPaperBoxes - rollPaper : fixedInventory.rollPaperBoxes,
        rollPaperUnits: rollPaperPackagingType === 'unit' ? fixedInventory.rollPaperUnits - rollPaper : fixedInventory.rollPaperUnits,
        stickersBoxes: stickersPackagingType === 'box' ? fixedInventory.stickersBoxes - stickers : fixedInventory.stickersBoxes,
        stickersUnits: stickersPackagingType === 'unit' ? fixedInventory.stickersUnits - stickers : fixedInventory.stickersUnits,
        newBatteriesBoxes: newBatteriesPackagingType === 'box' ? fixedInventory.newBatteriesBoxes - newBatteriesAmount : fixedInventory.newBatteriesBoxes,
        newBatteriesUnits: newBatteriesPackagingType === 'unit' ? fixedInventory.newBatteriesUnits - newBatteriesAmount : fixedInventory.newBatteriesUnits,
        mobilySimBoxes: mobilySimPackagingType === 'box' ? fixedInventory.mobilySimBoxes - mobilySim : fixedInventory.mobilySimBoxes,
        mobilySimUnits: mobilySimPackagingType === 'unit' ? fixedInventory.mobilySimUnits - mobilySim : fixedInventory.mobilySimUnits,
        stcSimBoxes: stcSimPackagingType === 'box' ? fixedInventory.stcSimBoxes - stcSim : fixedInventory.stcSimBoxes,
        stcSimUnits: stcSimPackagingType === 'unit' ? fixedInventory.stcSimUnits - stcSim : fixedInventory.stcSimUnits,
        zainSimBoxes: zainSimPackagingType === 'box' ? fixedInventory.zainSimBoxes - zainSim : fixedInventory.zainSimBoxes,
        zainSimUnits: zainSimPackagingType === 'unit' ? fixedInventory.zainSimUnits - zainSim : fixedInventory.zainSimUnits,
      });

      // Update moving inventory - add to the same packaging type
      await storage.updateTechnicianInventory(technicianId, {
        n950Boxes: n950PackagingType === 'box' ? movingInventory.n950Boxes + n950 : movingInventory.n950Boxes,
        n950Units: n950PackagingType === 'unit' ? movingInventory.n950Units + n950 : movingInventory.n950Units,
        i9000sBoxes: i9000sPackagingType === 'box' ? movingInventory.i9000sBoxes + i9000s : movingInventory.i9000sBoxes,
        i9000sUnits: i9000sPackagingType === 'unit' ? movingInventory.i9000sUnits + i9000s : movingInventory.i9000sUnits,
        i9100Boxes: i9100PackagingType === 'box' ? movingInventory.i9100Boxes + i9100 : movingInventory.i9100Boxes,
        i9100Units: i9100PackagingType === 'unit' ? movingInventory.i9100Units + i9100 : movingInventory.i9100Units,
        rollPaperBoxes: rollPaperPackagingType === 'box' ? movingInventory.rollPaperBoxes + rollPaper : movingInventory.rollPaperBoxes,
        rollPaperUnits: rollPaperPackagingType === 'unit' ? movingInventory.rollPaperUnits + rollPaper : movingInventory.rollPaperUnits,
        stickersBoxes: stickersPackagingType === 'box' ? movingInventory.stickersBoxes + stickers : movingInventory.stickersBoxes,
        stickersUnits: stickersPackagingType === 'unit' ? movingInventory.stickersUnits + stickers : movingInventory.stickersUnits,
        newBatteriesBoxes: newBatteriesPackagingType === 'box' ? movingInventory.newBatteriesBoxes + newBatteriesAmount : movingInventory.newBatteriesBoxes,
        newBatteriesUnits: newBatteriesPackagingType === 'unit' ? movingInventory.newBatteriesUnits + newBatteriesAmount : movingInventory.newBatteriesUnits,
        mobilySimBoxes: mobilySimPackagingType === 'box' ? movingInventory.mobilySimBoxes + mobilySim : movingInventory.mobilySimBoxes,
        mobilySimUnits: mobilySimPackagingType === 'unit' ? movingInventory.mobilySimUnits + mobilySim : movingInventory.mobilySimUnits,
        stcSimBoxes: stcSimPackagingType === 'box' ? movingInventory.stcSimBoxes + stcSim : movingInventory.stcSimBoxes,
        stcSimUnits: stcSimPackagingType === 'unit' ? movingInventory.stcSimUnits + stcSim : movingInventory.stcSimUnits,
        zainSimBoxes: zainSimPackagingType === 'box' ? movingInventory.zainSimBoxes + zainSim : movingInventory.zainSimBoxes,
        zainSimUnits: zainSimPackagingType === 'unit' ? movingInventory.zainSimUnits + zainSim : movingInventory.zainSimUnits,
      });

      // Record stock movements with actual packaging types
      const movements = [];
      if (n950 > 0) {
        movements.push(storage.createStockMovement({
          technicianId,
          itemType: 'n950',
          packagingType: n950PackagingType,
          quantity: n950,
          fromInventory: 'fixed',
          toInventory: 'moving',
          performedBy: user.id,
          reason: 'transfer',
          notes: 'Transfer from fixed to moving inventory',
        }));
      }
      if (i9000s > 0) {
        movements.push(storage.createStockMovement({
          technicianId,
          itemType: 'i9000s',
          packagingType: i9000sPackagingType,
          quantity: i9000s,
          fromInventory: 'fixed',
          toInventory: 'moving',
          performedBy: user.id,
          reason: 'transfer',
          notes: 'Transfer from fixed to moving inventory',
        }));
      }
      if (i9100 > 0) {
        movements.push(storage.createStockMovement({
          technicianId,
          itemType: 'i9100',
          packagingType: i9100PackagingType,
          quantity: i9100,
          fromInventory: 'fixed',
          toInventory: 'moving',
          performedBy: user.id,
          reason: 'transfer',
          notes: 'Transfer from fixed to moving inventory',
        }));
      }
      if (newBatteriesAmount > 0) {
        movements.push(storage.createStockMovement({
          technicianId,
          itemType: 'newBatteries',
          packagingType: newBatteriesPackagingType,
          quantity: newBatteriesAmount,
          fromInventory: 'fixed',
          toInventory: 'moving',
          performedBy: user.id,
          reason: 'transfer',
          notes: 'Transfer from fixed to moving inventory',
        }));
      }
      if (rollPaper > 0) {
        movements.push(storage.createStockMovement({
          technicianId,
          itemType: 'rollPaper',
          packagingType: rollPaperPackagingType,
          quantity: rollPaper,
          fromInventory: 'fixed',
          toInventory: 'moving',
          performedBy: user.id,
          reason: 'transfer',
          notes: 'Transfer from fixed to moving inventory',
        }));
      }
      if (stickers > 0) {
        movements.push(storage.createStockMovement({
          technicianId,
          itemType: 'stickers',
          packagingType: stickersPackagingType,
          quantity: stickers,
          fromInventory: 'fixed',
          toInventory: 'moving',
          performedBy: user.id,
          reason: 'transfer',
          notes: 'Transfer from fixed to moving inventory',
        }));
      }
      if (mobilySim > 0) {
        movements.push(storage.createStockMovement({
          technicianId,
          itemType: 'mobilySim',
          packagingType: mobilySimPackagingType,
          quantity: mobilySim,
          fromInventory: 'fixed',
          toInventory: 'moving',
          performedBy: user.id,
          reason: 'transfer',
          notes: 'Transfer from fixed to moving inventory',
        }));
      }
      if (stcSim > 0) {
        movements.push(storage.createStockMovement({
          technicianId,
          itemType: 'stcSim',
          packagingType: stcSimPackagingType,
          quantity: stcSim,
          fromInventory: 'fixed',
          toInventory: 'moving',
          performedBy: user.id,
          reason: 'transfer',
          notes: 'Transfer from fixed to moving inventory',
        }));
      }
      if (zainSim > 0) {
        movements.push(storage.createStockMovement({
          technicianId,
          itemType: 'zainSim',
          packagingType: zainSimPackagingType,
          quantity: zainSim,
          fromInventory: 'fixed',
          toInventory: 'moving',
          performedBy: user.id,
          reason: 'transfer',
          notes: 'Transfer from fixed to moving inventory',
        }));
      }

      await Promise.all(movements);
      
      // Log the transfer operation
      const technician = await storage.getUser(technicianId);
      if (technician) {
        await storage.createSystemLog({
          userId: user.id,
          userName: user.fullName || user.username || 'Unknown',
          userRole: user.role,
          regionId: technician.regionId,
          action: 'transfer',
          entityType: 'stock_transfer',
          entityId: technicianId,
          entityName: technician.fullName || technician.username,
          description: `نقل مخزون من الثابت إلى المتحرك للفني: ${technician.fullName || technician.username}`,
          severity: 'info',
          success: true,
        });
      }

      res.json({ success: true, message: "Transfer completed successfully" });
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: "Failed to transfer stock" });
    }
  });

  app.get("/api/stock-movements", requireAuth, async (req, res) => {
    try {
      const technicianId = req.query.technicianId as string | undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const movements = await storage.getStockMovements(technicianId, limit);
      res.json(movements);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch stock movements" });
    }
  });

  // Warehouse Routes
  app.get("/api/warehouses", requireAuth, requireAdmin, async (req, res) => {
    try {
      const warehouses = await storage.getWarehouses();
      res.json(warehouses);
    } catch (error) {
      console.error("Error fetching warehouses:", error);
      res.status(500).json({ message: "Failed to fetch warehouses" });
    }
  });

  app.get("/api/supervisor/warehouses", requireAuth, requireSupervisor, async (req, res) => {
    try {
      const user = (req as any).user;
      
      if (!user.regionId) {
        return res.status(400).json({ message: "المشرف يجب أن يكون مرتبط بمنطقة لعرض البيانات" });
      }
      
      const warehouses = await storage.getWarehousesByRegion(user.regionId);
      res.json(warehouses);
    } catch (error) {
      console.error("Error fetching region warehouses:", error);
      res.status(500).json({ message: "Failed to fetch region warehouses" });
    }
  });

  // Supervisor inventory requests endpoints
  app.get("/api/supervisor/inventory-requests", requireAuth, requireSupervisor, async (req, res) => {
    try {
      const user = (req as any).user;
      
      if (!user.regionId) {
        return res.status(400).json({ message: "المشرف يجب أن يكون مرتبط بمنطقة لعرض البيانات" });
      }
      
      const requests = await db
        .select({
          id: inventoryRequests.id,
          technicianId: inventoryRequests.technicianId,
          technicianName: users.fullName,
          technicianUsername: users.username,
          technicianCity: users.city,
          n950Boxes: inventoryRequests.n950Boxes,
          n950Units: inventoryRequests.n950Units,
          i9000sBoxes: inventoryRequests.i9000sBoxes,
          i9000sUnits: inventoryRequests.i9000sUnits,
          i9100Boxes: inventoryRequests.i9100Boxes,
          i9100Units: inventoryRequests.i9100Units,
          rollPaperBoxes: inventoryRequests.rollPaperBoxes,
          rollPaperUnits: inventoryRequests.rollPaperUnits,
          stickersBoxes: inventoryRequests.stickersBoxes,
          stickersUnits: inventoryRequests.stickersUnits,
          newBatteriesBoxes: inventoryRequests.newBatteriesBoxes,
          newBatteriesUnits: inventoryRequests.newBatteriesUnits,
          mobilySimBoxes: inventoryRequests.mobilySimBoxes,
          mobilySimUnits: inventoryRequests.mobilySimUnits,
          stcSimBoxes: inventoryRequests.stcSimBoxes,
          stcSimUnits: inventoryRequests.stcSimUnits,
          zainSimBoxes: inventoryRequests.zainSimBoxes,
          zainSimUnits: inventoryRequests.zainSimUnits,
          notes: inventoryRequests.notes,
          status: inventoryRequests.status,
          adminNotes: inventoryRequests.adminNotes,
          respondedBy: inventoryRequests.respondedBy,
          respondedAt: inventoryRequests.respondedAt,
          createdAt: inventoryRequests.createdAt,
        })
        .from(inventoryRequests)
        .leftJoin(users, eq(inventoryRequests.technicianId, users.id))
        .where(eq(users.regionId, user.regionId))
        .orderBy(inventoryRequests.createdAt);
      
      res.json(requests);
    } catch (error) {
      console.error("Error fetching supervisor inventory requests:", error);
      res.status(500).json({ message: "Failed to fetch inventory requests" });
    }
  });

  app.get("/api/supervisor/inventory-requests/pending/count", requireAuth, requireSupervisor, async (req, res) => {
    try {
      const user = (req as any).user;
      
      if (!user.regionId) {
        return res.status(400).json({ message: "المشرف يجب أن يكون مرتبط بمنطقة لعرض البيانات" });
      }
      
      const pendingRequests = await db
        .select()
        .from(inventoryRequests)
        .leftJoin(users, eq(inventoryRequests.technicianId, users.id))
        .where(and(
          eq(users.regionId, user.regionId),
          eq(inventoryRequests.status, "pending")
        ));
      
      res.json({ count: pendingRequests.length });
    } catch (error) {
      console.error("Error fetching pending count:", error);
      res.status(500).json({ message: "Failed to fetch pending count" });
    }
  });

  // Supervisor endpoint to get technicians in their region
  app.get("/api/supervisor/technicians", requireAuth, requireSupervisor, async (req, res) => {
    try {
      const supervisor = (req as any).user;
      
      if (!supervisor.regionId) {
        return res.status(400).json({ message: "المشرف يجب أن يكون مرتبط بمنطقة" });
      }

      const allUsers = await storage.getUsers();
      
      // Filter technicians in supervisor's region
      const technicians = allUsers.filter(user => 
        user.role === 'technician' && user.regionId === supervisor.regionId
      );

      res.json(technicians);
    } catch (error) {
      console.error("Error fetching technicians:", error);
      res.status(500).json({ message: "Failed to fetch technicians" });
    }
  });

  // Supervisor users endpoints - for viewing technician details
  app.get("/api/supervisor/users/:userId", requireAuth, requireSupervisor, async (req, res) => {
    try {
      const user = (req as any).user;
      
      // Admin can access all users, supervisors only their region
      if (user.role === ROLES.SUPERVISOR) {
        if (!user.regionId) {
          return res.status(400).json({ message: "المشرف يجب أن يكون مرتبط بمنطقة" });
        }
      }

      const targetUser = await storage.getUser(req.params.userId);
      if (!targetUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Supervisors can only access users in their region, admins can access all
      if (user.role === ROLES.SUPERVISOR && targetUser.regionId !== user.regionId) {
        return res.status(403).json({ message: "لا يمكنك الوصول إلى مستخدمين خارج منطقتك" });
      }

      res.json(targetUser);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.get("/api/supervisor/users/:userId/fixed-inventory", requireAuth, requireSupervisor, async (req, res) => {
    try {
      const user = (req as any).user;
      
      // Admin can access all users, supervisors only their region
      if (user.role === ROLES.SUPERVISOR) {
        if (!user.regionId) {
          return res.status(400).json({ message: "المشرف يجب أن يكون مرتبط بمنطقة" });
        }
      }

      const targetUser = await storage.getUser(req.params.userId);
      if (!targetUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Supervisors can only access users in their region, admins can access all
      if (user.role === ROLES.SUPERVISOR && targetUser.regionId !== user.regionId) {
        return res.status(403).json({ message: "لا يمكنك الوصول إلى مستخدمين خارج منطقتك" });
      }

      const inventory = await storage.getTechnicianFixedInventory(req.params.userId);
      
      // If no fixed inventory exists, return null
      if (!inventory) {
        return res.json(null);
      }

      // Add user info to the inventory response
      const inventoryWithUserInfo = {
        ...inventory,
        technicianName: targetUser.fullName,
        city: targetUser.city || "غير محدد",
      };

      res.json(inventoryWithUserInfo);
    } catch (error) {
      console.error("Error fetching fixed inventory:", error);
      res.status(500).json({ message: "Failed to fetch fixed inventory" });
    }
  });

  app.get("/api/supervisor/users/:userId/moving-inventory", requireAuth, requireSupervisor, async (req, res) => {
    try {
      const user = (req as any).user;
      
      // Admin can access all users, supervisors only their region
      if (user.role === ROLES.SUPERVISOR) {
        if (!user.regionId) {
          return res.status(400).json({ message: "المشرف يجب أن يكون مرتبط بمنطقة" });
        }
      }

      const targetUser = await storage.getUser(req.params.userId);
      if (!targetUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Supervisors can only access users in their region, admins can access all
      if (user.role === ROLES.SUPERVISOR && targetUser.regionId !== user.regionId) {
        return res.status(403).json({ message: "لا يمكنك الوصول إلى مستخدمين خارج منطقتك" });
      }

      const inventory = await storage.getTechnicianInventory(req.params.userId);
      res.json(inventory || null);
    } catch (error) {
      console.error("Error fetching moving inventory:", error);
      res.status(500).json({ message: "Failed to fetch moving inventory" });
    }
  });

  app.post("/api/warehouses", requireAuth, requireAdmin, async (req, res) => {
    try {
      const user = (req as any).user;
      const validatedData = insertWarehouseSchema.parse(req.body);
      const warehouse = await storage.createWarehouse(validatedData, user.id);
      res.status(201).json(warehouse);
    } catch (error) {
      console.error("Error creating warehouse:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create warehouse" });
    }
  });

  app.get("/api/warehouses/:id", requireAuth, requireSupervisor, async (req, res) => {
    try {
      const user = (req as any).user;
      const warehouse = await storage.getWarehouse(req.params.id);
      if (!warehouse) {
        return res.status(404).json({ message: "Warehouse not found" });
      }

      // Supervisors can only access warehouses in their region
      if (user.role === 'supervisor' && warehouse.regionId !== user.regionId) {
        return res.status(403).json({ message: "لا يمكنك الوصول إلى مستودعات خارج منطقتك" });
      }

      res.json(warehouse);
    } catch (error) {
      console.error("Error fetching warehouse:", error);
      res.status(500).json({ message: "Failed to fetch warehouse" });
    }
  });

  app.put("/api/warehouses/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const updates = insertWarehouseSchema.partial().parse(req.body);
      const warehouse = await storage.updateWarehouse(req.params.id, updates);
      res.json(warehouse);
    } catch (error) {
      console.error("Error updating warehouse:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      if (error instanceof Error && error.message.includes("not found")) {
        return res.status(404).json({ message: "Warehouse not found" });
      }
      res.status(500).json({ message: "Failed to update warehouse" });
    }
  });

  app.delete("/api/warehouses/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const deleted = await storage.deleteWarehouse(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Warehouse not found" });
      }
      res.json({ message: "Warehouse deleted successfully" });
    } catch (error) {
      console.error("Error deleting warehouse:", error);
      res.status(500).json({ message: "Failed to delete warehouse" });
    }
  });

  app.get("/api/warehouse-inventory/:warehouseId", requireAuth, requireSupervisor, async (req, res) => {
    try {
      const user = (req as any).user;

      // Supervisors can only access warehouse inventory in their region
      if (user.role === 'supervisor') {
        const warehouse = await storage.getWarehouse(req.params.warehouseId);
        if (!warehouse) {
          return res.status(404).json({ message: "Warehouse not found" });
        }
        if (warehouse.regionId !== user.regionId) {
          return res.status(403).json({ message: "لا يمكنك الوصول إلى مستودعات خارج منطقتك" });
        }
      }

      const inventory = await storage.getWarehouseInventory(req.params.warehouseId);
      if (!inventory) {
        return res.status(404).json({ message: "Warehouse inventory not found" });
      }
      res.json(inventory);
    } catch (error) {
      console.error("Error fetching warehouse inventory:", error);
      res.status(500).json({ message: "Failed to fetch warehouse inventory" });
    }
  });

  app.put("/api/warehouse-inventory/:warehouseId", requireAuth, requireSupervisor, async (req, res) => {
    try {
      const user = (req as any).user;

      // Get warehouse info for logging
      const warehouse = await storage.getWarehouse(req.params.warehouseId);
      if (!warehouse) {
        return res.status(404).json({ message: "Warehouse not found" });
      }

      // Supervisors can only update warehouse inventory in their region
      if (user.role === 'supervisor') {
        if (warehouse.regionId !== user.regionId) {
          return res.status(403).json({ message: "لا يمكنك تعديل مستودعات خارج منطقتك" });
        }
      }

      const validatedData = insertWarehouseInventorySchema.parse(req.body);
      const inventory = await storage.updateWarehouseInventory(req.params.warehouseId, validatedData);
      
      // Log the operation
      await storage.createSystemLog({
        userId: user.id,
        userName: user.fullName || user.username || 'Unknown',
        userRole: user.role,
        regionId: warehouse.regionId,
        action: 'update',
        entityType: 'warehouse',
        entityId: warehouse.id,
        entityName: warehouse.name,
        description: `تحديث مخزون المستودع: ${warehouse.name}`,
        severity: 'info',
        success: true,
      });
      
      res.json(inventory);
    } catch (error) {
      console.error("Error updating warehouse inventory:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      if (error instanceof Error && error.message.includes("not found")) {
        return res.status(404).json({ message: "Warehouse inventory not found" });
      }
      res.status(500).json({ message: "Failed to update warehouse inventory" });
    }
  });

  app.post("/api/warehouse-transfers", requireAuth, requireSupervisor, async (req, res) => {
    try {
      const user = (req as any).user;
      const { warehouseId, technicianId, notes, ...items } = req.body;

      if (!warehouseId || !technicianId) {
        return res.status(400).json({ message: "warehouseId and technicianId are required" });
      }

      // Supervisors: validate region access
      if (user.role === 'supervisor') {
        if (!user.regionId) {
          return res.status(400).json({ message: "المشرف يجب أن يكون مرتبط بمنطقة" });
        }

        // Check warehouse is in supervisor's region
        const warehouse = await storage.getWarehouse(warehouseId);
        if (!warehouse) {
          return res.status(404).json({ message: "Warehouse not found" });
        }
        if (warehouse.regionId !== user.regionId) {
          return res.status(403).json({ message: "لا يمكنك النقل من مستودعات خارج منطقتك" });
        }

        // Check technician is in supervisor's region
        const technician = await storage.getUser(technicianId);
        if (!technician) {
          return res.status(404).json({ message: "Technician not found" });
        }
        if (technician.regionId !== user.regionId) {
          return res.status(403).json({ message: "لا يمكنك النقل إلى فنيين خارج منطقتك" });
        }
      }

      const itemTypes = ['n950', 'i9000s', 'i9100', 'rollPaper', 'stickers', 'newBatteries', 'mobilySim', 'stcSim', 'zainSim'];
      const transfers: any[] = [];

      for (const itemType of itemTypes) {
        const quantity = items[itemType];
        const packagingType = items[`${itemType}PackagingType`];

        if (quantity && quantity > 0 && packagingType) {
          transfers.push({
            warehouseId,
            technicianId,
            itemType,
            packagingType,
            quantity,
            performedBy: user.id,
            notes,
          });
        }
      }

      if (transfers.length === 0) {
        return res.status(400).json({ message: "No items to transfer" });
      }

      for (const transfer of transfers) {
        await storage.transferFromWarehouse(transfer);
      }
      
      // Log the warehouse transfer operation
      const warehouse = await storage.getWarehouse(warehouseId);
      const technician = await storage.getUser(technicianId);
      if (warehouse && technician) {
        await storage.createSystemLog({
          userId: user.id,
          userName: user.fullName || user.username || 'Unknown',
          userRole: user.role,
          regionId: warehouse.regionId,
          action: 'transfer',
          entityType: 'warehouse_transfer',
          entityId: warehouseId,
          entityName: `${warehouse.name} -> ${technician.fullName || technician.username}`,
          description: `نقل مخزون من المستودع ${warehouse.name} إلى الفني ${technician.fullName || technician.username}`,
          severity: 'info',
          success: true,
        });
      }

      res.json({ success: true, message: "Transfer completed successfully" });
    } catch (error) {
      console.error("Error creating warehouse transfer:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      if (error instanceof Error) {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: "Failed to create warehouse transfer" });
    }
  });

  app.get("/api/warehouse-transfers", requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const warehouseId = req.query.warehouseId as string | undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      
      let technicianId: string | undefined;
      let regionId: string | undefined;

      if (user.role === 'admin') {
        // Admins see all transfers
        technicianId = undefined;
        regionId = undefined;
      } else if (user.role === 'supervisor') {
        // Supervisors see transfers in their region
        if (!user.regionId) {
          return res.status(403).json({ message: "المشرف يجب أن يكون مرتبط بمنطقة" });
        }
        regionId = user.regionId;
        technicianId = undefined;
      } else {
        // Technicians see only transfers sent to them
        technicianId = user.id;
        regionId = undefined;
      }
      
      const transfers = await storage.getWarehouseTransfers(warehouseId, technicianId, regionId, limit);
      res.json(transfers);
    } catch (error) {
      console.error("Error fetching warehouse transfers:", error);
      res.status(500).json({ message: "Failed to fetch warehouse transfers" });
    }
  });

  app.post("/api/warehouse-transfers/:id/accept", requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const [transfer] = await db
        .select()
        .from(warehouseTransfers)
        .where(eq(warehouseTransfers.id, req.params.id));

      if (!transfer) {
        return res.status(404).json({ message: "Transfer not found" });
      }

      if (user.role !== 'admin' && transfer.technicianId !== user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const updatedTransfer = await storage.acceptWarehouseTransfer(req.params.id);
      
      // Log the accept operation
      const warehouse = await storage.getWarehouse(transfer.warehouseId);
      const technician = await storage.getUser(transfer.technicianId);
      if (warehouse && technician) {
        await storage.createSystemLog({
          userId: user.id,
          userName: user.fullName || user.username || 'Unknown',
          userRole: user.role,
          regionId: warehouse.regionId,
          action: 'accept',
          entityType: 'warehouse_transfer',
          entityId: req.params.id,
          entityName: `${warehouse.name} -> ${technician.fullName || technician.username}`,
          description: `قبول طلب نقل من المستودع ${warehouse.name} إلى ${technician.fullName || technician.username}`,
          severity: 'info',
          success: true,
        });
      }
      
      res.json(updatedTransfer);
    } catch (error) {
      console.error("Error accepting transfer:", error);
      if (error instanceof Error) {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: "Failed to accept transfer" });
    }
  });

  app.post("/api/warehouse-transfers/:id/reject", requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const [transfer] = await db
        .select()
        .from(warehouseTransfers)
        .where(eq(warehouseTransfers.id, req.params.id));

      if (!transfer) {
        return res.status(404).json({ message: "Transfer not found" });
      }

      if (user.role !== 'admin' && transfer.technicianId !== user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const { reason } = req.body;
      const updatedTransfer = await storage.rejectWarehouseTransfer(req.params.id, reason);
      
      // Log the reject operation
      const warehouse = await storage.getWarehouse(transfer.warehouseId);
      const technician = await storage.getUser(transfer.technicianId);
      if (warehouse && technician) {
        await storage.createSystemLog({
          userId: user.id,
          userName: user.fullName || user.username || 'Unknown',
          userRole: user.role,
          regionId: warehouse.regionId,
          action: 'reject',
          entityType: 'warehouse_transfer',
          entityId: req.params.id,
          entityName: `${warehouse.name} -> ${technician.fullName || technician.username}`,
          description: `رفض طلب نقل من المستودع ${warehouse.name} إلى ${technician.fullName || technician.username}${reason ? `: ${reason}` : ''}`,
          severity: 'warning',
          success: true,
        });
      }
      
      res.json(updatedTransfer);
    } catch (error) {
      console.error("Error rejecting transfer:", error);
      if (error instanceof Error) {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: "Failed to reject transfer" });
    }
  });

  // Bulk operations for multiple request IDs (MUST be before dynamic routes)
  app.post("/api/warehouse-transfer-batches/bulk/accept", requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const { requestIds } = req.body;

      if (!requestIds || !Array.isArray(requestIds) || requestIds.length === 0) {
        return res.status(400).json({ message: "Request IDs array is required" });
      }

      const allUpdatedTransfers = [];

      for (const requestId of requestIds) {
        const transfers = await db
          .select()
          .from(warehouseTransfers)
          .where(or(
            eq(warehouseTransfers.requestId, requestId),
            eq(warehouseTransfers.id, requestId)
          ));

        if (transfers.length === 0) continue;

        const firstTransfer = transfers[0];
        if (user.role !== 'admin' && firstTransfer.technicianId !== user.id) {
          return res.status(403).json({ message: "Forbidden" });
        }

        for (const transfer of transfers) {
          if (transfer.status === 'pending') {
            const updated = await storage.acceptWarehouseTransfer(transfer.id);
            allUpdatedTransfers.push(updated);
          }
        }
      }

      res.json({ success: true, updated: allUpdatedTransfers.length });
    } catch (error) {
      console.error("Error bulk accepting transfers:", error);
      if (error instanceof Error) {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: "Failed to bulk accept transfers" });
    }
  });

  app.post("/api/warehouse-transfer-batches/bulk/reject", requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const { requestIds, reason } = req.body;

      if (!requestIds || !Array.isArray(requestIds) || requestIds.length === 0) {
        return res.status(400).json({ message: "Request IDs array is required" });
      }

      if (!reason || !reason.trim()) {
        return res.status(400).json({ message: "Rejection reason is required" });
      }

      const allUpdatedTransfers = [];

      for (const requestId of requestIds) {
        const transfers = await db
          .select()
          .from(warehouseTransfers)
          .where(or(
            eq(warehouseTransfers.requestId, requestId),
            eq(warehouseTransfers.id, requestId)
          ));

        if (transfers.length === 0) continue;

        const firstTransfer = transfers[0];
        if (user.role !== 'admin' && firstTransfer.technicianId !== user.id) {
          return res.status(403).json({ message: "Forbidden" });
        }

        for (const transfer of transfers) {
          if (transfer.status === 'pending') {
            const updated = await storage.rejectWarehouseTransfer(transfer.id, reason);
            allUpdatedTransfers.push(updated);
          }
        }
      }

      res.json({ success: true, updated: allUpdatedTransfers.length });
    } catch (error) {
      console.error("Error bulk rejecting transfers:", error);
      if (error instanceof Error) {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: "Failed to bulk reject transfers" });
    }
  });

  // Dynamic routes for single batch operations (MUST be after bulk routes)
  app.post("/api/warehouse-transfer-batches/:requestId/accept", requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const { requestId } = req.params;

      const transfers = await db
        .select()
        .from(warehouseTransfers)
        .where(or(
          eq(warehouseTransfers.requestId, requestId),
          eq(warehouseTransfers.id, requestId)
        ));

      if (!transfers || transfers.length === 0) {
        return res.status(404).json({ message: "No transfers found for this request" });
      }

      const firstTransfer = transfers[0];
      if (user.role !== 'admin' && firstTransfer.technicianId !== user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const updatedTransfers = [];
      for (const transfer of transfers) {
        if (transfer.status === 'pending') {
          const updated = await storage.acceptWarehouseTransfer(transfer.id);
          updatedTransfers.push(updated);
        } else {
          updatedTransfers.push(transfer);
        }
      }

      res.json(updatedTransfers);
    } catch (error) {
      console.error("Error accepting transfer batch:", error);
      if (error instanceof Error) {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: "Failed to accept transfer batch" });
    }
  });

  app.post("/api/warehouse-transfer-batches/:requestId/reject", requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const { requestId } = req.params;
      const { reason } = req.body;

      if (!reason || !reason.trim()) {
        return res.status(400).json({ message: "Rejection reason is required" });
      }

      const transfers = await db
        .select()
        .from(warehouseTransfers)
        .where(or(
          eq(warehouseTransfers.requestId, requestId),
          eq(warehouseTransfers.id, requestId)
        ));

      if (!transfers || transfers.length === 0) {
        return res.status(404).json({ message: "No transfers found for this request" });
      }

      const firstTransfer = transfers[0];
      if (user.role !== 'admin' && firstTransfer.technicianId !== user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const updatedTransfers = [];
      for (const transfer of transfers) {
        if (transfer.status === 'pending') {
          const updated = await storage.rejectWarehouseTransfer(transfer.id, reason);
          updatedTransfers.push(updated);
        } else {
          updatedTransfers.push(transfer);
        }
      }

      res.json(updatedTransfers);
    } catch (error) {
      console.error("Error rejecting transfer batch:", error);
      if (error instanceof Error) {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: "Failed to reject transfer batch" });
    }
  });

  app.delete("/api/warehouse-transfers", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { ids } = req.body;
      
      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: "Invalid or empty IDs array" });
      }

      // استخدام transaction لضمان سلامة البيانات
      await db.transaction(async (tx) => {
        // قراءة بيانات العمليات المراد حذفها لإرجاع المخزون
        const transfersToDelete = await tx
          .select()
          .from(warehouseTransfers)
          .where(inArray(warehouseTransfers.id, ids));

        if (transfersToDelete.length === 0) {
          throw new Error("No transfers found with the provided IDs");
        }

        // تجميع الكميات حسب المستودع
        const warehouseUpdates = new Map<string, any>();
        // تجميع الكميات حسب الفني (للعمليات المقبولة فقط)
        const technicianUpdates = new Map<string, any>();

        for (const transfer of transfersToDelete) {
          if (!warehouseUpdates.has(transfer.warehouseId)) {
            warehouseUpdates.set(transfer.warehouseId, {
              n950Boxes: 0,
              n950Units: 0,
              i9000sBoxes: 0,
              i9000sUnits: 0,
              i9100Boxes: 0,
              i9100Units: 0,
              rollPaperBoxes: 0,
              rollPaperUnits: 0,
              stickersBoxes: 0,
              stickersUnits: 0,
              newBatteriesBoxes: 0,
              newBatteriesUnits: 0,
              mobilySimBoxes: 0,
              mobilySimUnits: 0,
              stcSimBoxes: 0,
              stcSimUnits: 0,
              zainSimBoxes: 0,
              zainSimUnits: 0,
            });
          }

          const updates = warehouseUpdates.get(transfer.warehouseId);
          
          // إضافة الكميات المنقولة حسب نوع التغليف
          if (transfer.packagingType === 'box') {
            updates[`${transfer.itemType}Boxes`] += transfer.quantity;
          } else {
            updates[`${transfer.itemType}Units`] += transfer.quantity;
          }

          // إذا كانت العملية مقبولة، يجب طرح الكميات من مخزون الفني
          if (transfer.status === 'accepted') {
            if (!technicianUpdates.has(transfer.technicianId)) {
              technicianUpdates.set(transfer.technicianId, {
                n950Boxes: 0,
                n950Units: 0,
                i9000sBoxes: 0,
                i9000sUnits: 0,
                i9100Boxes: 0,
                i9100Units: 0,
                rollPaperBoxes: 0,
                rollPaperUnits: 0,
                stickersBoxes: 0,
                stickersUnits: 0,
                newBatteriesBoxes: 0,
                newBatteriesUnits: 0,
                mobilySimBoxes: 0,
                mobilySimUnits: 0,
                stcSimBoxes: 0,
                stcSimUnits: 0,
                zainSimBoxes: 0,
                zainSimUnits: 0,
              });
            }

            const techUpdates = technicianUpdates.get(transfer.technicianId);
            
            // إضافة الكميات للطرح من الفني
            if (transfer.packagingType === 'box') {
              techUpdates[`${transfer.itemType}Boxes`] += transfer.quantity;
            } else {
              techUpdates[`${transfer.itemType}Units`] += transfer.quantity;
            }
          }
        }

        // إرجاع المخزون إلى المستودعات
        for (const [warehouseId, updates] of Array.from(warehouseUpdates.entries())) {
          // الحصول على المخزون الحالي
          const [currentInventory] = await tx
            .select()
            .from(warehouseInventory)
            .where(eq(warehouseInventory.warehouseId, warehouseId));

          if (!currentInventory) {
            // إذا لم يكن هناك مخزون للمستودع، نرمي خطأ لإيقاف العملية
            throw new Error(`Warehouse inventory not found for warehouse ID: ${warehouseId}`);
          }

          // تحديث المخزون بإضافة الكميات المرتجعة
          await tx
            .update(warehouseInventory)
            .set({
              n950Boxes: currentInventory.n950Boxes + updates.n950Boxes,
              n950Units: currentInventory.n950Units + updates.n950Units,
              i9000sBoxes: currentInventory.i9000sBoxes + updates.i9000sBoxes,
              i9000sUnits: currentInventory.i9000sUnits + updates.i9000sUnits,
              i9100Boxes: currentInventory.i9100Boxes + updates.i9100Boxes,
              i9100Units: currentInventory.i9100Units + updates.i9100Units,
              rollPaperBoxes: currentInventory.rollPaperBoxes + updates.rollPaperBoxes,
              rollPaperUnits: currentInventory.rollPaperUnits + updates.rollPaperUnits,
              stickersBoxes: currentInventory.stickersBoxes + updates.stickersBoxes,
              stickersUnits: currentInventory.stickersUnits + updates.stickersUnits,
              newBatteriesBoxes: currentInventory.newBatteriesBoxes + updates.newBatteriesBoxes,
              newBatteriesUnits: currentInventory.newBatteriesUnits + updates.newBatteriesUnits,
              mobilySimBoxes: currentInventory.mobilySimBoxes + updates.mobilySimBoxes,
              mobilySimUnits: currentInventory.mobilySimUnits + updates.mobilySimUnits,
              stcSimBoxes: currentInventory.stcSimBoxes + updates.stcSimBoxes,
              stcSimUnits: currentInventory.stcSimUnits + updates.stcSimUnits,
              zainSimBoxes: currentInventory.zainSimBoxes + updates.zainSimBoxes,
              zainSimUnits: currentInventory.zainSimUnits + updates.zainSimUnits,
            })
            .where(eq(warehouseInventory.warehouseId, warehouseId));
        }

        // طرح الكميات من مخزون الفنيين (للعمليات المقبولة فقط)
        for (const [technicianId, updates] of Array.from(technicianUpdates.entries())) {
          // الحصول على اسم الفني من جدول users
          const [technician] = await tx
            .select({ fullName: users.fullName, city: users.city })
            .from(users)
            .where(eq(users.id, technicianId));

          if (!technician) {
            throw new Error(`Technician not found for ID: ${technicianId}`);
          }

          // الحصول على المخزون المتحرك الحالي للفني باستخدام technicianName
          const [currentMovingInventory] = await tx
            .select()
            .from(techniciansInventory)
            .where(eq(techniciansInventory.technicianName, technician.fullName));

          if (!currentMovingInventory) {
            throw new Error(`Moving inventory not found for technician: ${technician.fullName}`);
          }

          // تحديث المخزون بطرح الكميات
          await tx
            .update(techniciansInventory)
            .set({
              n950Boxes: Math.max(0, currentMovingInventory.n950Boxes - updates.n950Boxes),
              n950Units: Math.max(0, currentMovingInventory.n950Units - updates.n950Units),
              i9000sBoxes: Math.max(0, currentMovingInventory.i9000sBoxes - updates.i9000sBoxes),
              i9000sUnits: Math.max(0, currentMovingInventory.i9000sUnits - updates.i9000sUnits),
              i9100Boxes: Math.max(0, currentMovingInventory.i9100Boxes - updates.i9100Boxes),
              i9100Units: Math.max(0, currentMovingInventory.i9100Units - updates.i9100Units),
              rollPaperBoxes: Math.max(0, currentMovingInventory.rollPaperBoxes - updates.rollPaperBoxes),
              rollPaperUnits: Math.max(0, currentMovingInventory.rollPaperUnits - updates.rollPaperUnits),
              stickersBoxes: Math.max(0, currentMovingInventory.stickersBoxes - updates.stickersBoxes),
              stickersUnits: Math.max(0, currentMovingInventory.stickersUnits - updates.stickersUnits),
              newBatteriesBoxes: Math.max(0, currentMovingInventory.newBatteriesBoxes - updates.newBatteriesBoxes),
              newBatteriesUnits: Math.max(0, currentMovingInventory.newBatteriesUnits - updates.newBatteriesUnits),
              mobilySimBoxes: Math.max(0, currentMovingInventory.mobilySimBoxes - updates.mobilySimBoxes),
              mobilySimUnits: Math.max(0, currentMovingInventory.mobilySimUnits - updates.mobilySimUnits),
              stcSimBoxes: Math.max(0, currentMovingInventory.stcSimBoxes - updates.stcSimBoxes),
              stcSimUnits: Math.max(0, currentMovingInventory.stcSimUnits - updates.stcSimUnits),
              zainSimBoxes: Math.max(0, currentMovingInventory.zainSimBoxes - updates.zainSimBoxes),
              zainSimUnits: Math.max(0, currentMovingInventory.zainSimUnits - updates.zainSimUnits),
            })
            .where(eq(techniciansInventory.technicianName, technician.fullName));
        }

        // حذف السجلات بعد إرجاع المخزون بنجاح
        await tx
          .delete(warehouseTransfers)
          .where(inArray(warehouseTransfers.id, ids));
      });

      res.json({ 
        message: "Transfers deleted successfully and inventory returned to warehouse", 
        count: ids.length
      });
    } catch (error) {
      console.error("Error deleting transfers:", error);
      if (error instanceof Error) {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: "Failed to delete transfers" });
    }
  });

  // Inventory Requests routes
  app.get("/api/inventory-requests", requireAuth, requireAdmin, async (req, res) => {
    try {
      const requests = await db
        .select({
          id: inventoryRequests.id,
          technicianId: inventoryRequests.technicianId,
          technicianName: users.fullName,
          technicianUsername: users.username,
          technicianCity: users.city,
          n950Boxes: inventoryRequests.n950Boxes,
          n950Units: inventoryRequests.n950Units,
          i9000sBoxes: inventoryRequests.i9000sBoxes,
          i9000sUnits: inventoryRequests.i9000sUnits,
          i9100Boxes: inventoryRequests.i9100Boxes,
          i9100Units: inventoryRequests.i9100Units,
          rollPaperBoxes: inventoryRequests.rollPaperBoxes,
          rollPaperUnits: inventoryRequests.rollPaperUnits,
          stickersBoxes: inventoryRequests.stickersBoxes,
          stickersUnits: inventoryRequests.stickersUnits,
          newBatteriesBoxes: inventoryRequests.newBatteriesBoxes,
          newBatteriesUnits: inventoryRequests.newBatteriesUnits,
          mobilySimBoxes: inventoryRequests.mobilySimBoxes,
          mobilySimUnits: inventoryRequests.mobilySimUnits,
          stcSimBoxes: inventoryRequests.stcSimBoxes,
          stcSimUnits: inventoryRequests.stcSimUnits,
          zainSimBoxes: inventoryRequests.zainSimBoxes,
          zainSimUnits: inventoryRequests.zainSimUnits,
          notes: inventoryRequests.notes,
          status: inventoryRequests.status,
          adminNotes: inventoryRequests.adminNotes,
          respondedBy: inventoryRequests.respondedBy,
          respondedAt: inventoryRequests.respondedAt,
          createdAt: inventoryRequests.createdAt,
        })
        .from(inventoryRequests)
        .leftJoin(users, eq(inventoryRequests.technicianId, users.id))
        .orderBy(inventoryRequests.createdAt);
      
      res.json(requests);
    } catch (error) {
      console.error("Error fetching inventory requests:", error);
      res.status(500).json({ message: "Failed to fetch inventory requests" });
    }
  });

  app.get("/api/inventory-requests/my", requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const requests = await db
        .select()
        .from(inventoryRequests)
        .where(eq(inventoryRequests.technicianId, user.id))
        .orderBy(inventoryRequests.createdAt);
      
      res.json(requests);
    } catch (error) {
      console.error("Error fetching my inventory requests:", error);
      res.status(500).json({ message: "Failed to fetch inventory requests" });
    }
  });

  app.get("/api/inventory-requests/pending/count", requireAuth, requireAdmin, async (req, res) => {
    try {
      const pendingRequests = await db
        .select()
        .from(inventoryRequests)
        .where(eq(inventoryRequests.status, "pending"));
      
      res.json({ count: pendingRequests.length });
    } catch (error) {
      console.error("Error fetching pending count:", error);
      res.status(500).json({ message: "Failed to fetch pending count" });
    }
  });

  app.post("/api/inventory-requests", requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      
      if (user.role === 'admin') {
        return res.status(403).json({ message: "Admins cannot create inventory requests" });
      }

      const validatedData = insertInventoryRequestSchema.parse({
        ...req.body,
        technicianId: user.id,
      });

      const [newRequest] = await db
        .insert(inventoryRequests)
        .values(validatedData)
        .returning();

      res.json(newRequest);
    } catch (error) {
      console.error("Error creating inventory request:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create inventory request" });
    }
  });

  app.patch("/api/inventory-requests/:id/approve", requireAuth, requireSupervisor, async (req, res) => {
    try {
      const user = (req as any).user;
      const { adminNotes, warehouseId } = req.body;

      if (!warehouseId) {
        return res.status(400).json({ message: "Warehouse ID is required" });
      }

      const request = await db
        .select()
        .from(inventoryRequests)
        .where(eq(inventoryRequests.id, req.params.id))
        .limit(1);

      if (!request || request.length === 0) {
        return res.status(404).json({ message: "Request not found" });
      }

      const inventoryRequest = request[0];

      if (inventoryRequest.status !== 'pending') {
        return res.status(400).json({ message: "Request is not pending" });
      }

      // Supervisors can only approve requests from technicians in their region
      if (user.role === 'supervisor') {
        const [technician] = await db
          .select()
          .from(users)
          .where(eq(users.id, inventoryRequest.technicianId))
          .limit(1);

        if (!technician || technician.regionId !== user.regionId) {
          return res.status(403).json({ message: "لا يمكنك معالجة طلبات من خارج منطقتك" });
        }
      }

      await db.transaction(async (tx) => {
        const warehouseInv = await tx
          .select()
          .from(warehouseInventory)
          .where(eq(warehouseInventory.warehouseId, warehouseId))
          .limit(1);

        if (!warehouseInv || warehouseInv.length === 0) {
          throw new Error("Warehouse inventory not found");
        }

        const currentInv = warehouseInv[0];

        const stockChecks = [
          { name: 'N950 (صناديق)', current: currentInv.n950Boxes || 0, requested: inventoryRequest.n950Boxes || 0 },
          { name: 'N950 (وحدات)', current: currentInv.n950Units || 0, requested: inventoryRequest.n950Units || 0 },
          { name: 'I9000s (صناديق)', current: currentInv.i9000sBoxes || 0, requested: inventoryRequest.i9000sBoxes || 0 },
          { name: 'I9000s (وحدات)', current: currentInv.i9000sUnits || 0, requested: inventoryRequest.i9000sUnits || 0 },
          { name: 'I9100 (صناديق)', current: currentInv.i9100Boxes || 0, requested: inventoryRequest.i9100Boxes || 0 },
          { name: 'I9100 (وحدات)', current: currentInv.i9100Units || 0, requested: inventoryRequest.i9100Units || 0 },
          { name: 'ورق حراري (صناديق)', current: currentInv.rollPaperBoxes || 0, requested: inventoryRequest.rollPaperBoxes || 0 },
          { name: 'ورق حراري (وحدات)', current: currentInv.rollPaperUnits || 0, requested: inventoryRequest.rollPaperUnits || 0 },
          { name: 'ملصقات (صناديق)', current: currentInv.stickersBoxes || 0, requested: inventoryRequest.stickersBoxes || 0 },
          { name: 'ملصقات (وحدات)', current: currentInv.stickersUnits || 0, requested: inventoryRequest.stickersUnits || 0 },
          { name: 'بطاريات جديدة (صناديق)', current: currentInv.newBatteriesBoxes || 0, requested: inventoryRequest.newBatteriesBoxes || 0 },
          { name: 'بطاريات جديدة (وحدات)', current: currentInv.newBatteriesUnits || 0, requested: inventoryRequest.newBatteriesUnits || 0 },
          { name: 'شريحة موبايلي (صناديق)', current: currentInv.mobilySimBoxes || 0, requested: inventoryRequest.mobilySimBoxes || 0 },
          { name: 'شريحة موبايلي (وحدات)', current: currentInv.mobilySimUnits || 0, requested: inventoryRequest.mobilySimUnits || 0 },
          { name: 'شريحة STC (صناديق)', current: currentInv.stcSimBoxes || 0, requested: inventoryRequest.stcSimBoxes || 0 },
          { name: 'شريحة STC (وحدات)', current: currentInv.stcSimUnits || 0, requested: inventoryRequest.stcSimUnits || 0 },
          { name: 'شريحة زين (صناديق)', current: currentInv.zainSimBoxes || 0, requested: inventoryRequest.zainSimBoxes || 0 },
          { name: 'شريحة زين (وحدات)', current: currentInv.zainSimUnits || 0, requested: inventoryRequest.zainSimUnits || 0 },
        ];

        for (const check of stockChecks) {
          if (check.requested > 0 && check.current < check.requested) {
            throw new Error(`Insufficient stock in warehouse. Available: ${check.current}, Requested: ${check.requested} for ${check.name}`);
          }
        }

        await tx
          .update(inventoryRequests)
          .set({
            status: "approved",
            adminNotes,
            warehouseId,
            respondedBy: user.id,
            respondedAt: new Date(),
          })
          .where(eq(inventoryRequests.id, req.params.id));

        const itemsToTransfer = [
          { type: 'n950', boxes: inventoryRequest.n950Boxes, units: inventoryRequest.n950Units },
          { type: 'i9000s', boxes: inventoryRequest.i9000sBoxes, units: inventoryRequest.i9000sUnits },
          { type: 'i9100', boxes: inventoryRequest.i9100Boxes, units: inventoryRequest.i9100Units },
          { type: 'rollPaper', boxes: inventoryRequest.rollPaperBoxes, units: inventoryRequest.rollPaperUnits },
          { type: 'stickers', boxes: inventoryRequest.stickersBoxes, units: inventoryRequest.stickersUnits },
          { type: 'newBatteries', boxes: inventoryRequest.newBatteriesBoxes, units: inventoryRequest.newBatteriesUnits },
          { type: 'mobilySim', boxes: inventoryRequest.mobilySimBoxes, units: inventoryRequest.mobilySimUnits },
          { type: 'stcSim', boxes: inventoryRequest.stcSimBoxes, units: inventoryRequest.stcSimUnits },
          { type: 'zainSim', boxes: inventoryRequest.zainSimBoxes, units: inventoryRequest.zainSimUnits },
        ];

        for (const item of itemsToTransfer) {
          if ((item.boxes || 0) > 0) {
            await tx.insert(warehouseTransfers).values({
              requestId: req.params.id,
              warehouseId,
              technicianId: inventoryRequest.technicianId,
              itemType: item.type,
              packagingType: 'box',
              quantity: item.boxes || 0,
              performedBy: user.id,
              notes: `تم إنشاؤه من طلب مخزون ${inventoryRequest.notes ? ': ' + inventoryRequest.notes : ''}`,
              status: 'pending',
            });
          }
          if ((item.units || 0) > 0) {
            await tx.insert(warehouseTransfers).values({
              requestId: req.params.id,
              warehouseId,
              technicianId: inventoryRequest.technicianId,
              itemType: item.type,
              packagingType: 'unit',
              quantity: item.units || 0,
              performedBy: user.id,
              notes: `تم إنشاؤه من طلب مخزون ${inventoryRequest.notes ? ': ' + inventoryRequest.notes : ''}`,
              status: 'pending',
            });
          }
        }

        await tx
          .update(warehouseInventory)
          .set({
            n950Boxes: (currentInv.n950Boxes || 0) - (inventoryRequest.n950Boxes || 0),
            n950Units: (currentInv.n950Units || 0) - (inventoryRequest.n950Units || 0),
            i9000sBoxes: (currentInv.i9000sBoxes || 0) - (inventoryRequest.i9000sBoxes || 0),
            i9000sUnits: (currentInv.i9000sUnits || 0) - (inventoryRequest.i9000sUnits || 0),
            i9100Boxes: (currentInv.i9100Boxes || 0) - (inventoryRequest.i9100Boxes || 0),
            i9100Units: (currentInv.i9100Units || 0) - (inventoryRequest.i9100Units || 0),
            rollPaperBoxes: (currentInv.rollPaperBoxes || 0) - (inventoryRequest.rollPaperBoxes || 0),
            rollPaperUnits: (currentInv.rollPaperUnits || 0) - (inventoryRequest.rollPaperUnits || 0),
            stickersBoxes: (currentInv.stickersBoxes || 0) - (inventoryRequest.stickersBoxes || 0),
            stickersUnits: (currentInv.stickersUnits || 0) - (inventoryRequest.stickersUnits || 0),
            newBatteriesBoxes: (currentInv.newBatteriesBoxes || 0) - (inventoryRequest.newBatteriesBoxes || 0),
            newBatteriesUnits: (currentInv.newBatteriesUnits || 0) - (inventoryRequest.newBatteriesUnits || 0),
            mobilySimBoxes: (currentInv.mobilySimBoxes || 0) - (inventoryRequest.mobilySimBoxes || 0),
            mobilySimUnits: (currentInv.mobilySimUnits || 0) - (inventoryRequest.mobilySimUnits || 0),
            stcSimBoxes: (currentInv.stcSimBoxes || 0) - (inventoryRequest.stcSimBoxes || 0),
            stcSimUnits: (currentInv.stcSimUnits || 0) - (inventoryRequest.stcSimUnits || 0),
            zainSimBoxes: (currentInv.zainSimBoxes || 0) - (inventoryRequest.zainSimBoxes || 0),
            zainSimUnits: (currentInv.zainSimUnits || 0) - (inventoryRequest.zainSimUnits || 0),
          })
          .where(eq(warehouseInventory.warehouseId, warehouseId));
      });

      const updatedRequest = await db
        .select()
        .from(inventoryRequests)
        .where(eq(inventoryRequests.id, req.params.id))
        .limit(1);

      res.json(updatedRequest[0]);
    } catch (error) {
      console.error("Error approving request:", error);
      res.status(500).json({ message: "Failed to approve request" });
    }
  });

  app.patch("/api/inventory-requests/:id/reject", requireAuth, requireSupervisor, async (req, res) => {
    try {
      const user = (req as any).user;
      const { adminNotes } = req.body;

      if (!adminNotes) {
        return res.status(400).json({ message: "Admin notes are required for rejection" });
      }

      // Supervisors can only reject requests from technicians in their region
      if (user.role === 'supervisor') {
        const [request] = await db
          .select()
          .from(inventoryRequests)
          .where(eq(inventoryRequests.id, req.params.id))
          .limit(1);

        if (!request) {
          return res.status(404).json({ message: "Request not found" });
        }

        const [technician] = await db
          .select()
          .from(users)
          .where(eq(users.id, request.technicianId))
          .limit(1);

        if (!technician || technician.regionId !== user.regionId) {
          return res.status(403).json({ message: "لا يمكنك معالجة طلبات من خارج منطقتك" });
        }
      }

      const [updatedRequest] = await db
        .update(inventoryRequests)
        .set({
          status: "rejected",
          adminNotes,
          respondedBy: user.id,
          respondedAt: new Date(),
        })
        .where(eq(inventoryRequests.id, req.params.id))
        .returning();

      if (!updatedRequest) {
        return res.status(404).json({ message: "Request not found" });
      }

      res.json(updatedRequest);
    } catch (error) {
      console.error("Error rejecting request:", error);
      res.status(500).json({ message: "Failed to reject request" });
    }
  });

  app.post("/api/supervisors/:supervisorId/technicians/:technicianId", requireAuth, requireAdmin, async (req, res) => {
    try {
      const assignment = await storage.assignTechnicianToSupervisor(
        req.params.supervisorId,
        req.params.technicianId
      );
      res.status(201).json(assignment);
    } catch (error) {
      console.error("Error assigning technician to supervisor:", error);
      res.status(500).json({ message: "Failed to assign technician" });
    }
  });

  app.delete("/api/supervisors/:supervisorId/technicians/:technicianId", requireAuth, requireAdmin, async (req, res) => {
    try {
      const removed = await storage.removeTechnicianFromSupervisor(
        req.params.supervisorId,
        req.params.technicianId
      );
      if (!removed) {
        return res.status(404).json({ message: "Assignment not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error removing technician from supervisor:", error);
      res.status(500).json({ message: "Failed to remove technician" });
    }
  });

  app.get("/api/supervisors/:supervisorId/technicians", requireAuth, async (req, res) => {
    try {
      const technicianIds = await storage.getSupervisorTechnicians(req.params.supervisorId);
      res.json(technicianIds);
    } catch (error) {
      console.error("Error fetching supervisor technicians:", error);
      res.status(500).json({ message: "Failed to fetch technicians" });
    }
  });

  app.post("/api/supervisors/:supervisorId/warehouses/:warehouseId", requireAuth, requireAdmin, async (req, res) => {
    try {
      const assignment = await storage.assignWarehouseToSupervisor(
        req.params.supervisorId,
        req.params.warehouseId
      );
      res.status(201).json(assignment);
    } catch (error) {
      console.error("Error assigning warehouse to supervisor:", error);
      res.status(500).json({ message: "Failed to assign warehouse" });
    }
  });

  app.delete("/api/supervisors/:supervisorId/warehouses/:warehouseId", requireAuth, requireAdmin, async (req, res) => {
    try {
      const removed = await storage.removeWarehouseFromSupervisor(
        req.params.supervisorId,
        req.params.warehouseId
      );
      if (!removed) {
        return res.status(404).json({ message: "Assignment not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error removing warehouse from supervisor:", error);
      res.status(500).json({ message: "Failed to remove warehouse" });
    }
  });

  app.get("/api/supervisors/:supervisorId/warehouses", requireAuth, async (req, res) => {
    try {
      const warehouseIds = await storage.getSupervisorWarehouses(req.params.supervisorId);
      res.json(warehouseIds);
    } catch (error) {
      console.error("Error fetching supervisor warehouses:", error);
      res.status(500).json({ message: "Failed to fetch warehouses" });
    }
  });

  // Backup & Restore Routes (Admin only)
  app.get("/api/admin/backup", requireAuth, requireAdmin, async (req, res) => {
    try {
      const user = (req as any).user;
      const backup = await storage.exportAllData();
      
      // Log the backup operation
      await storage.createSystemLog({
        userId: user.id,
        userName: user.fullName || user.username || 'Unknown',
        userRole: user.role,
        regionId: user.regionId,
        action: 'export',
        entityType: 'backup',
        entityId: 'system',
        entityName: 'نسخة احتياطية كاملة',
        description: 'تصدير نسخة احتياطية كاملة لجميع بيانات النظام',
        severity: 'info',
        success: true,
      });
      
      // Set headers for file download
      const filename = `backup_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.json(backup);
    } catch (error) {
      console.error("Error creating backup:", error);
      res.status(500).json({ message: "Failed to create backup" });
    }
  });

  app.post("/api/admin/restore", requireAuth, requireAdmin, async (req, res) => {
    try {
      const backup = req.body;
      
      if (!backup || !backup.data) {
        return res.status(400).json({ message: "Invalid backup file" });
      }
      
      await storage.importAllData(backup);
      
      res.json({ success: true, message: "Backup restored successfully" });
    } catch (error) {
      console.error("Error restoring backup:", error);
      res.status(500).json({ message: "Failed to restore backup" });
    }
  });

  // =====================================================
  // Dynamic Product Types APIs - إدارة الأصناف الديناميكية
  // =====================================================

  // Get all product types
  app.get("/api/product-types", requireAuth, async (req, res) => {
    try {
      const allProductTypes = await db.select().from(productTypes).orderBy(productTypes.sortOrder);
      res.json(allProductTypes);
    } catch (error) {
      console.error("Error fetching product types:", error);
      res.status(500).json({ message: "Failed to fetch product types" });
    }
  });

  // Get active product types only
  app.get("/api/product-types/active", requireAuth, async (req, res) => {
    try {
      const activeTypes = await db.select().from(productTypes)
        .where(eq(productTypes.isActive, true))
        .orderBy(productTypes.sortOrder);
      res.json(activeTypes);
    } catch (error) {
      console.error("Error fetching active product types:", error);
      res.status(500).json({ message: "Failed to fetch product types" });
    }
  });

  // Get single product type
  app.get("/api/product-types/:id", requireAuth, async (req, res) => {
    try {
      const [productType] = await db.select().from(productTypes)
        .where(eq(productTypes.id, req.params.id));
      if (!productType) {
        return res.status(404).json({ message: "Product type not found" });
      }
      res.json(productType);
    } catch (error) {
      console.error("Error fetching product type:", error);
      res.status(500).json({ message: "Failed to fetch product type" });
    }
  });

  // Create new product type (Admin/Supervisor only)
  app.post("/api/product-types", requireAuth, requireSupervisor, async (req, res) => {
    try {
      const user = (req as any).user;
      const parsed = insertProductTypeSchema.safeParse(req.body);
      
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid data", errors: parsed.error.errors });
      }

      // Check if code already exists
      const [existing] = await db.select().from(productTypes)
        .where(eq(productTypes.code, parsed.data.code));
      if (existing) {
        return res.status(400).json({ message: "كود الصنف موجود مسبقاً" });
      }

      const [newProductType] = await db.insert(productTypes).values({
        ...parsed.data,
        createdBy: user.id,
      }).returning();

      // Log the action
      await storage.createSystemLog({
        userId: user.id,
        userName: user.username,
        userRole: user.role,
        regionId: user.regionId,
        action: 'create',
        entityType: 'product_type',
        entityId: newProductType.id,
        entityName: newProductType.name,
        description: `إنشاء صنف جديد: ${newProductType.name}`,
        severity: 'info',
        success: true,
      });

      res.status(201).json(newProductType);
    } catch (error) {
      console.error("Error creating product type:", error);
      res.status(500).json({ message: "Failed to create product type" });
    }
  });

  // Update product type (Admin/Supervisor only)
  app.patch("/api/product-types/:id", requireAuth, requireSupervisor, async (req, res) => {
    try {
      const user = (req as any).user;
      const [existing] = await db.select().from(productTypes)
        .where(eq(productTypes.id, req.params.id));
      
      if (!existing) {
        return res.status(404).json({ message: "Product type not found" });
      }

      // If code is being changed, check uniqueness
      if (req.body.code && req.body.code !== existing.code) {
        const [codeExists] = await db.select().from(productTypes)
          .where(eq(productTypes.code, req.body.code));
        if (codeExists) {
          return res.status(400).json({ message: "كود الصنف موجود مسبقاً" });
        }
      }

      const [updated] = await db.update(productTypes)
        .set({
          ...req.body,
          updatedAt: new Date(),
        })
        .where(eq(productTypes.id, req.params.id))
        .returning();

      // Log the action
      await storage.createSystemLog({
        userId: user.id,
        userName: user.username,
        userRole: user.role,
        regionId: user.regionId,
        action: 'update',
        entityType: 'product_type',
        entityId: updated.id,
        entityName: updated.name,
        description: `تحديث صنف: ${updated.name}`,
        severity: 'info',
        success: true,
      });

      res.json(updated);
    } catch (error) {
      console.error("Error updating product type:", error);
      res.status(500).json({ message: "Failed to update product type" });
    }
  });

  // Toggle product type active status (Admin/Supervisor only)
  app.patch("/api/product-types/:id/toggle-active", requireAuth, requireSupervisor, async (req, res) => {
    try {
      const user = (req as any).user;
      const [existing] = await db.select().from(productTypes)
        .where(eq(productTypes.id, req.params.id));
      
      if (!existing) {
        return res.status(404).json({ message: "Product type not found" });
      }

      const [updated] = await db.update(productTypes)
        .set({
          isActive: !existing.isActive,
          updatedAt: new Date(),
        })
        .where(eq(productTypes.id, req.params.id))
        .returning();

      // Log the action
      await storage.createSystemLog({
        userId: user.id,
        userName: user.username,
        userRole: user.role,
        regionId: user.regionId,
        action: 'update',
        entityType: 'product_type',
        entityId: updated.id,
        entityName: updated.name,
        description: `${updated.isActive ? 'تفعيل' : 'إلغاء تفعيل'} صنف: ${updated.name}`,
        severity: 'info',
        success: true,
      });

      res.json(updated);
    } catch (error) {
      console.error("Error toggling product type:", error);
      res.status(500).json({ message: "Failed to toggle product type" });
    }
  });

  // Delete product type (Admin only) - only if no inventory exists
  app.delete("/api/product-types/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const user = (req as any).user;
      const [existing] = await db.select().from(productTypes)
        .where(eq(productTypes.id, req.params.id));
      
      if (!existing) {
        return res.status(404).json({ message: "Product type not found" });
      }

      // Check if there's any inventory using this product type
      const [warehouseInv] = await db.select().from(warehouseDynamicInventory)
        .where(eq(warehouseDynamicInventory.productTypeId, req.params.id))
        .limit(1);
      const [techInv] = await db.select().from(technicianDynamicInventory)
        .where(eq(technicianDynamicInventory.productTypeId, req.params.id))
        .limit(1);

      if (warehouseInv || techInv) {
        return res.status(400).json({ 
          message: "لا يمكن حذف هذا الصنف لوجود مخزون مرتبط به. يمكنك إلغاء تفعيله بدلاً من ذلك." 
        });
      }

      await db.delete(productTypes).where(eq(productTypes.id, req.params.id));

      // Log the action
      await storage.createSystemLog({
        userId: user.id,
        userName: user.username,
        userRole: user.role,
        regionId: user.regionId,
        action: 'delete',
        entityType: 'product_type',
        entityId: existing.id,
        entityName: existing.name,
        description: `حذف صنف: ${existing.name}`,
        severity: 'warn',
        success: true,
      });

      res.status(204).send();
    } catch (error) {
      console.error("Error deleting product type:", error);
      res.status(500).json({ message: "Failed to delete product type" });
    }
  });

  // =====================================================
  // Dynamic Warehouse Inventory APIs
  // =====================================================

  // Get dynamic inventory for a warehouse
  app.get("/api/warehouses/:warehouseId/dynamic-inventory", requireAuth, async (req, res) => {
    try {
      const inventory = await db.select({
        id: warehouseDynamicInventory.id,
        warehouseId: warehouseDynamicInventory.warehouseId,
        productTypeId: warehouseDynamicInventory.productTypeId,
        boxes: warehouseDynamicInventory.boxes,
        units: warehouseDynamicInventory.units,
        productType: productTypes,
      })
      .from(warehouseDynamicInventory)
      .innerJoin(productTypes, eq(warehouseDynamicInventory.productTypeId, productTypes.id))
      .where(eq(warehouseDynamicInventory.warehouseId, req.params.warehouseId));
      
      res.json(inventory);
    } catch (error) {
      console.error("Error fetching warehouse dynamic inventory:", error);
      res.status(500).json({ message: "Failed to fetch inventory" });
    }
  });

  // Update dynamic inventory for a warehouse
  app.post("/api/warehouses/:warehouseId/dynamic-inventory", requireAuth, requireSupervisor, async (req, res) => {
    try {
      const user = (req as any).user;
      const { productTypeId, boxes, units, action } = req.body;

      if (!productTypeId) {
        return res.status(400).json({ message: "Product type ID is required" });
      }

      // Get existing inventory record
      const [existing] = await db.select().from(warehouseDynamicInventory)
        .where(and(
          eq(warehouseDynamicInventory.warehouseId, req.params.warehouseId),
          eq(warehouseDynamicInventory.productTypeId, productTypeId)
        ));

      let result;
      if (existing) {
        // Update existing record
        const newBoxes = action === 'add' 
          ? (existing.boxes || 0) + (boxes || 0) 
          : action === 'subtract' 
            ? Math.max(0, (existing.boxes || 0) - (boxes || 0))
            : (boxes || 0);
        const newUnits = action === 'add' 
          ? (existing.units || 0) + (units || 0) 
          : action === 'subtract'
            ? Math.max(0, (existing.units || 0) - (units || 0))
            : (units || 0);

        [result] = await db.update(warehouseDynamicInventory)
          .set({
            boxes: newBoxes,
            units: newUnits,
            updatedAt: new Date(),
          })
          .where(eq(warehouseDynamicInventory.id, existing.id))
          .returning();
      } else {
        // Create new record
        [result] = await db.insert(warehouseDynamicInventory).values({
          warehouseId: req.params.warehouseId,
          productTypeId,
          boxes: boxes || 0,
          units: units || 0,
        }).returning();
      }

      // Get product type name for logging
      const [productType] = await db.select().from(productTypes)
        .where(eq(productTypes.id, productTypeId));

      await storage.createSystemLog({
        userId: user.id,
        userName: user.username,
        userRole: user.role,
        regionId: user.regionId,
        action: action || 'update',
        entityType: 'warehouse_inventory',
        entityId: req.params.warehouseId,
        entityName: productType?.name || 'Unknown',
        description: `تحديث مخزون المستودع: ${productType?.name || ''} - صناديق: ${boxes || 0}، وحدات: ${units || 0}`,
        severity: 'info',
        success: true,
      });

      res.json(result);
    } catch (error) {
      console.error("Error updating warehouse dynamic inventory:", error);
      res.status(500).json({ message: "Failed to update inventory" });
    }
  });

  // =====================================================
  // Dynamic Technician Inventory APIs
  // =====================================================

  // Get dynamic inventory for a technician
  app.get("/api/technicians/:technicianId/dynamic-inventory", requireAuth, async (req, res) => {
    try {
      const inventory = await db.select({
        id: technicianDynamicInventory.id,
        technicianId: technicianDynamicInventory.technicianId,
        productTypeId: technicianDynamicInventory.productTypeId,
        boxes: technicianDynamicInventory.boxes,
        units: technicianDynamicInventory.units,
        productType: productTypes,
      })
      .from(technicianDynamicInventory)
      .innerJoin(productTypes, eq(technicianDynamicInventory.productTypeId, productTypes.id))
      .where(eq(technicianDynamicInventory.technicianId, req.params.technicianId));
      
      res.json(inventory);
    } catch (error) {
      console.error("Error fetching technician dynamic inventory:", error);
      res.status(500).json({ message: "Failed to fetch inventory" });
    }
  });

  // Get my dynamic inventory (for logged-in technician)
  app.get("/api/my-dynamic-inventory", requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const inventory = await db.select({
        id: technicianDynamicInventory.id,
        technicianId: technicianDynamicInventory.technicianId,
        productTypeId: technicianDynamicInventory.productTypeId,
        boxes: technicianDynamicInventory.boxes,
        units: technicianDynamicInventory.units,
        productType: productTypes,
      })
      .from(technicianDynamicInventory)
      .innerJoin(productTypes, eq(technicianDynamicInventory.productTypeId, productTypes.id))
      .where(eq(technicianDynamicInventory.technicianId, user.id));
      
      res.json(inventory);
    } catch (error) {
      console.error("Error fetching my dynamic inventory:", error);
      res.status(500).json({ message: "Failed to fetch inventory" });
    }
  });

  // =====================================================
  // Data Migration API - Migrate from legacy to dynamic
  // =====================================================

  // Migrate warehouse inventory from legacy to dynamic
  app.post("/api/migrate-warehouse-inventory", requireAuth, requireAdmin, async (req, res) => {
    try {
      const user = (req as any).user;
      
      // Get all product types
      const allProductTypes = await db.select().from(productTypes).where(eq(productTypes.isActive, true));
      
      // Map legacy field names to product type codes
      const legacyToCodeMap: Record<string, { boxField: string; unitField: string }> = {
        'n950': { boxField: 'n950Boxes', unitField: 'n950Units' },
        'i9000s': { boxField: 'i9000sBoxes', unitField: 'i9000sUnits' },
        'i9100': { boxField: 'i9100Boxes', unitField: 'i9100Units' },
        'rollPaper': { boxField: 'rollPaperBoxes', unitField: 'rollPaperUnits' },
        'stickers': { boxField: 'stickersBoxes', unitField: 'stickersUnits' },
        'newBatteries': { boxField: 'newBatteriesBoxes', unitField: 'newBatteriesUnits' },
        'mobilySim': { boxField: 'mobilySimBoxes', unitField: 'mobilySimUnits' },
        'stcSim': { boxField: 'stcSimBoxes', unitField: 'stcSimUnits' },
        'zainSim': { boxField: 'zainSimBoxes', unitField: 'zainSimUnits' },
      };

      // Get all warehouses with inventory
      const warehouses = await db.select().from(warehouseInventory);
      
      let migratedCount = 0;
      
      for (const warehouse of warehouses) {
        for (const productType of allProductTypes) {
          const mapping = legacyToCodeMap[productType.code];
          if (!mapping) continue;
          
          const boxes = (warehouse as any)[mapping.boxField] || 0;
          const units = (warehouse as any)[mapping.unitField] || 0;
          
          if (boxes === 0 && units === 0) continue;
          
          // Check if already migrated
          const [existing] = await db.select().from(warehouseDynamicInventory)
            .where(and(
              eq(warehouseDynamicInventory.warehouseId, warehouse.warehouseId),
              eq(warehouseDynamicInventory.productTypeId, productType.id)
            ));
          
          if (existing) {
            // Update existing
            await db.update(warehouseDynamicInventory)
              .set({ boxes, units, updatedAt: new Date() })
              .where(eq(warehouseDynamicInventory.id, existing.id));
          } else {
            // Insert new
            await db.insert(warehouseDynamicInventory).values({
              warehouseId: warehouse.warehouseId,
              productTypeId: productType.id,
              boxes,
              units,
            });
          }
          migratedCount++;
        }
      }

      await storage.createSystemLog({
        userId: user.id,
        userName: user.username,
        userRole: user.role,
        regionId: user.regionId,
        action: 'migrate',
        entityType: 'warehouse_inventory',
        entityId: 'all',
        entityName: 'Warehouse Inventory Migration',
        description: `تم ترحيل ${migratedCount} سجل مخزون للنظام الديناميكي`,
        severity: 'info',
        success: true,
      });

      res.json({ 
        success: true, 
        message: `تم ترحيل ${migratedCount} سجل بنجاح`,
        migratedCount 
      });
    } catch (error) {
      console.error("Error migrating warehouse inventory:", error);
      res.status(500).json({ message: "Failed to migrate inventory" });
    }
  });

  // Migrate technician inventory from legacy to dynamic
  app.post("/api/migrate-technician-inventory", requireAuth, requireAdmin, async (req, res) => {
    try {
      const user = (req as any).user;
      
      // Get all product types
      const allProductTypes = await db.select().from(productTypes).where(eq(productTypes.isActive, true));
      
      // Map legacy field names to product type codes
      const legacyToCodeMap: Record<string, { boxField: string; unitField: string }> = {
        'n950': { boxField: 'n950Boxes', unitField: 'n950Units' },
        'i9000s': { boxField: 'i9000sBoxes', unitField: 'i9000sUnits' },
        'i9100': { boxField: 'i9100Boxes', unitField: 'i9100Units' },
        'rollPaper': { boxField: 'rollPaperBoxes', unitField: 'rollPaperUnits' },
        'stickers': { boxField: 'stickersBoxes', unitField: 'stickersUnits' },
        'newBatteries': { boxField: 'newBatteriesBoxes', unitField: 'newBatteriesUnits' },
        'mobilySim': { boxField: 'mobilySimBoxes', unitField: 'mobilySimUnits' },
        'stcSim': { boxField: 'stcSimBoxes', unitField: 'stcSimUnits' },
        'zainSim': { boxField: 'zainSimBoxes', unitField: 'zainSimUnits' },
      };

      // Get all technicians with inventory
      const technicians = await db.select().from(techniciansInventory);
      
      let migratedCount = 0;
      
      for (const tech of technicians) {
        for (const productType of allProductTypes) {
          const mapping = legacyToCodeMap[productType.code];
          if (!mapping) continue;
          
          const boxes = (tech as any)[mapping.boxField] || 0;
          const units = (tech as any)[mapping.unitField] || 0;
          
          if (boxes === 0 && units === 0) continue;
          
          // Check if already migrated
          const [existing] = await db.select().from(technicianDynamicInventory)
            .where(and(
              eq(technicianDynamicInventory.technicianId, tech.id),
              eq(technicianDynamicInventory.productTypeId, productType.id)
            ));
          
          if (existing) {
            // Update existing
            await db.update(technicianDynamicInventory)
              .set({ boxes, units, updatedAt: new Date() })
              .where(eq(technicianDynamicInventory.id, existing.id));
          } else {
            // Insert new
            await db.insert(technicianDynamicInventory).values({
              technicianId: tech.id,
              productTypeId: productType.id,
              boxes,
              units,
            });
          }
          migratedCount++;
        }
      }

      await storage.createSystemLog({
        userId: user.id,
        userName: user.username,
        userRole: user.role,
        regionId: user.regionId,
        action: 'migrate',
        entityType: 'technician_inventory',
        entityId: 'all',
        entityName: 'Technician Inventory Migration',
        description: `تم ترحيل ${migratedCount} سجل مخزون فني للنظام الديناميكي`,
        severity: 'info',
        success: true,
      });

      res.json({ 
        success: true, 
        message: `تم ترحيل ${migratedCount} سجل بنجاح`,
        migratedCount 
      });
    } catch (error) {
      console.error("Error migrating technician inventory:", error);
      res.status(500).json({ message: "Failed to migrate inventory" });
    }
  });

  // Create dynamic inventory request
  app.post("/api/dynamic-inventory-requests", requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const { items, notes } = req.body;

      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: "يجب تحديد صنف واحد على الأقل" });
      }

      // Create the main request
      const [request] = await db.insert(dynamicInventoryRequests).values({
        technicianId: user.id,
        notes: notes || null,
        status: 'pending',
      }).returning();

      // Create request items
      for (const item of items) {
        if (item.boxes > 0 || item.units > 0) {
          await db.insert(dynamicRequestItems).values({
            requestId: request.id,
            productTypeId: item.productTypeId,
            boxes: item.boxes || 0,
            units: item.units || 0,
          });
        }
      }

      await storage.createSystemLog({
        userId: user.id,
        userName: user.username,
        userRole: user.role,
        regionId: user.regionId,
        action: 'create',
        entityType: 'dynamic_inventory_request',
        entityId: request.id,
        entityName: `طلب مخزون - ${user.fullName || user.username}`,
        description: `تم إنشاء طلب مخزون جديد يحتوي على ${items.length} صنف`,
        severity: 'info',
        success: true,
      });

      res.status(201).json(request);
    } catch (error) {
      console.error("Error creating dynamic inventory request:", error);
      res.status(500).json({ message: "Failed to create inventory request" });
    }
  });

  // Get my dynamic inventory requests
  app.get("/api/dynamic-inventory-requests/my", requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const requests = await db.select()
        .from(dynamicInventoryRequests)
        .where(eq(dynamicInventoryRequests.technicianId, user.id))
        .orderBy(desc(dynamicInventoryRequests.createdAt));
      
      res.json(requests);
    } catch (error) {
      console.error("Error fetching my dynamic requests:", error);
      res.status(500).json({ message: "Failed to fetch requests" });
    }
  });

  // Get all pending dynamic inventory requests (for admin/supervisor)
  app.get("/api/dynamic-inventory-requests/pending", requireAuth, requireAdmin, async (req, res) => {
    try {
      const requests = await db.select({
        request: dynamicInventoryRequests,
      })
        .from(dynamicInventoryRequests)
        .where(eq(dynamicInventoryRequests.status, 'pending'))
        .orderBy(desc(dynamicInventoryRequests.createdAt));

      // Get items for each request
      const result = await Promise.all(requests.map(async ({ request }) => {
        const items = await db.select({
          item: dynamicRequestItems,
          productType: productTypes,
        })
          .from(dynamicRequestItems)
          .innerJoin(productTypes, eq(dynamicRequestItems.productTypeId, productTypes.id))
          .where(eq(dynamicRequestItems.requestId, request.id));
        
        return {
          ...request,
          items: items.map(i => ({
            ...i.item,
            productType: i.productType,
          })),
        };
      }));

      res.json(result);
    } catch (error) {
      console.error("Error fetching pending dynamic requests:", error);
      res.status(500).json({ message: "Failed to fetch requests" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
