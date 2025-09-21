import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertInventoryItemSchema, insertTransactionSchema, insertRegionSchema, insertUserSchema, loginSchema } from "@shared/schema";
import { z } from "zod";

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

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = loginSchema.parse(req.body);
      
      // Find user by username (get full user data with password)
      const user = await storage.getUserByUsername(username);
      
      if (!user || !user.isActive) {
        return res.status(401).json({ 
          success: false, 
          message: "اسم المستخدم أو كلمة المرور غير صحيحة" 
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
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          success: false, 
          message: "بيانات غير صحيحة", 
          errors: error.errors 
        });
      }
      res.status(500).json({ 
        success: false, 
        message: "خطأ في الخادم" 
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

  const httpServer = createServer(app);
  return httpServer;
}
