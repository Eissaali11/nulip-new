import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertInventoryItemSchema, insertTransactionSchema, insertRegionSchema, insertUserSchema, insertTechnicianInventorySchema, insertWithdrawnDeviceSchema, loginSchema, techniciansInventory, insertWarehouseSchema, insertWarehouseInventorySchema, insertWarehouseTransferSchema, warehouseTransfers, warehouseInventory, inventoryRequests, insertInventoryRequestSchema, users } from "@shared/schema";
import { z } from "zod";
import { db } from "./db";
import { eq, inArray } from "drizzle-orm";

// Simple session store for demo purposes (in production, use proper session store)
const activeSessions = new Map<string, { userId: string; role: string; username: string; expiry: number }>();

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
  (req as any).user = { id: session.userId, role: session.role, username: session.username };
  next();
}

// Admin-only middleware
function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user;
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
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
      
      // Create default employee user
      await storage.createUser({
        username: "employee1",
        email: "employee1@company.com",
        password: "emp123",
        fullName: "موظف تجريبي",
        city: "جدة",
        role: "employee",
        regionId: defaultRegionId,
        isActive: true,
      });
      
      console.log("✅ Created default users (admin/admin123, employee1/emp123)");
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
      const validatedData = insertRegionSchema.parse(req.body);
      const region = await storage.createRegion(validatedData);
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
      const updates = insertRegionSchema.partial().parse(req.body);
      const region = await storage.updateRegion(req.params.id, updates);
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
      const deleted = await storage.deleteRegion(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Region not found" });
      }
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
      const validatedData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(validatedData);
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

  // Technicians Inventory Routes
  app.get("/api/technicians", requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const techs = await storage.getTechniciansInventory();
      
      // Filter data based on user role
      if (user.role === 'employee') {
        // Employees only see data they created
        const filteredTechs = techs.filter(tech => tech.createdBy === user.id);
        res.json(filteredTechs);
      } else {
        // Admins see everything
        res.json(techs);
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
      const updates = insertTechnicianInventorySchema.partial().parse(req.body);
      const tech = await storage.updateTechnicianInventory(req.params.id, updates);
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

  // Withdrawn Devices Routes
  app.get("/api/withdrawn-devices", requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const devices = await storage.getWithdrawnDevices();
      
      // Filter data based on user role
      if (user.role === 'employee') {
        // Employees only see devices they created
        const filteredDevices = devices.filter(device => device.createdBy === user.id);
        res.json(filteredDevices);
      } else {
        // Admins see everything
        res.json(devices);
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
      
      // Remove timestamp fields from request body as they're auto-managed by DB
      const { createdAt, updatedAt, id, ...inventoryData } = req.body;
      
      const existingInventory = await storage.getTechnicianFixedInventory(technicianId);
      
      if (existingInventory) {
        const updated = await storage.updateTechnicianFixedInventory(technicianId, inventoryData);
        res.json(updated);
      } else {
        const created = await storage.createTechnicianFixedInventory({
          technicianId,
          ...inventoryData,
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

  app.post("/api/warehouses", requireAuth, requireAdmin, async (req, res) => {
    try {
      const user = (req as any).user;
      const validatedData = insertWarehouseSchema.parse(req.body);
      const warehouse = await storage.createWarehouse({
        ...validatedData,
        createdBy: user.id,
      });
      res.status(201).json(warehouse);
    } catch (error) {
      console.error("Error creating warehouse:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create warehouse" });
    }
  });

  app.get("/api/warehouses/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const warehouse = await storage.getWarehouse(req.params.id);
      if (!warehouse) {
        return res.status(404).json({ message: "Warehouse not found" });
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

  app.get("/api/warehouse-inventory/:warehouseId", requireAuth, requireAdmin, async (req, res) => {
    try {
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

  app.put("/api/warehouse-inventory/:warehouseId", requireAuth, requireAdmin, async (req, res) => {
    try {
      const validatedData = insertWarehouseInventorySchema.parse(req.body);
      const inventory = await storage.updateWarehouseInventory(req.params.warehouseId, validatedData);
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

  app.post("/api/warehouse-transfers", requireAuth, requireAdmin, async (req, res) => {
    try {
      const user = (req as any).user;
      const { warehouseId, technicianId, notes, ...items } = req.body;

      if (!warehouseId || !technicianId) {
        return res.status(400).json({ message: "warehouseId and technicianId are required" });
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
      let technicianId = req.query.technicianId as string | undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      
      if (user.role !== 'admin') {
        technicianId = user.id;
      }
      
      const transfers = await storage.getWarehouseTransfers(warehouseId, technicianId, limit);
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
      res.json(updatedTransfer);
    } catch (error) {
      console.error("Error rejecting transfer:", error);
      if (error instanceof Error) {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: "Failed to reject transfer" });
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

  app.patch("/api/inventory-requests/:id/approve", requireAuth, requireAdmin, async (req, res) => {
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

      await db.transaction(async (tx) => {
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
          if (item.boxes > 0) {
            await tx.insert(warehouseTransfers).values({
              warehouseId,
              technicianId: inventoryRequest.technicianId,
              itemType: item.type,
              packagingType: 'box',
              quantity: item.boxes,
              performedBy: user.id,
              notes: `تم إنشاؤه من طلب مخزون ${inventoryRequest.notes ? ': ' + inventoryRequest.notes : ''}`,
              status: 'pending',
            });
          }
          if (item.units > 0) {
            await tx.insert(warehouseTransfers).values({
              warehouseId,
              technicianId: inventoryRequest.technicianId,
              itemType: item.type,
              packagingType: 'unit',
              quantity: item.units,
              performedBy: user.id,
              notes: `تم إنشاؤه من طلب مخزون ${inventoryRequest.notes ? ': ' + inventoryRequest.notes : ''}`,
              status: 'pending',
            });
          }
        }

        const warehouseInv = await tx
          .select()
          .from(warehouseInventory)
          .where(eq(warehouseInventory.warehouseId, warehouseId))
          .limit(1);

        if (!warehouseInv || warehouseInv.length === 0) {
          throw new Error("Warehouse inventory not found");
        }

        const currentInv = warehouseInv[0];

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

  app.patch("/api/inventory-requests/:id/reject", requireAuth, requireAdmin, async (req, res) => {
    try {
      const user = (req as any).user;
      const { adminNotes } = req.body;

      if (!adminNotes) {
        return res.status(400).json({ message: "Admin notes are required for rejection" });
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

  const httpServer = createServer(app);
  return httpServer;
}
