import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertInventoryItemSchema, insertTransactionSchema, insertRegionSchema, insertUserSchema, insertTechnicianInventorySchema, insertWithdrawnDeviceSchema, loginSchema, techniciansInventory } from "@shared/schema";
import { z } from "zod";
import { db } from "./db";

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
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create user" });
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
      
      const existingInventory = await storage.getTechnicianFixedInventory(technicianId);
      
      if (existingInventory) {
        const updated = await storage.updateTechnicianFixedInventory(technicianId, req.body);
        res.json(updated);
      } else {
        const created = await storage.createTechnicianFixedInventory({
          technicianId,
          ...req.body,
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

  app.post("/api/stock-transfer", requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const { technicianId, n950, i900, rollPaper, stickers, mobilySim, stcSim } = req.body;
      
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
            city: 'N/A',
            n950Devices: 0,
            i900Devices: 0,
            rollPaper: 0,
            stickers: 0,
            mobilySim: 0,
            stcSim: 0,
            createdBy: user.id,
          })
          .returning();
        
        movingInventory = created;
      }

      // Calculate total available in fixed inventory
      const totalN950 = fixedInventory.n950Boxes + fixedInventory.n950Units;
      const totalI900 = fixedInventory.i900Boxes + fixedInventory.i900Units;
      const totalPaper = fixedInventory.rollPaperBoxes + fixedInventory.rollPaperUnits;
      const totalStickers = fixedInventory.stickersBoxes + fixedInventory.stickersUnits;
      const totalMobily = fixedInventory.mobilySimBoxes + fixedInventory.mobilySimUnits;
      const totalStc = fixedInventory.stcSimBoxes + fixedInventory.stcSimUnits;

      // Validate quantities
      if (n950 > totalN950 || i900 > totalI900 || rollPaper > totalPaper || 
          stickers > totalStickers || mobilySim > totalMobily || stcSim > totalStc) {
        return res.status(400).json({ message: "Insufficient quantity in fixed inventory" });
      }

      // Update fixed inventory (decrease)
      const newN950Units = totalN950 - n950;
      const newI900Units = totalI900 - i900;
      const newPaperUnits = totalPaper - rollPaper;
      const newStickersUnits = totalStickers - stickers;
      const newMobilyUnits = totalMobily - mobilySim;
      const newStcUnits = totalStc - stcSim;

      await storage.updateTechnicianFixedInventory(technicianId, {
        n950Boxes: 0,
        n950Units: newN950Units,
        i900Boxes: 0,
        i900Units: newI900Units,
        rollPaperBoxes: 0,
        rollPaperUnits: newPaperUnits,
        stickersBoxes: 0,
        stickersUnits: newStickersUnits,
        mobilySimBoxes: 0,
        mobilySimUnits: newMobilyUnits,
        stcSimBoxes: 0,
        stcSimUnits: newStcUnits,
      });

      // Update moving inventory (increase)
      await storage.updateTechnicianInventory(technicianId, {
        n950Devices: movingInventory.n950Devices + n950,
        i900Devices: movingInventory.i900Devices + i900,
        rollPaper: movingInventory.rollPaper + rollPaper,
        stickers: movingInventory.stickers + stickers,
        mobilySim: movingInventory.mobilySim + mobilySim,
        stcSim: movingInventory.stcSim + stcSim,
      });

      // Record stock movements
      const movements = [];
      if (n950 > 0) {
        movements.push(storage.createStockMovement({
          technicianId,
          itemType: 'n950',
          packagingType: 'unit',
          quantity: n950,
          fromInventory: 'fixed',
          toInventory: 'moving',
          performedBy: user.id,
          reason: 'transfer',
          notes: 'Transfer from fixed to moving inventory',
        }));
      }
      if (i900 > 0) {
        movements.push(storage.createStockMovement({
          technicianId,
          itemType: 'i900',
          packagingType: 'unit',
          quantity: i900,
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
          packagingType: 'unit',
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
          packagingType: 'unit',
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
          packagingType: 'unit',
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
          packagingType: 'unit',
          quantity: stcSim,
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

  const httpServer = createServer(app);
  return httpServer;
}
