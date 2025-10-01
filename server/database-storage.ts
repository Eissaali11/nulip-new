import { 
  type InventoryItem, 
  type InsertInventoryItem, 
  type Transaction, 
  type InsertTransaction, 
  type InventoryItemWithStatus, 
  type DashboardStats, 
  type Region, 
  type InsertRegion, 
  type User, 
  type InsertUser, 
  type UserSafe, 
  type RegionWithStats, 
  type AdminStats, 
  type TransactionWithDetails,
  type TechnicianInventory,
  type InsertTechnicianInventory,
  type WithdrawnDevice,
  type InsertWithdrawnDevice,
  regions,
  users,
  inventoryItems,
  techniciansInventory,
  transactions,
  withdrawnDevices
} from "@shared/schema";
import { IStorage } from "./storage";
import { db } from "./db";
import { eq, desc, gte, lte, count, sql, and, or, ilike } from "drizzle-orm";
import { randomUUID } from "crypto";

export class DatabaseStorage implements IStorage {
  
  private getItemStatus(item: InventoryItem): 'available' | 'low' | 'out' {
    if (item.quantity === 0) return 'out';
    if (item.quantity <= item.minThreshold) return 'low';
    return 'available';
  }

  // Inventory Items
  async getInventoryItems(): Promise<InventoryItemWithStatus[]> {
    const items = await db
      .select({
        id: inventoryItems.id,
        name: inventoryItems.name,
        type: inventoryItems.type,
        unit: inventoryItems.unit,
        quantity: inventoryItems.quantity,
        minThreshold: inventoryItems.minThreshold,
        technicianName: inventoryItems.technicianName,
        city: inventoryItems.city,
        regionId: inventoryItems.regionId,
        createdAt: inventoryItems.createdAt,
        updatedAt: inventoryItems.updatedAt,
        regionName: regions.name,
      })
      .from(inventoryItems)
      .leftJoin(regions, eq(inventoryItems.regionId, regions.id));

    return items.map(item => ({
      ...item,
      regionName: item.regionName || "غير محدد",
      status: this.getItemStatus(item)
    }));
  }

  async getInventoryItem(id: string): Promise<InventoryItem | undefined> {
    const [item] = await db
      .select()
      .from(inventoryItems)
      .where(eq(inventoryItems.id, id));
    return item || undefined;
  }

  async createInventoryItem(insertItem: InsertInventoryItem): Promise<InventoryItem> {
    // If no regionId provided, use the first available region
    let regionId = insertItem.regionId;
    if (!regionId) {
      const [firstRegion] = await db.select().from(regions).limit(1);
      regionId = firstRegion?.id || null;
    }

    const [item] = await db
      .insert(inventoryItems)
      .values({
        ...insertItem,
        regionId,
        quantity: insertItem.quantity ?? 0,
        minThreshold: insertItem.minThreshold ?? 5,
      })
      .returning();
    return item;
  }

  async updateInventoryItem(id: string, updates: Partial<InsertInventoryItem>): Promise<InventoryItem> {
    const [item] = await db
      .update(inventoryItems)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(inventoryItems.id, id))
      .returning();
    
    if (!item) {
      throw new Error(`Item with id ${id} not found`);
    }
    return item;
  }

  async deleteInventoryItem(id: string): Promise<boolean> {
    const result = await db
      .delete(inventoryItems)
      .where(eq(inventoryItems.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Regions
  async getRegions(): Promise<RegionWithStats[]> {
    const regionsWithStats = await db
      .select({
        id: regions.id,
        name: regions.name,
        description: regions.description,
        isActive: regions.isActive,
        createdAt: regions.createdAt,
        updatedAt: regions.updatedAt,
        itemCount: sql<number>`count(${inventoryItems.id})`,
        totalQuantity: sql<number>`coalesce(sum(${inventoryItems.quantity}), 0)`,
      })
      .from(regions)
      .leftJoin(inventoryItems, eq(regions.id, inventoryItems.regionId))
      .groupBy(regions.id);

    // Calculate low stock count for each region
    const result: RegionWithStats[] = [];
    for (const region of regionsWithStats) {
      const lowStockItems = await db
        .select({ count: count() })
        .from(inventoryItems)
        .where(
          and(
            eq(inventoryItems.regionId, region.id),
            sql`${inventoryItems.quantity} <= ${inventoryItems.minThreshold}`
          )
        );

      result.push({
        ...region,
        itemCount: Number(region.itemCount),
        totalQuantity: Number(region.totalQuantity),
        lowStockCount: lowStockItems[0]?.count || 0,
      });
    }

    return result;
  }

  async getRegion(id: string): Promise<Region | undefined> {
    const [region] = await db
      .select()
      .from(regions)
      .where(eq(regions.id, id));
    return region || undefined;
  }

  async createRegion(insertRegion: InsertRegion): Promise<Region> {
    const [region] = await db
      .insert(regions)
      .values({
        ...insertRegion,
        isActive: insertRegion.isActive ?? true,
      })
      .returning();
    return region;
  }

  async updateRegion(id: string, updates: Partial<InsertRegion>): Promise<Region> {
    const [region] = await db
      .update(regions)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(regions.id, id))
      .returning();
    
    if (!region) {
      throw new Error(`Region with id ${id} not found`);
    }
    return region;
  }

  async deleteRegion(id: string): Promise<boolean> {
    // Check if region has items
    const [itemCount] = await db
      .select({ count: count() })
      .from(inventoryItems)
      .where(eq(inventoryItems.regionId, id));
    
    if (itemCount.count > 0) {
      throw new Error("Cannot delete region that contains inventory items");
    }

    // Check if region has users
    const [userCount] = await db
      .select({ count: count() })
      .from(users)
      .where(eq(users.regionId, id));
    
    if (userCount.count > 0) {
      throw new Error("Cannot delete region that has assigned users");
    }

    const result = await db
      .delete(regions)
      .where(eq(regions.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Users
  async getUsers(): Promise<UserSafe[]> {
    const allUsers = await db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        fullName: users.fullName,
        role: users.role,
        regionId: users.regionId,
        isActive: users.isActive,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users);
    return allUsers;
  }

  async getUser(id: string): Promise<UserSafe | undefined> {
    const [user] = await db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        fullName: users.fullName,
        role: users.role,
        regionId: users.regionId,
        isActive: users.isActive,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<UserSafe> {
    // Check for duplicate username
    const existingUserByUsername = await this.getUserByUsername(insertUser.username);
    if (existingUserByUsername) {
      throw new Error("Username already exists");
    }
    
    // Check for duplicate email
    const [existingUserByEmail] = await db
      .select()
      .from(users)
      .where(eq(users.email, insertUser.email));
    if (existingUserByEmail) {
      throw new Error("Email already exists");
    }

    const [user] = await db
      .insert(users)
      .values({
        ...insertUser,
        role: insertUser.role || "employee",
        isActive: insertUser.isActive ?? true,
      })
      .returning({
        id: users.id,
        username: users.username,
        email: users.email,
        fullName: users.fullName,
        role: users.role,
        regionId: users.regionId,
        isActive: users.isActive,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      });
    return user;
  }

  async updateUser(id: string, updates: Partial<InsertUser>): Promise<UserSafe> {
    const existingUser = await this.getUser(id);
    if (!existingUser) {
      throw new Error(`User with id ${id} not found`);
    }
    
    // Check for duplicate username if username is being updated
    if (updates.username && updates.username !== existingUser.username) {
      const existingUserByUsername = await this.getUserByUsername(updates.username);
      if (existingUserByUsername) {
        throw new Error("Username already exists");
      }
    }
    
    // Check for duplicate email if email is being updated
    if (updates.email && updates.email !== existingUser.email) {
      const [existingUserByEmail] = await db
        .select()
        .from(users)
        .where(eq(users.email, updates.email));
      if (existingUserByEmail) {
        throw new Error("Email already exists");
      }
    }

    const [user] = await db
      .update(users)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning({
        id: users.id,
        username: users.username,
        email: users.email,
        fullName: users.fullName,
        role: users.role,
        regionId: users.regionId,
        isActive: users.isActive,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      });
    
    if (!user) {
      throw new Error(`User with id ${id} not found`);
    }
    return user;
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await db
      .delete(users)
      .where(eq(users.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Transactions
  async getTransactions(filters?: {
    page?: number;
    limit?: number;
    type?: string;
    userId?: string;
    regionId?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
  }): Promise<{
    transactions: TransactionWithDetails[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    const offset = (page - 1) * limit;

    let query = db
      .select({
        id: transactions.id,
        itemId: transactions.itemId,
        userId: transactions.userId,
        type: transactions.type,
        quantity: transactions.quantity,
        reason: transactions.reason,
        createdAt: transactions.createdAt,
        itemName: inventoryItems.name,
        userName: users.fullName,
        regionName: regions.name,
      })
      .from(transactions)
      .leftJoin(inventoryItems, eq(transactions.itemId, inventoryItems.id))
      .leftJoin(users, eq(transactions.userId, users.id))
      .leftJoin(regions, eq(inventoryItems.regionId, regions.id));

    let countQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(transactions)
      .leftJoin(inventoryItems, eq(transactions.itemId, inventoryItems.id))
      .leftJoin(users, eq(transactions.userId, users.id))
      .leftJoin(regions, eq(inventoryItems.regionId, regions.id));

    // Build where conditions
    const conditions = [];

    if (filters?.type) {
      conditions.push(eq(transactions.type, filters.type));
    }

    if (filters?.userId) {
      conditions.push(eq(transactions.userId, filters.userId));
    }

    if (filters?.regionId) {
      conditions.push(eq(inventoryItems.regionId, filters.regionId));
    }

    if (filters?.startDate) {
      conditions.push(gte(transactions.createdAt, new Date(filters.startDate)));
    }

    if (filters?.endDate) {
      conditions.push(lte(transactions.createdAt, new Date(filters.endDate)));
    }

    if (filters?.search) {
      const searchTerm = `%${filters.search}%`;
      conditions.push(
        or(
          ilike(inventoryItems.name, searchTerm),
          ilike(users.fullName, searchTerm),
          ilike(transactions.reason, searchTerm)
        )
      );
    }

    // Apply conditions if any
    if (conditions.length > 0) {
      const whereCondition = conditions.length === 1 ? conditions[0] : and(...conditions);
      query = query.where(whereCondition);
      countQuery = countQuery.where(whereCondition);
    }

    // Get total count
    const [{ count }] = await countQuery;
    const total = Number(count);

    // Get paginated results
    const allTransactions = await query
      .orderBy(desc(transactions.createdAt))
      .limit(limit)
      .offset(offset);

    const processedTransactions = allTransactions.map(transaction => ({
      ...transaction,
      itemName: transaction.itemName || "صنف محذوف",
      userName: transaction.userName || "غير محدد",
      regionName: transaction.regionName || "غير محدد",
    }));

    return {
      transactions: processedTransactions,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const [transaction] = await db
      .insert(transactions)
      .values(insertTransaction)
      .returning();
    return transaction;
  }

  async getRecentTransactions(limit: number = 10): Promise<TransactionWithDetails[]> {
    const recentTransactions = await db
      .select({
        id: transactions.id,
        itemId: transactions.itemId,
        userId: transactions.userId,
        type: transactions.type,
        quantity: transactions.quantity,
        reason: transactions.reason,
        createdAt: transactions.createdAt,
        itemName: inventoryItems.name,
        userName: users.fullName,
        regionName: regions.name,
      })
      .from(transactions)
      .leftJoin(inventoryItems, eq(transactions.itemId, inventoryItems.id))
      .leftJoin(users, eq(transactions.userId, users.id))
      .leftJoin(regions, eq(inventoryItems.regionId, regions.id))
      .orderBy(desc(transactions.createdAt))
      .limit(limit);

    return recentTransactions.map(transaction => ({
      ...transaction,
      itemName: transaction.itemName || "صنف محذوف",
      userName: transaction.userName || "غير محدد",
      regionName: transaction.regionName || "غير محدد",
    }));
  }

  async getTransactionStatistics(filters?: {
    startDate?: string;
    endDate?: string;
    regionId?: string;
  }): Promise<{
    totalTransactions: number;
    totalAdditions: number;
    totalWithdrawals: number;
    totalAddedQuantity: number;
    totalWithdrawnQuantity: number;
    byRegion: Array<{ regionName: string; count: number }>;
    byUser: Array<{ userName: string; count: number }>;
    dailyTransactions: Array<{ date: string; count: number }>;
  }> {
    // Build base query
    let baseQuery = db
      .select({
        transactionId: transactions.id,
        type: transactions.type,
        quantity: transactions.quantity,
        createdAt: transactions.createdAt,
        regionName: regions.name,
        userName: users.fullName,
      })
      .from(transactions)
      .leftJoin(inventoryItems, eq(transactions.itemId, inventoryItems.id))
      .leftJoin(users, eq(transactions.userId, users.id))
      .leftJoin(regions, eq(inventoryItems.regionId, regions.id));

    // Apply filters
    const conditions = [];
    if (filters?.startDate) {
      conditions.push(gte(transactions.createdAt, new Date(filters.startDate)));
    }
    if (filters?.endDate) {
      conditions.push(lte(transactions.createdAt, new Date(filters.endDate)));
    }
    if (filters?.regionId) {
      conditions.push(eq(inventoryItems.regionId, filters.regionId));
    }

    if (conditions.length > 0) {
      baseQuery = baseQuery.where(conditions.length === 1 ? conditions[0] : and(...conditions));
    }

    const allTransactions = await baseQuery;

    // Calculate statistics
    const totalTransactions = allTransactions.length;
    const totalAdditions = allTransactions.filter(t => t.type === 'add').length;
    const totalWithdrawals = allTransactions.filter(t => t.type === 'withdraw').length;
    const totalAddedQuantity = allTransactions
      .filter(t => t.type === 'add')
      .reduce((sum, t) => sum + t.quantity, 0);
    const totalWithdrawnQuantity = allTransactions
      .filter(t => t.type === 'withdraw')
      .reduce((sum, t) => sum + t.quantity, 0);

    // Group by region
    const regionGroups = allTransactions.reduce((acc, t) => {
      const regionName = t.regionName || "غير محدد";
      acc[regionName] = (acc[regionName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const byRegion = Object.entries(regionGroups)
      .map(([regionName, count]) => ({ regionName, count }))
      .sort((a, b) => b.count - a.count);

    // Group by user
    const userGroups = allTransactions.reduce((acc, t) => {
      const userName = t.userName || "غير محدد";
      acc[userName] = (acc[userName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const byUser = Object.entries(userGroups)
      .map(([userName, count]) => ({ userName, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10 users

    // Group by day (last 7 days)
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const recentTransactions = allTransactions.filter(t => t.createdAt && t.createdAt >= sevenDaysAgo);
    
    const dailyGroups = recentTransactions.reduce((acc, t) => {
      const date = t.createdAt!.toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Fill in missing days with 0
    const dailyTransactions = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      dailyTransactions.push({ date, count: dailyGroups[date] || 0 });
    }

    return {
      totalTransactions,
      totalAdditions,
      totalWithdrawals,
      totalAddedQuantity,
      totalWithdrawnQuantity,
      byRegion,
      byUser,
      dailyTransactions,
    };
  }

  // Dashboard
  async getDashboardStats(): Promise<DashboardStats> {
    const [itemStats] = await db
      .select({
        totalItems: count(inventoryItems.id),
        totalQuantity: sql<number>`coalesce(sum(${inventoryItems.quantity}), 0)`,
      })
      .from(inventoryItems);

    const [lowStockCount] = await db
      .select({ count: count() })
      .from(inventoryItems)
      .where(sql`${inventoryItems.quantity} <= ${inventoryItems.minThreshold} AND ${inventoryItems.quantity} > 0`);

    const [outOfStockCount] = await db
      .select({ count: count() })
      .from(inventoryItems)
      .where(eq(inventoryItems.quantity, 0));

    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    const [todayTransactionCount] = await db
      .select({ count: count() })
      .from(transactions)
      .where(gte(transactions.createdAt, startOfDay));

    return {
      totalItems: itemStats.totalItems,
      lowStockItems: lowStockCount.count,
      outOfStockItems: outOfStockCount.count,
      todayTransactions: todayTransactionCount.count,
    };
  }

  async getAdminStats(): Promise<AdminStats> {
    const [regionCount] = await db.select({ count: count() }).from(regions);
    const [userCount] = await db.select({ count: count() }).from(users);
    const [activeUserCount] = await db
      .select({ count: count() })
      .from(users)
      .where(eq(users.isActive, true));
    const [transactionCount] = await db.select({ count: count() }).from(transactions);
    
    const recentTransactions = await this.getRecentTransactions(10);

    return {
      totalRegions: regionCount.count,
      totalUsers: userCount.count,
      activeUsers: activeUserCount.count,
      totalTransactions: transactionCount.count,
      recentTransactions,
    };
  }

  // Stock Operations
  async addStock(itemId: string, quantity: number, reason?: string, userId?: string): Promise<InventoryItem> {
    const item = await this.getInventoryItem(itemId);
    if (!item) {
      throw new Error(`Item with id ${itemId} not found`);
    }

    const updatedItem = await this.updateInventoryItem(itemId, {
      quantity: item.quantity + quantity,
    });

    await this.createTransaction({
      itemId,
      userId,
      type: "add",
      quantity,
      reason,
    });

    return updatedItem;
  }

  async withdrawStock(itemId: string, quantity: number, reason?: string, userId?: string): Promise<InventoryItem> {
    const item = await this.getInventoryItem(itemId);
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
      userId,
      type: "withdraw",
      quantity,
      reason,
    });

    return updatedItem;
  }

  // Technicians Inventory Operations
  async getTechniciansInventory(): Promise<TechnicianInventory[]> {
    const techs = await db
      .select()
      .from(techniciansInventory)
      .orderBy(desc(techniciansInventory.createdAt));
    return techs;
  }

  async getTechnicianInventory(id: string): Promise<TechnicianInventory | undefined> {
    const [tech] = await db
      .select()
      .from(techniciansInventory)
      .where(eq(techniciansInventory.id, id));
    return tech || undefined;
  }

  async createTechnicianInventory(data: InsertTechnicianInventory): Promise<TechnicianInventory> {
    const [tech] = await db
      .insert(techniciansInventory)
      .values(data)
      .returning();
    return tech;
  }

  async updateTechnicianInventory(id: string, updates: Partial<InsertTechnicianInventory>): Promise<TechnicianInventory> {
    const [tech] = await db
      .update(techniciansInventory)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(techniciansInventory.id, id))
      .returning();
    
    if (!tech) {
      throw new Error(`Technician inventory with id ${id} not found`);
    }
    return tech;
  }

  async deleteTechnicianInventory(id: string): Promise<boolean> {
    const result = await db
      .delete(techniciansInventory)
      .where(eq(techniciansInventory.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Withdrawn Devices Operations
  async getWithdrawnDevices(): Promise<WithdrawnDevice[]> {
    const devices = await db
      .select()
      .from(withdrawnDevices)
      .orderBy(desc(withdrawnDevices.createdAt));
    return devices;
  }

  async getWithdrawnDevice(id: string): Promise<WithdrawnDevice | undefined> {
    const [device] = await db
      .select()
      .from(withdrawnDevices)
      .where(eq(withdrawnDevices.id, id));
    return device || undefined;
  }

  async createWithdrawnDevice(data: InsertWithdrawnDevice): Promise<WithdrawnDevice> {
    const [device] = await db
      .insert(withdrawnDevices)
      .values(data)
      .returning();
    return device;
  }

  async updateWithdrawnDevice(id: string, updates: Partial<InsertWithdrawnDevice>): Promise<WithdrawnDevice> {
    const [device] = await db
      .update(withdrawnDevices)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(withdrawnDevices.id, id))
      .returning();
    
    if (!device) {
      throw new Error(`Withdrawn device with id ${id} not found`);
    }
    return device;
  }

  async deleteWithdrawnDevice(id: string): Promise<boolean> {
    const result = await db
      .delete(withdrawnDevices)
      .where(eq(withdrawnDevices.id, id));
    return (result.rowCount || 0) > 0;
  }
}