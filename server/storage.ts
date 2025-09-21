import { type InventoryItem, type InsertInventoryItem, type Transaction, type InsertTransaction, type InventoryItemWithStatus, type DashboardStats, type Region, type InsertRegion, type User, type InsertUser, type UserSafe, type RegionWithStats, type AdminStats, type TransactionWithDetails } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Inventory Items
  getInventoryItems(): Promise<InventoryItemWithStatus[]>;
  getInventoryItem(id: string): Promise<InventoryItem | undefined>;
  createInventoryItem(item: InsertInventoryItem): Promise<InventoryItem>;
  updateInventoryItem(id: string, updates: Partial<InsertInventoryItem>): Promise<InventoryItem>;
  deleteInventoryItem(id: string): Promise<boolean>;
  
  // Regions
  getRegions(): Promise<RegionWithStats[]>;
  getRegion(id: string): Promise<Region | undefined>;
  createRegion(region: InsertRegion): Promise<Region>;
  updateRegion(id: string, updates: Partial<InsertRegion>): Promise<Region>;
  deleteRegion(id: string): Promise<boolean>;
  
  // Users
  getUsers(): Promise<UserSafe[]>;
  getUser(id: string): Promise<UserSafe | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<UserSafe>;
  updateUser(id: string, updates: Partial<InsertUser>): Promise<UserSafe>;
  deleteUser(id: string): Promise<boolean>;
  
  // Transactions
  getTransactions(): Promise<TransactionWithDetails[]>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  getRecentTransactions(limit?: number): Promise<TransactionWithDetails[]>;
  
  // Dashboard
  getDashboardStats(): Promise<DashboardStats>;
  getAdminStats(): Promise<AdminStats>;
  
  // Stock Operations
  addStock(itemId: string, quantity: number, reason?: string, userId?: string): Promise<InventoryItem>;
  withdrawStock(itemId: string, quantity: number, reason?: string, userId?: string): Promise<InventoryItem>;
}

export class MemStorage implements IStorage {
  private inventoryItems: Map<string, InventoryItem>;
  private transactions: Map<string, Transaction>;
  private regions: Map<string, Region>;
  private users: Map<string, User>;

  constructor() {
    this.inventoryItems = new Map();
    this.transactions = new Map();
    this.regions = new Map();
    this.users = new Map();
    
    // Initialize with default region and admin user
    this.initializeDefaults();
  }
  
  private async initializeDefaults() {
    // Create default region
    const defaultRegion: Region = {
      id: randomUUID(),
      name: "المنطقة الرئيسية",
      description: "المنطقة الافتراضية للنظام",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.regions.set(defaultRegion.id, defaultRegion);
    
    // Create default admin user
    const adminUser: User = {
      id: randomUUID(),
      username: "admin",
      email: "admin@company.com",
      password: "admin123", // In real app, this would be hashed
      fullName: "مدير النظام",
      role: "admin",
      regionId: defaultRegion.id,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(adminUser.id, adminUser);
  }

  private getItemStatus(item: InventoryItem): 'available' | 'low' | 'out' {
    if (item.quantity === 0) return 'out';
    if (item.quantity <= item.minThreshold) return 'low';
    return 'available';
  }

  async getInventoryItems(): Promise<InventoryItemWithStatus[]> {
    return Array.from(this.inventoryItems.values()).map(item => {
      const region = item.regionId ? this.regions.get(item.regionId) : null;
      return {
        ...item,
        status: this.getItemStatus(item),
        regionName: region?.name || "غير محدد"
      };
    });
  }

  async getInventoryItem(id: string): Promise<InventoryItem | undefined> {
    return this.inventoryItems.get(id);
  }

  async createInventoryItem(insertItem: InsertInventoryItem): Promise<InventoryItem> {
    const id = randomUUID();
    // If no regionId provided, use the first available region
    let regionId = insertItem.regionId;
    if (!regionId) {
      const firstRegion = Array.from(this.regions.values())[0];
      regionId = firstRegion?.id || null;
    }
    
    const item: InventoryItem = {
      ...insertItem,
      id,
      regionId,
      quantity: insertItem.quantity ?? 0,
      minThreshold: insertItem.minThreshold ?? 5,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.inventoryItems.set(id, item);
    return item;
  }

  async updateInventoryItem(id: string, updates: Partial<InsertInventoryItem>): Promise<InventoryItem> {
    const existingItem = this.inventoryItems.get(id);
    if (!existingItem) {
      throw new Error(`Item with id ${id} not found`);
    }
    
    const updatedItem: InventoryItem = {
      ...existingItem,
      ...updates,
      updatedAt: new Date(),
    };
    this.inventoryItems.set(id, updatedItem);
    return updatedItem;
  }

  async deleteInventoryItem(id: string): Promise<boolean> {
    return this.inventoryItems.delete(id);
  }

  async getTransactions(): Promise<TransactionWithDetails[]> {
    return Array.from(this.transactions.values())
      .map(transaction => {
        const item = this.inventoryItems.get(transaction.itemId);
        const user = transaction.userId ? this.users.get(transaction.userId) : null;
        const region = item?.regionId ? this.regions.get(item.regionId) : null;
        
        return {
          ...transaction,
          itemName: item?.name || "صنف محذوف",
          userName: user?.fullName || "غير محدد",
          regionName: region?.name || "غير محدد"
        };
      })
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const id = randomUUID();
    const transaction: Transaction = {
      ...insertTransaction,
      id,
      reason: insertTransaction.reason ?? null,
      createdAt: new Date(),
    };
    this.transactions.set(id, transaction);
    return transaction;
  }

  async getRecentTransactions(limit: number = 10): Promise<TransactionWithDetails[]> {
    const transactions = await this.getTransactions();
    return transactions.slice(0, limit);
  }

  async getDashboardStats(): Promise<DashboardStats> {
    const items = Array.from(this.inventoryItems.values());
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayTransactions = Array.from(this.transactions.values()).filter(
      t => new Date(t.createdAt!).getTime() >= today.getTime()
    );

    return {
      totalItems: items.length,
      lowStockItems: items.filter(item => item.quantity > 0 && item.quantity <= item.minThreshold).length,
      outOfStockItems: items.filter(item => item.quantity === 0).length,
      todayTransactions: todayTransactions.length,
    };
  }

  async addStock(itemId: string, quantity: number, reason?: string, userId?: string): Promise<InventoryItem> {
    const item = this.inventoryItems.get(itemId);
    if (!item) {
      throw new Error(`Item with id ${itemId} not found`);
    }

    const updatedItem = await this.updateInventoryItem(itemId, {
      quantity: item.quantity + quantity,
    });

    await this.createTransaction({
      itemId,
      userId: userId || null,
      type: "add",
      quantity,
      reason,
    });

    return updatedItem;
  }

  async withdrawStock(itemId: string, quantity: number, reason?: string, userId?: string): Promise<InventoryItem> {
    const item = this.inventoryItems.get(itemId);
    if (!item) {
      throw new Error(`Item with id ${itemId} not found`);
    }

    if (item.quantity < quantity) {
      throw new Error(`Insufficient stock. Available: ${item.quantity}, Requested: ${quantity}`);
    }

    const updatedItem = await this.updateInventoryItem(itemId, {
      quantity: item.quantity - quantity,
    });

    await this.createTransaction({
      itemId,
      userId: userId || null,
      type: "withdraw",
      quantity,
      reason,
    });

    return updatedItem;
  }

  // Regions methods
  async getRegions(): Promise<RegionWithStats[]> {
    return Array.from(this.regions.values()).map(region => {
      const regionItems = Array.from(this.inventoryItems.values())
        .filter(item => item.regionId === region.id);
      
      return {
        ...region,
        itemCount: regionItems.length,
        totalQuantity: regionItems.reduce((sum, item) => sum + item.quantity, 0),
        lowStockCount: regionItems.filter(item => this.getItemStatus(item) === 'low' || this.getItemStatus(item) === 'out').length
      };
    });
  }

  async getRegion(id: string): Promise<Region | undefined> {
    return this.regions.get(id);
  }

  async createRegion(insertRegion: InsertRegion): Promise<Region> {
    const id = randomUUID();
    const region: Region = {
      ...insertRegion,
      id,
      description: insertRegion.description || null,
      isActive: insertRegion.isActive ?? true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.regions.set(id, region);
    return region;
  }

  async updateRegion(id: string, updates: Partial<InsertRegion>): Promise<Region> {
    const existingRegion = this.regions.get(id);
    if (!existingRegion) {
      throw new Error(`Region with id ${id} not found`);
    }
    
    const updatedRegion: Region = {
      ...existingRegion,
      ...updates,
      updatedAt: new Date(),
    };
    this.regions.set(id, updatedRegion);
    return updatedRegion;
  }

  async deleteRegion(id: string): Promise<boolean> {
    // Check if region has items
    const hasItems = Array.from(this.inventoryItems.values())
      .some(item => item.regionId === id);
    
    if (hasItems) {
      throw new Error("Cannot delete region that contains inventory items");
    }
    
    return this.regions.delete(id);
  }

  // Users methods
  async getUsers(): Promise<UserSafe[]> {
    return Array.from(this.users.values()).map(user => {
      const { password, ...userSafe } = user;
      return userSafe;
    });
  }

  async getUser(id: string): Promise<UserSafe | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    const { password, ...userSafe } = user;
    return userSafe;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<UserSafe> {
    // Check for duplicate username
    const existingUserByUsername = Array.from(this.users.values())
      .find(user => user.username === insertUser.username);
    if (existingUserByUsername) {
      throw new Error("Username already exists");
    }
    
    // Check for duplicate email
    const existingUserByEmail = Array.from(this.users.values())
      .find(user => user.email === insertUser.email);
    if (existingUserByEmail) {
      throw new Error("Email already exists");
    }
    
    const id = randomUUID();
    const user: User = {
      ...insertUser,
      id,
      regionId: insertUser.regionId || null,
      role: insertUser.role || "employee",
      isActive: insertUser.isActive ?? true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(id, user);
    
    const { password, ...userSafe } = user;
    return userSafe;
  }

  async updateUser(id: string, updates: Partial<InsertUser>): Promise<UserSafe> {
    const existingUser = this.users.get(id);
    if (!existingUser) {
      throw new Error(`User with id ${id} not found`);
    }
    
    // Check for duplicate username if username is being updated
    if (updates.username && updates.username !== existingUser.username) {
      const existingUserByUsername = Array.from(this.users.values())
        .find(user => user.username === updates.username && user.id !== id);
      if (existingUserByUsername) {
        throw new Error("Username already exists");
      }
    }
    
    // Check for duplicate email if email is being updated
    if (updates.email && updates.email !== existingUser.email) {
      const existingUserByEmail = Array.from(this.users.values())
        .find(user => user.email === updates.email && user.id !== id);
      if (existingUserByEmail) {
        throw new Error("Email already exists");
      }
    }
    
    const updatedUser: User = {
      ...existingUser,
      ...updates,
      updatedAt: new Date(),
    };
    this.users.set(id, updatedUser);
    
    const { password, ...userSafe } = updatedUser;
    return userSafe;
  }

  async deleteUser(id: string): Promise<boolean> {
    return this.users.delete(id);
  }

  async getAdminStats(): Promise<AdminStats> {
    const transactions = await this.getTransactions();
    
    return {
      totalRegions: this.regions.size,
      totalUsers: this.users.size,
      activeUsers: Array.from(this.users.values()).filter(user => user.isActive).length,
      totalTransactions: transactions.length,
      recentTransactions: transactions.slice(0, 10)
    };
  }
}

import { DatabaseStorage } from "./database-storage";

export const storage = new DatabaseStorage();
