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
  type ReceivedDevice,
  type InsertReceivedDevice,
  type TechnicianFixedInventory,
  type InsertTechnicianFixedInventory,
  type StockMovement,
  type InsertStockMovement,
  type TechnicianWithFixedInventory,
  type FixedInventorySummary,
  type StockMovementWithDetails,
  type Warehouse,
  type WarehouseInventory,
  type WarehouseTransfer,
  type InsertWarehouse,
  type InsertWarehouseInventory,
  type InsertWarehouseTransfer,
  type WarehouseWithStats,
  type WarehouseWithInventory,
  type WarehouseTransferWithDetails,
  type SupervisorTechnician,
  type InsertSupervisorTechnician,
  type SupervisorWarehouse,
  type InsertSupervisorWarehouse,
  type SystemLog,
  type InsertSystemLog,
  regions,
  users,
  inventoryItems,
  techniciansInventory,
  transactions,
  withdrawnDevices,
  receivedDevices,
  technicianFixedInventories,
  stockMovements,
  warehouses,
  warehouseInventory,
  warehouseTransfers,
  supervisorTechnicians,
  supervisorWarehouses,
  inventoryRequests,
  systemLogs
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
        profileImage: users.profileImage,
        city: users.city,
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
        profileImage: users.profileImage,
        city: users.city,
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
        role: insertUser.role || "technician",
        isActive: insertUser.isActive ?? true,
      })
      .returning({
        id: users.id,
        username: users.username,
        email: users.email,
        fullName: users.fullName,
        profileImage: users.profileImage,
        city: users.city,
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
        profileImage: users.profileImage,
        city: users.city,
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
    // Delete all related records first to avoid foreign key constraint violations
    
    // Delete system logs
    await db
      .delete(systemLogs)
      .where(eq(systemLogs.userId, id));
    
    // Delete received devices (as technician, supervisor, or approver)
    await db
      .delete(receivedDevices)
      .where(or(
        eq(receivedDevices.technicianId, id),
        eq(receivedDevices.supervisorId, id),
        eq(receivedDevices.approvedBy, id)
      ));
    
    // Delete warehouse transfers first (they reference inventory_requests)
    await db
      .delete(warehouseTransfers)
      .where(or(
        eq(warehouseTransfers.technicianId, id),
        eq(warehouseTransfers.performedBy, id)
      ));
    
    // Delete inventory requests (created by technician or responded by admin)
    await db
      .delete(inventoryRequests)
      .where(or(
        eq(inventoryRequests.technicianId, id),
        eq(inventoryRequests.respondedBy, id)
      ));
    
    // Delete warehouses created by this user (with CASCADE this will delete warehouseInventory too)
    await db
      .delete(warehouses)
      .where(eq(warehouses.createdBy, id));
    
    // Delete technician's fixed inventories
    await db
      .delete(technicianFixedInventories)
      .where(eq(technicianFixedInventories.technicianId, id));
    
    // Delete stock movements where user is the technician
    await db
      .delete(stockMovements)
      .where(eq(stockMovements.technicianId, id));
    
    // Delete stock movements where user performed the action
    await db
      .delete(stockMovements)
      .where(eq(stockMovements.performedBy, id));
    
    // Delete transactions
    await db
      .delete(transactions)
      .where(eq(transactions.userId, id));
    
    // Delete withdrawn devices
    await db
      .delete(withdrawnDevices)
      .where(eq(withdrawnDevices.createdBy, id));
    
    // Delete technicians inventory
    await db
      .delete(techniciansInventory)
      .where(eq(techniciansInventory.createdBy, id));
    
    // Finally, delete the user
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

    const query = db
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
      .$dynamic();

    const countQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(transactions)
      .leftJoin(inventoryItems, eq(transactions.itemId, inventoryItems.id))
      .leftJoin(users, eq(transactions.userId, users.id))
      .leftJoin(regions, eq(inventoryItems.regionId, regions.id))
      .$dynamic();

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
    let finalQuery = query;
    let finalCountQuery = countQuery;
    
    if (conditions.length > 0) {
      const whereCondition = conditions.length === 1 ? conditions[0] : and(...conditions);
      finalQuery = query.where(whereCondition);
      finalCountQuery = countQuery.where(whereCondition);
    }

    // Get total count
    const [{ count }] = await finalCountQuery;
    const total = Number(count);

    // Get paginated results
    const allTransactions = await finalQuery
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
    const itemNameMap: Record<string, string> = {
      'n950': 'N950',
      'i9000s': 'I9000s',
      'i9100': 'I9100',
      'rollPaper': 'ورق حراري',
      'stickers': 'ملصقات',
      'newBatteries': 'بطاريات جديدة',
      'mobilySim': 'شريحة موبايلي',
      'stcSim': 'شريحة STC',
      'zainSim': 'شريحة زين',
    };

    // Get warehouse transfers (نقل من مستودع)
    const warehouseTransferOps = await db
      .select({
        id: warehouseTransfers.id,
        itemType: warehouseTransfers.itemType,
        quantity: warehouseTransfers.quantity,
        status: warehouseTransfers.status,
        performedBy: warehouseTransfers.performedBy,
        technicianId: warehouseTransfers.technicianId,
        notes: warehouseTransfers.notes,
        createdAt: warehouseTransfers.createdAt,
        performerName: sql<string>`performer.full_name`,
        technicianName: users.fullName,
        performerRegion: sql<string>`performer_region.name`,
      })
      .from(warehouseTransfers)
      .leftJoin(sql`${users} as performer`, sql`${warehouseTransfers.performedBy} = performer.id`)
      .leftJoin(users, eq(warehouseTransfers.technicianId, users.id))
      .leftJoin(sql`${regions} as performer_region`, sql`performer.region_id = performer_region.id`)
      .orderBy(desc(warehouseTransfers.createdAt))
      .limit(limit);

    // Get stock movements (نقل بين Fixed و Moving)
    const stockMovementOps = await db
      .select({
        id: stockMovements.id,
        itemType: stockMovements.itemType,
        quantity: stockMovements.quantity,
        fromInventory: stockMovements.fromInventory,
        toInventory: stockMovements.toInventory,
        performedBy: stockMovements.performedBy,
        technicianId: stockMovements.technicianId,
        reason: stockMovements.reason,
        createdAt: stockMovements.createdAt,
        performerName: sql<string>`performer.full_name`,
        technicianName: users.fullName,
        performerRegion: sql<string>`performer_region.name`,
      })
      .from(stockMovements)
      .leftJoin(sql`${users} as performer`, sql`${stockMovements.performedBy} = performer.id`)
      .leftJoin(users, eq(stockMovements.technicianId, users.id))
      .leftJoin(sql`${regions} as performer_region`, sql`performer.region_id = performer_region.id`)
      .orderBy(desc(stockMovements.createdAt))
      .limit(limit);

    // Get inventory requests (طلبات فنيين)
    const inventoryRequestOps = await db
      .select({
        id: inventoryRequests.id,
        technicianId: inventoryRequests.technicianId,
        status: inventoryRequests.status,
        respondedBy: inventoryRequests.respondedBy,
        notes: inventoryRequests.notes,
        createdAt: inventoryRequests.createdAt,
        
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
        
        technicianName: sql<string>`technician.full_name`,
        responderName: sql<string>`responder.full_name`,
        technicianRegion: sql<string>`technician_region.name`,
      })
      .from(inventoryRequests)
      .leftJoin(sql`${users} as technician`, sql`${inventoryRequests.technicianId} = technician.id`)
      .leftJoin(sql`${users} as responder`, sql`${inventoryRequests.respondedBy} = responder.id`)
      .leftJoin(sql`${regions} as technician_region`, sql`technician.region_id = technician_region.id`)
      .orderBy(desc(inventoryRequests.createdAt))
      .limit(limit);

    // Get old transactions from legacy table
    const oldTransactions = await db
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

    // Normalize all operations to unified format
    const allOps: TransactionWithDetails[] = [];

    // Add warehouse transfers
    warehouseTransferOps.forEach(op => {
      allOps.push({
        id: op.id,
        itemId: op.id,
        userId: op.performedBy,
        type: 'add' as const,
        quantity: op.quantity,
        reason: `نقل من مستودع إلى ${op.technicianName || 'فني'} - ${op.status === 'accepted' ? 'مقبول' : op.status === 'rejected' ? 'مرفوض' : 'قيد الانتظار'}`,
        createdAt: op.createdAt,
        itemName: itemNameMap[op.itemType] || op.itemType,
        userName: op.performerName || 'غير محدد',
        regionName: op.performerRegion || 'غير محدد',
      });
    });

    // Add stock movements
    stockMovementOps.forEach(op => {
      allOps.push({
        id: op.id,
        itemId: op.id,
        userId: op.performedBy,
        type: 'add' as const,
        quantity: op.quantity,
        reason: `نقل من ${op.fromInventory === 'fixed' ? 'ثابت' : 'متحرك'} إلى ${op.toInventory === 'fixed' ? 'ثابت' : 'متحرك'} - ${op.technicianName || 'فني'}`,
        createdAt: op.createdAt,
        itemName: itemNameMap[op.itemType] || op.itemType,
        userName: op.performerName || 'غير محدد',
        regionName: op.performerRegion || 'غير محدد',
      });
    });

    // Add inventory requests - process each item in the request
    inventoryRequestOps.forEach(request => {
      const itemFields = [
        { type: 'n950', boxes: request.n950Boxes || 0, units: request.n950Units || 0 },
        { type: 'i9000s', boxes: request.i9000sBoxes || 0, units: request.i9000sUnits || 0 },
        { type: 'i9100', boxes: request.i9100Boxes || 0, units: request.i9100Units || 0 },
        { type: 'rollPaper', boxes: request.rollPaperBoxes || 0, units: request.rollPaperUnits || 0 },
        { type: 'stickers', boxes: request.stickersBoxes || 0, units: request.stickersUnits || 0 },
        { type: 'newBatteries', boxes: request.newBatteriesBoxes || 0, units: request.newBatteriesUnits || 0 },
        { type: 'mobilySim', boxes: request.mobilySimBoxes || 0, units: request.mobilySimUnits || 0 },
        { type: 'stcSim', boxes: request.stcSimBoxes || 0, units: request.stcSimUnits || 0 },
        { type: 'zainSim', boxes: request.zainSimBoxes || 0, units: request.zainSimUnits || 0 },
      ];

      // Add operation for each item that has a quantity
      itemFields.forEach(item => {
        const totalQty = item.boxes + item.units;
        if (totalQty > 0) {
          const packagingDesc = item.boxes > 0 && item.units > 0 
            ? `${item.boxes} كرتون، ${item.units} مفرد`
            : item.boxes > 0 
            ? `${item.boxes} كرتون` 
            : `${item.units} مفرد`;
          
          allOps.push({
            id: `${request.id}-${item.type}`,
            itemId: request.id,
            userId: request.technicianId,
            type: 'add' as const,
            quantity: totalQty,
            reason: `طلب مخزون (${packagingDesc}) - ${request.status === 'approved' ? 'موافق عليه' : request.status === 'rejected' ? 'مرفوض' : 'قيد الانتظار'}`,
            createdAt: request.createdAt,
            itemName: itemNameMap[item.type] || item.type,
            userName: request.technicianName || 'غير محدد',
            regionName: request.technicianRegion || 'غير محدد',
          });
        }
      });
    });

    // Add old transactions
    oldTransactions.forEach(tx => {
      allOps.push({
        ...tx,
        itemName: tx.itemName || "صنف محذوف",
        userName: tx.userName || "غير محدد",
        regionName: tx.regionName || "غير محدد",
      });
    });

    // Sort all operations by date and return top N
    return allOps
      .sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, limit);
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
    const baseQuery = db
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
      .leftJoin(regions, eq(inventoryItems.regionId, regions.id))
      .$dynamic();

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

    let finalQuery = baseQuery;
    if (conditions.length > 0) {
      finalQuery = baseQuery.where(conditions.length === 1 ? conditions[0] : and(...conditions));
    }

    const allTransactions = await finalQuery;

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
      .where(eq(techniciansInventory.createdBy, id));
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
      .where(eq(techniciansInventory.createdBy, id))
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

  // Received Devices Operations
  async getReceivedDevices(filters?: { status?: string; technicianId?: string; supervisorId?: string; regionId?: string }): Promise<ReceivedDevice[]> {
    let query = db.select().from(receivedDevices).orderBy(desc(receivedDevices.createdAt));

    const conditions = [];
    if (filters?.status) {
      conditions.push(eq(receivedDevices.status, filters.status));
    }
    if (filters?.technicianId) {
      conditions.push(eq(receivedDevices.technicianId, filters.technicianId));
    }
    if (filters?.supervisorId) {
      conditions.push(eq(receivedDevices.supervisorId, filters.supervisorId));
    }
    if (filters?.regionId) {
      conditions.push(eq(receivedDevices.regionId, filters.regionId));
    }

    if (conditions.length > 0) {
      const devices = await db
        .select()
        .from(receivedDevices)
        .where(and(...conditions))
        .orderBy(desc(receivedDevices.createdAt));
      return devices;
    }

    const devices = await query;
    return devices;
  }

  async getReceivedDevice(id: string): Promise<ReceivedDevice | undefined> {
    const [device] = await db
      .select()
      .from(receivedDevices)
      .where(eq(receivedDevices.id, id));
    return device || undefined;
  }

  async createReceivedDevice(data: InsertReceivedDevice): Promise<ReceivedDevice> {
    const [device] = await db
      .insert(receivedDevices)
      .values(data)
      .returning();
    return device;
  }

  async updateReceivedDeviceStatus(id: string, status: string, approvedBy: string, adminNotes?: string): Promise<ReceivedDevice> {
    const [device] = await db
      .update(receivedDevices)
      .set({
        status,
        approvedBy,
        adminNotes,
        approvedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(receivedDevices.id, id))
      .returning();

    if (!device) {
      throw new Error(`Received device with id ${id} not found`);
    }
    return device;
  }

  async deleteReceivedDevice(id: string): Promise<boolean> {
    const result = await db
      .delete(receivedDevices)
      .where(eq(receivedDevices.id, id));
    return (result.rowCount || 0) > 0;
  }

  async getPendingReceivedDevicesCount(supervisorId?: string, regionId?: string | null): Promise<number> {
    const conditions = [eq(receivedDevices.status, 'pending')];
    
    if (supervisorId && regionId) {
      // Supervisor sees devices assigned to them OR in their region
      const orCondition = or(
        eq(receivedDevices.supervisorId, supervisorId),
        eq(receivedDevices.regionId, regionId)
      );
      if (orCondition) {
        conditions.push(orCondition);
      }
    } else if (supervisorId) {
      conditions.push(eq(receivedDevices.supervisorId, supervisorId));
    } else if (regionId) {
      conditions.push(eq(receivedDevices.regionId, regionId));
    }

    const result = await db
      .select({ count: count() })
      .from(receivedDevices)
      .where(and(...conditions));

    return result[0]?.count || 0;
  }

  // Technician Fixed Inventories Operations
  async getTechnicianFixedInventory(technicianId: string): Promise<TechnicianFixedInventory | undefined> {
    const [inventory] = await db
      .select()
      .from(technicianFixedInventories)
      .where(eq(technicianFixedInventories.technicianId, technicianId));
    return inventory || undefined;
  }

  async createTechnicianFixedInventory(data: InsertTechnicianFixedInventory): Promise<TechnicianFixedInventory> {
    const [inventory] = await db
      .insert(technicianFixedInventories)
      .values(data)
      .returning();
    return inventory;
  }

  async updateTechnicianFixedInventory(technicianId: string, updates: Partial<InsertTechnicianFixedInventory>): Promise<TechnicianFixedInventory> {
    const [inventory] = await db
      .update(technicianFixedInventories)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(technicianFixedInventories.technicianId, technicianId))
      .returning();
    
    if (!inventory) {
      throw new Error(`Fixed inventory for technician ${technicianId} not found`);
    }
    return inventory;
  }

  async deleteTechnicianFixedInventory(technicianId: string): Promise<void> {
    await db
      .delete(technicianFixedInventories)
      .where(eq(technicianFixedInventories.technicianId, technicianId));
  }

  async getAllTechniciansWithFixedInventory(): Promise<TechnicianWithFixedInventory[]> {
    const technicians = await db
      .select({
        id: users.id,
        fullName: users.fullName,
        city: users.city,
        fixedInventory: technicianFixedInventories,
      })
      .from(users)
      .leftJoin(technicianFixedInventories, eq(users.id, technicianFixedInventories.technicianId))
      .where(eq(users.role, 'technician'));

    return technicians.map(tech => {
      let alertLevel: 'good' | 'warning' | 'critical' = 'good';
      
      if (tech.fixedInventory) {
        const totalItems = 
          tech.fixedInventory.n950Boxes + tech.fixedInventory.n950Units +
          tech.fixedInventory.i9000sBoxes + tech.fixedInventory.i9000sUnits +
          tech.fixedInventory.i9100Boxes + tech.fixedInventory.i9100Units +
          tech.fixedInventory.newBatteriesBoxes + tech.fixedInventory.newBatteriesUnits +
          tech.fixedInventory.rollPaperBoxes + tech.fixedInventory.rollPaperUnits +
          tech.fixedInventory.stickersBoxes + tech.fixedInventory.stickersUnits +
          tech.fixedInventory.mobilySimBoxes + tech.fixedInventory.mobilySimUnits +
          tech.fixedInventory.stcSimBoxes + tech.fixedInventory.stcSimUnits +
          tech.fixedInventory.zainSimBoxes + tech.fixedInventory.zainSimUnits;
        
        const threshold = tech.fixedInventory.criticalStockThreshold || 70;
        const lowThreshold = tech.fixedInventory.lowStockThreshold || 30;
        
        if (totalItems === 0) {
          alertLevel = 'critical';
        } else if (totalItems < lowThreshold) {
          alertLevel = 'critical';
        } else if (totalItems < threshold) {
          alertLevel = 'warning';
        }
      }

      return {
        technicianId: tech.id,
        technicianName: tech.fullName,
        city: tech.city || '',
        fixedInventory: tech.fixedInventory || null,
        alertLevel,
      };
    });
  }

  async getFixedInventorySummary(): Promise<FixedInventorySummary> {
    const inventories = await db
      .select()
      .from(technicianFixedInventories);

    const summary = inventories.reduce((acc, inv) => {
      acc.totalN950 += (inv.n950Boxes || 0) + (inv.n950Units || 0);
      acc.totalI9000s += (inv.i9000sBoxes || 0) + (inv.i9000sUnits || 0);
      acc.totalI9100 += (inv.i9100Boxes || 0) + (inv.i9100Units || 0);
      acc.totalRollPaper += (inv.rollPaperBoxes || 0) + (inv.rollPaperUnits || 0);
      acc.totalStickers += (inv.stickersBoxes || 0) + (inv.stickersUnits || 0);
      acc.totalNewBatteries += (inv.newBatteriesBoxes || 0) + (inv.newBatteriesUnits || 0);
      acc.totalMobilySim += (inv.mobilySimBoxes || 0) + (inv.mobilySimUnits || 0);
      acc.totalStcSim += (inv.stcSimBoxes || 0) + (inv.stcSimUnits || 0);
      acc.totalZainSim += (inv.zainSimBoxes || 0) + (inv.zainSimUnits || 0);

      const totalItems = 
        (inv.n950Boxes || 0) + (inv.n950Units || 0) +
        (inv.i9000sBoxes || 0) + (inv.i9000sUnits || 0) +
        (inv.i9100Boxes || 0) + (inv.i9100Units || 0) +
        (inv.newBatteriesBoxes || 0) + (inv.newBatteriesUnits || 0) +
        (inv.rollPaperBoxes || 0) + (inv.rollPaperUnits || 0) +
        (inv.stickersBoxes || 0) + (inv.stickersUnits || 0) +
        (inv.mobilySimBoxes || 0) + (inv.mobilySimUnits || 0) +
        (inv.stcSimBoxes || 0) + (inv.stcSimUnits || 0) +
        (inv.zainSimBoxes || 0) + (inv.zainSimUnits || 0);

      const threshold = inv.criticalStockThreshold || 70;
      const lowThreshold = inv.lowStockThreshold || 30;

      if (totalItems === 0 || totalItems < lowThreshold) {
        acc.techniciansWithCriticalStock++;
      } else if (totalItems < threshold) {
        acc.techniciansWithWarningStock++;
      } else {
        acc.techniciansWithGoodStock++;
      }

      return acc;
    }, {
      totalN950: 0,
      totalI9000s: 0,
      totalI9100: 0,
      totalRollPaper: 0,
      totalStickers: 0,
      totalNewBatteries: 0,
      totalMobilySim: 0,
      totalStcSim: 0,
      totalZainSim: 0,
      techniciansWithCriticalStock: 0,
      techniciansWithWarningStock: 0,
      techniciansWithGoodStock: 0,
    });

    return summary;
  }

  async getAllTechniciansWithBothInventories() {
    const technicians = await db
      .select({
        id: users.id,
        fullName: users.fullName,
        city: users.city,
        regionId: users.regionId,
        fixedInventory: technicianFixedInventories,
      })
      .from(users)
      .leftJoin(technicianFixedInventories, eq(users.id, technicianFixedInventories.technicianId))
      .where(eq(users.role, 'technician'));

    const result = await Promise.all(
      technicians.map(async (tech) => {
        const movingInventory = await db
          .select()
          .from(techniciansInventory)
          .where(eq(techniciansInventory.createdBy, tech.id))
          .limit(1);

        let alertLevel: 'good' | 'warning' | 'critical' = 'good';
        
        if (tech.fixedInventory) {
          const totalItems = 
            tech.fixedInventory.n950Boxes + tech.fixedInventory.n950Units +
            tech.fixedInventory.i9000sBoxes + tech.fixedInventory.i9000sUnits +
            tech.fixedInventory.i9100Boxes + tech.fixedInventory.i9100Units +
            tech.fixedInventory.newBatteriesBoxes + tech.fixedInventory.newBatteriesUnits +
            tech.fixedInventory.rollPaperBoxes + tech.fixedInventory.rollPaperUnits +
            tech.fixedInventory.stickersBoxes + tech.fixedInventory.stickersUnits +
            tech.fixedInventory.mobilySimBoxes + tech.fixedInventory.mobilySimUnits +
            tech.fixedInventory.stcSimBoxes + tech.fixedInventory.stcSimUnits +
            tech.fixedInventory.zainSimBoxes + tech.fixedInventory.zainSimUnits;
          
          const threshold = tech.fixedInventory.criticalStockThreshold || 70;
          const lowThreshold = tech.fixedInventory.lowStockThreshold || 30;
          
          if (totalItems === 0) {
            alertLevel = 'critical';
          } else if (totalItems < lowThreshold) {
            alertLevel = 'critical';
          } else if (totalItems < threshold) {
            alertLevel = 'warning';
          }
        }

        return {
          technicianId: tech.id,
          technicianName: tech.fullName,
          city: tech.city || '',
          regionId: tech.regionId,
          fixedInventory: tech.fixedInventory || null,
          movingInventory: movingInventory[0] || null,
          alertLevel,
        };
      })
    );

    return result;
  }

  async getRegionTechniciansWithInventories(regionId: string) {
    const technicians = await db
      .select({
        id: users.id,
        fullName: users.fullName,
        city: users.city,
        regionId: users.regionId,
        fixedInventory: technicianFixedInventories,
      })
      .from(users)
      .leftJoin(technicianFixedInventories, eq(users.id, technicianFixedInventories.technicianId))
      .where(and(eq(users.role, 'technician'), eq(users.regionId, regionId)));

    const result = await Promise.all(
      technicians.map(async (tech) => {
        const movingInventory = await db
          .select()
          .from(techniciansInventory)
          .where(eq(techniciansInventory.createdBy, tech.id))
          .limit(1);

        let alertLevel: 'good' | 'warning' | 'critical' = 'good';
        
        if (tech.fixedInventory) {
          const totalItems = 
            tech.fixedInventory.n950Boxes + tech.fixedInventory.n950Units +
            tech.fixedInventory.i9000sBoxes + tech.fixedInventory.i9000sUnits +
            tech.fixedInventory.i9100Boxes + tech.fixedInventory.i9100Units +
            tech.fixedInventory.newBatteriesBoxes + tech.fixedInventory.newBatteriesUnits +
            tech.fixedInventory.rollPaperBoxes + tech.fixedInventory.rollPaperUnits +
            tech.fixedInventory.stickersBoxes + tech.fixedInventory.stickersUnits +
            tech.fixedInventory.mobilySimBoxes + tech.fixedInventory.mobilySimUnits +
            tech.fixedInventory.stcSimBoxes + tech.fixedInventory.stcSimUnits +
            tech.fixedInventory.zainSimBoxes + tech.fixedInventory.zainSimUnits;
          
          const threshold = tech.fixedInventory.criticalStockThreshold || 70;
          const lowThreshold = tech.fixedInventory.lowStockThreshold || 30;
          
          if (totalItems === 0) {
            alertLevel = 'critical';
          } else if (totalItems < lowThreshold) {
            alertLevel = 'critical';
          } else if (totalItems < threshold) {
            alertLevel = 'warning';
          }
        }

        return {
          technicianId: tech.id,
          technicianName: tech.fullName,
          city: tech.city || '',
          regionId: tech.regionId,
          fixedInventory: tech.fixedInventory || null,
          movingInventory: movingInventory[0] || null,
          alertLevel,
        };
      })
    );

    return result;
  }

  // Stock Movements Operations
  async createStockMovement(data: InsertStockMovement): Promise<StockMovement> {
    const [movement] = await db
      .insert(stockMovements)
      .values(data)
      .returning();
    return movement;
  }

  async getStockMovements(technicianId?: string, limit: number = 50): Promise<StockMovementWithDetails[]> {
    const baseQuery = db
      .select({
        id: stockMovements.id,
        technicianId: stockMovements.technicianId,
        itemType: stockMovements.itemType,
        packagingType: stockMovements.packagingType,
        quantity: stockMovements.quantity,
        fromInventory: stockMovements.fromInventory,
        toInventory: stockMovements.toInventory,
        reason: stockMovements.reason,
        performedBy: stockMovements.performedBy,
        notes: stockMovements.notes,
        createdAt: stockMovements.createdAt,
        technicianName: users.fullName,
      })
      .from(stockMovements)
      .leftJoin(users, eq(stockMovements.technicianId, users.id));
    
    const movements = technicianId 
      ? await baseQuery
          .where(eq(stockMovements.technicianId, technicianId))
          .orderBy(desc(stockMovements.createdAt))
          .limit(limit)
      : await baseQuery
          .orderBy(desc(stockMovements.createdAt))
          .limit(limit);

    const itemNames: Record<string, string> = {
      'n950': 'أجهزة N950',
      'i900': 'أجهزة I900',
      'rollPaper': 'أوراق رول',
      'stickers': 'ملصقات مداى',
      'mobilySim': 'شرائح موبايلي',
      'stcSim': 'شرائح STC',
      'zainSim': 'شرائح زين',
    };

    // Get performer names separately
    const movementsWithPerformer = await Promise.all(
      movements.map(async (m) => {
        const performer = await db
          .select({ fullName: users.fullName })
          .from(users)
          .where(eq(users.id, m.performedBy))
          .limit(1);
        
        return {
          ...m,
          technicianName: m.technicianName ?? undefined,
          performedByName: performer[0]?.fullName || undefined,
          itemNameAr: itemNames[m.itemType] || m.itemType,
        };
      })
    );

    return movementsWithPerformer;
  }

  async transferStock(params: {
    technicianId: string;
    itemType: string;
    packagingType: string;
    quantity: number;
    fromInventory: string;
    toInventory: string;
    performedBy: string;
    reason?: string;
    notes?: string;
  }): Promise<{ movement: StockMovement; updatedInventory: TechnicianFixedInventory }> {
    const { technicianId, itemType, packagingType, quantity, fromInventory, toInventory, performedBy, reason, notes } = params;

    // Get or create fixed inventory
    let fixedInventory = await this.getTechnicianFixedInventory(technicianId);
    if (!fixedInventory) {
      fixedInventory = await this.createTechnicianFixedInventory({
        technicianId,
        n950Boxes: 0,
        n950Units: 0,
        i9000sBoxes: 0,
        i9000sUnits: 0,
        i9100Boxes: 0,
        i9100Units: 0,
        newBatteriesBoxes: 0,
        newBatteriesUnits: 0,
        rollPaperBoxes: 0,
        rollPaperUnits: 0,
        stickersBoxes: 0,
        stickersUnits: 0,
        mobilySimBoxes: 0,
        mobilySimUnits: 0,
        stcSimBoxes: 0,
        stcSimUnits: 0,
        zainSimBoxes: 0,
        zainSimUnits: 0,
      });
    }

    // Determine field name
    const fieldMap: Record<string, string> = {
      'n950_box': 'n950Boxes',
      'n950_unit': 'n950Units',
      'i900_box': 'i900Boxes',
      'i900_unit': 'i900Units',
      'rollPaper_box': 'rollPaperBoxes',
      'rollPaper_unit': 'rollPaperUnits',
      'stickers_box': 'stickersBoxes',
      'stickers_unit': 'stickersUnits',
      'mobilySim_box': 'mobilySimBoxes',
      'mobilySim_unit': 'mobilySimUnits',
      'stcSim_box': 'stcSimBoxes',
      'stcSim_unit': 'stcSimUnits',
      'lebaraSim_box': 'lebaraBoxes',
      'lebaraSim_unit': 'lebaraUnits',
    };

    const fieldName = fieldMap[`${itemType}_${packagingType}`];
    if (!fieldName) {
      throw new Error(`Invalid item type or packaging type`);
    }

    const currentValue = (fixedInventory as any)[fieldName] || 0;

    // Calculate new value based on direction
    let newValue: number;
    if (fromInventory === 'fixed' && toInventory === 'moving') {
      // Withdrawing from fixed to moving
      if (currentValue < quantity) {
        throw new Error(`Insufficient stock in fixed inventory`);
      }
      newValue = currentValue - quantity;
    } else if (fromInventory === 'moving' && toInventory === 'fixed') {
      // Returning from moving to fixed
      newValue = currentValue + quantity;
    } else {
      throw new Error(`Invalid inventory transfer direction`);
    }

    // Update fixed inventory
    const updates = { [fieldName]: newValue };
    const updatedInventory = await this.updateTechnicianFixedInventory(technicianId, updates);

    // Create movement record
    const movement = await this.createStockMovement({
      technicianId,
      itemType,
      packagingType,
      quantity,
      fromInventory,
      toInventory,
      performedBy,
      reason,
      notes,
    });

    return { movement, updatedInventory };
  }

  // Warehouses
  async getWarehouses(): Promise<WarehouseWithStats[]> {
    const warehousesList = await db
      .select({
        id: warehouses.id,
        name: warehouses.name,
        location: warehouses.location,
        description: warehouses.description,
        isActive: warehouses.isActive,
        createdBy: warehouses.createdBy,
        regionId: warehouses.regionId,
        createdAt: warehouses.createdAt,
        updatedAt: warehouses.updatedAt,
        creatorName: users.fullName,
      })
      .from(warehouses)
      .leftJoin(users, eq(warehouses.createdBy, users.id));

    const result: WarehouseWithStats[] = [];
    for (const warehouse of warehousesList) {
      const [inventory] = await db
        .select()
        .from(warehouseInventory)
        .where(eq(warehouseInventory.warehouseId, warehouse.id));

      const totalItems = inventory
        ? (inventory.n950Boxes || 0) + (inventory.n950Units || 0) +
          (inventory.i9000sBoxes || 0) + (inventory.i9000sUnits || 0) +
          (inventory.i9100Boxes || 0) + (inventory.i9100Units || 0) +
          (inventory.rollPaperBoxes || 0) + (inventory.rollPaperUnits || 0) +
          (inventory.stickersBoxes || 0) + (inventory.stickersUnits || 0) +
          (inventory.newBatteriesBoxes || 0) + (inventory.newBatteriesUnits || 0) +
          (inventory.mobilySimBoxes || 0) + (inventory.mobilySimUnits || 0) +
          (inventory.stcSimBoxes || 0) + (inventory.stcSimUnits || 0) +
          (inventory.zainSimBoxes || 0) + (inventory.zainSimUnits || 0)
        : 0;

      let lowStockItemsCount = 0;
      if (inventory) {
        if ((inventory.n950Boxes || 0) + (inventory.n950Units || 0) < 10) lowStockItemsCount++;
        if ((inventory.i9000sBoxes || 0) + (inventory.i9000sUnits || 0) < 10) lowStockItemsCount++;
        if ((inventory.i9100Boxes || 0) + (inventory.i9100Units || 0) < 10) lowStockItemsCount++;
        if ((inventory.rollPaperBoxes || 0) + (inventory.rollPaperUnits || 0) < 10) lowStockItemsCount++;
        if ((inventory.stickersBoxes || 0) + (inventory.stickersUnits || 0) < 10) lowStockItemsCount++;
        if ((inventory.newBatteriesBoxes || 0) + (inventory.newBatteriesUnits || 0) < 10) lowStockItemsCount++;
        if ((inventory.mobilySimBoxes || 0) + (inventory.mobilySimUnits || 0) < 10) lowStockItemsCount++;
        if ((inventory.stcSimBoxes || 0) + (inventory.stcSimUnits || 0) < 10) lowStockItemsCount++;
        if ((inventory.zainSimBoxes || 0) + (inventory.zainSimUnits || 0) < 10) lowStockItemsCount++;
      }

      result.push({
        ...warehouse,
        inventory: inventory || null,
        totalItems,
        lowStockItemsCount,
        creatorName: warehouse.creatorName || undefined,
      });
    }

    return result;
  }

  async getWarehousesByRegion(regionId: string): Promise<WarehouseWithStats[]> {
    const warehousesList = await db
      .select({
        id: warehouses.id,
        name: warehouses.name,
        location: warehouses.location,
        description: warehouses.description,
        isActive: warehouses.isActive,
        createdBy: warehouses.createdBy,
        regionId: warehouses.regionId,
        createdAt: warehouses.createdAt,
        updatedAt: warehouses.updatedAt,
        creatorName: users.fullName,
      })
      .from(warehouses)
      .leftJoin(users, eq(warehouses.createdBy, users.id))
      .where(eq(warehouses.regionId, regionId));

    const result: WarehouseWithStats[] = [];
    for (const warehouse of warehousesList) {
      const [inventory] = await db
        .select()
        .from(warehouseInventory)
        .where(eq(warehouseInventory.warehouseId, warehouse.id));

      const totalItems = inventory
        ? (inventory.n950Boxes || 0) + (inventory.n950Units || 0) +
          (inventory.i9000sBoxes || 0) + (inventory.i9000sUnits || 0) +
          (inventory.i9100Boxes || 0) + (inventory.i9100Units || 0) +
          (inventory.rollPaperBoxes || 0) + (inventory.rollPaperUnits || 0) +
          (inventory.stickersBoxes || 0) + (inventory.stickersUnits || 0) +
          (inventory.newBatteriesBoxes || 0) + (inventory.newBatteriesUnits || 0) +
          (inventory.mobilySimBoxes || 0) + (inventory.mobilySimUnits || 0) +
          (inventory.stcSimBoxes || 0) + (inventory.stcSimUnits || 0) +
          (inventory.zainSimBoxes || 0) + (inventory.zainSimUnits || 0)
        : 0;

      let lowStockItemsCount = 0;
      if (inventory) {
        if ((inventory.n950Boxes || 0) + (inventory.n950Units || 0) < 10) lowStockItemsCount++;
        if ((inventory.i9000sBoxes || 0) + (inventory.i9000sUnits || 0) < 10) lowStockItemsCount++;
        if ((inventory.i9100Boxes || 0) + (inventory.i9100Units || 0) < 10) lowStockItemsCount++;
        if ((inventory.rollPaperBoxes || 0) + (inventory.rollPaperUnits || 0) < 10) lowStockItemsCount++;
        if ((inventory.stickersBoxes || 0) + (inventory.stickersUnits || 0) < 10) lowStockItemsCount++;
        if ((inventory.newBatteriesBoxes || 0) + (inventory.newBatteriesUnits || 0) < 10) lowStockItemsCount++;
        if ((inventory.mobilySimBoxes || 0) + (inventory.mobilySimUnits || 0) < 10) lowStockItemsCount++;
        if ((inventory.stcSimBoxes || 0) + (inventory.stcSimUnits || 0) < 10) lowStockItemsCount++;
        if ((inventory.zainSimBoxes || 0) + (inventory.zainSimUnits || 0) < 10) lowStockItemsCount++;
      }

      result.push({
        ...warehouse,
        inventory: inventory || null,
        totalItems,
        lowStockItemsCount,
        creatorName: warehouse.creatorName || undefined,
      });
    }

    return result;
  }

  async getWarehouse(id: string): Promise<WarehouseWithInventory | undefined> {
    const [warehouse] = await db
      .select({
        id: warehouses.id,
        name: warehouses.name,
        location: warehouses.location,
        description: warehouses.description,
        isActive: warehouses.isActive,
        createdBy: warehouses.createdBy,
        regionId: warehouses.regionId,
        createdAt: warehouses.createdAt,
        updatedAt: warehouses.updatedAt,
        creatorName: users.fullName,
      })
      .from(warehouses)
      .leftJoin(users, eq(warehouses.createdBy, users.id))
      .where(eq(warehouses.id, id));

    if (!warehouse) {
      return undefined;
    }

    const [inventory] = await db
      .select()
      .from(warehouseInventory)
      .where(eq(warehouseInventory.warehouseId, id));

    return {
      ...warehouse,
      inventory: inventory || null,
      creatorName: warehouse.creatorName || undefined,
    };
  }

  async createWarehouse(insertWarehouse: InsertWarehouse, createdBy: string): Promise<Warehouse> {
    const [warehouse] = await db
      .insert(warehouses)
      .values({
        ...insertWarehouse,
        createdBy,
        isActive: insertWarehouse.isActive ?? true,
      })
      .returning();

    await db
      .insert(warehouseInventory)
      .values({
        warehouseId: warehouse.id,
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

    return warehouse;
  }

  async updateWarehouse(id: string, updates: Partial<InsertWarehouse>): Promise<Warehouse> {
    const [warehouse] = await db
      .update(warehouses)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(warehouses.id, id))
      .returning();

    if (!warehouse) {
      throw new Error(`Warehouse with id ${id} not found`);
    }
    return warehouse;
  }

  async deleteWarehouse(id: string): Promise<boolean> {
    // Delete warehouse transfers first (they reference this warehouse)
    await db
      .delete(warehouseTransfers)
      .where(eq(warehouseTransfers.warehouseId, id));
    
    // Delete warehouse inventory (CASCADE from schema should handle this, but let's be explicit)
    await db
      .delete(warehouseInventory)
      .where(eq(warehouseInventory.warehouseId, id));
    
    // Delete inventory requests that reference this warehouse
    await db
      .delete(inventoryRequests)
      .where(eq(inventoryRequests.warehouseId, id));
    
    // Finally delete the warehouse
    const result = await db
      .delete(warehouses)
      .where(eq(warehouses.id, id));
    return (result.rowCount || 0) > 0;
  }

  async getWarehouseInventory(warehouseId: string): Promise<WarehouseInventory | undefined> {
    const [inventory] = await db
      .select()
      .from(warehouseInventory)
      .where(eq(warehouseInventory.warehouseId, warehouseId));
    return inventory || undefined;
  }

  async updateWarehouseInventory(warehouseId: string, updates: Partial<InsertWarehouseInventory>): Promise<WarehouseInventory> {
    const [inventory] = await db
      .update(warehouseInventory)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(warehouseInventory.warehouseId, warehouseId))
      .returning();

    if (!inventory) {
      throw new Error(`Warehouse inventory for warehouse ${warehouseId} not found`);
    }
    return inventory;
  }

  async transferFromWarehouse(data: InsertWarehouseTransfer): Promise<WarehouseTransfer> {
    return await db.transaction(async (tx) => {
      const [inventory] = await tx
        .select()
        .from(warehouseInventory)
        .where(eq(warehouseInventory.warehouseId, data.warehouseId));

      if (!inventory) {
        throw new Error(`Warehouse inventory not found`);
      }

      const fieldMap: Record<string, { boxes: string; units: string }> = {
        'n950': { boxes: 'n950Boxes', units: 'n950Units' },
        'i9000s': { boxes: 'i9000sBoxes', units: 'i9000sUnits' },
        'i9100': { boxes: 'i9100Boxes', units: 'i9100Units' },
        'rollPaper': { boxes: 'rollPaperBoxes', units: 'rollPaperUnits' },
        'stickers': { boxes: 'stickersBoxes', units: 'stickersUnits' },
        'newBatteries': { boxes: 'newBatteriesBoxes', units: 'newBatteriesUnits' },
        'mobilySim': { boxes: 'mobilySimBoxes', units: 'mobilySimUnits' },
        'stcSim': { boxes: 'stcSimBoxes', units: 'stcSimUnits' },
        'zainSim': { boxes: 'zainSimBoxes', units: 'zainSimUnits' },
        'lebaraSim': { boxes: 'lebaraBoxes', units: 'lebaraUnits' },
      };

      const fields = fieldMap[data.itemType];
      if (!fields) {
        throw new Error(`Invalid item type: ${data.itemType}`);
      }

      const fieldName = data.packagingType === 'box' ? fields.boxes : fields.units;
      const currentStock = (inventory as any)[fieldName] || 0;

      if (currentStock < data.quantity) {
        throw new Error(`Insufficient stock in warehouse. Available: ${currentStock}, Requested: ${data.quantity}`);
      }

      const [transfer] = await tx
        .insert(warehouseTransfers)
        .values({
          ...data,
          status: 'pending',
        })
        .returning();

      return transfer;
    });
  }

  async getWarehouseTransfers(warehouseId?: string, technicianId?: string, regionId?: string, limit?: number): Promise<WarehouseTransferWithDetails[]> {
    const itemNameMap: Record<string, string> = {
      'n950': 'N950',
      'i9000s': 'I9000s',
      'i9100': 'I9100',
      'rollPaper': 'ورق حراري',
      'stickers': 'ملصقات',
      'newBatteries': 'بطاريات جديدة',
      'mobilySim': 'شريحة موبايلي',
      'stcSim': 'شريحة STC',
      'zainSim': 'شريحة زين',
    };

    let query = db
      .select({
        id: warehouseTransfers.id,
        requestId: warehouseTransfers.requestId,
        warehouseId: warehouseTransfers.warehouseId,
        technicianId: warehouseTransfers.technicianId,
        itemType: warehouseTransfers.itemType,
        packagingType: warehouseTransfers.packagingType,
        quantity: warehouseTransfers.quantity,
        performedBy: warehouseTransfers.performedBy,
        notes: warehouseTransfers.notes,
        status: warehouseTransfers.status,
        rejectionReason: warehouseTransfers.rejectionReason,
        respondedAt: warehouseTransfers.respondedAt,
        createdAt: warehouseTransfers.createdAt,
        warehouseName: warehouses.name,
        technicianName: users.fullName,
        performedByName: sql<string>`performer.full_name`,
      })
      .from(warehouseTransfers)
      .leftJoin(warehouses, eq(warehouseTransfers.warehouseId, warehouses.id))
      .leftJoin(users, eq(warehouseTransfers.technicianId, users.id))
      .leftJoin(sql`${users} as performer`, sql`${warehouseTransfers.performedBy} = performer.id`)
      .orderBy(desc(warehouseTransfers.createdAt));

    const conditions = [];
    if (warehouseId) {
      conditions.push(eq(warehouseTransfers.warehouseId, warehouseId));
    }
    if (technicianId) {
      conditions.push(eq(warehouseTransfers.technicianId, technicianId));
    }
    if (regionId) {
      conditions.push(eq(warehouses.regionId, regionId));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    if (limit) {
      query = query.limit(limit) as any;
    }

    const transfers = await query;

    return transfers.map(transfer => ({
      ...transfer,
      itemNameAr: itemNameMap[transfer.itemType] || transfer.itemType,
      warehouseName: transfer.warehouseName || undefined,
      technicianName: transfer.technicianName || undefined,
      performedByName: transfer.performedByName || undefined,
    }));
  }

  async acceptWarehouseTransfer(transferId: string): Promise<WarehouseTransfer> {
    return await db.transaction(async (tx) => {
      const [transfer] = await tx
        .select()
        .from(warehouseTransfers)
        .where(eq(warehouseTransfers.id, transferId));

      if (!transfer) {
        throw new Error('Transfer not found');
      }

      if (transfer.status !== 'pending') {
        throw new Error(`Transfer already ${transfer.status}`);
      }

      const fieldMap: Record<string, { boxes: string; units: string }> = {
        'n950': { boxes: 'n950Boxes', units: 'n950Units' },
        'i9000s': { boxes: 'i9000sBoxes', units: 'i9000sUnits' },
        'i9100': { boxes: 'i9100Boxes', units: 'i9100Units' },
        'rollPaper': { boxes: 'rollPaperBoxes', units: 'rollPaperUnits' },
        'stickers': { boxes: 'stickersBoxes', units: 'stickersUnits' },
        'newBatteries': { boxes: 'newBatteriesBoxes', units: 'newBatteriesUnits' },
        'mobilySim': { boxes: 'mobilySimBoxes', units: 'mobilySimUnits' },
        'stcSim': { boxes: 'stcSimBoxes', units: 'stcSimUnits' },
        'zainSim': { boxes: 'zainSimBoxes', units: 'zainSimUnits' },
        'lebaraSim': { boxes: 'lebaraBoxes', units: 'lebaraUnits' },
      };

      const fields = fieldMap[transfer.itemType];
      if (!fields) {
        throw new Error(`Unknown item type: ${transfer.itemType}`);
      }
      
      const fieldName = transfer.packagingType === 'box' ? fields.boxes : fields.units;

      // Deduct from warehouse inventory
      const [warehouseInv] = await tx
        .select()
        .from(warehouseInventory)
        .where(eq(warehouseInventory.warehouseId, transfer.warehouseId));

      if (!warehouseInv) {
        throw new Error('Warehouse inventory not found');
      }

      const warehouseCurrentStock = (warehouseInv as any)[fieldName] || 0;
      if (warehouseCurrentStock < transfer.quantity) {
        throw new Error(`Insufficient stock in warehouse. Available: ${warehouseCurrentStock}, Requested: ${transfer.quantity}`);
      }

      await tx
        .update(warehouseInventory)
        .set({
          [fieldName]: warehouseCurrentStock - transfer.quantity,
          updatedAt: new Date(),
        })
        .where(eq(warehouseInventory.warehouseId, transfer.warehouseId));

      // Add to technician inventory
      const [techInventory] = await tx
        .select()
        .from(techniciansInventory)
        .where(eq(techniciansInventory.createdBy, transfer.technicianId));

      if (techInventory) {
        const techCurrentStock = (techInventory as any)[fieldName] || 0;
        await tx
          .update(techniciansInventory)
          .set({
            [fieldName]: techCurrentStock + transfer.quantity,
            updatedAt: new Date(),
          })
          .where(eq(techniciansInventory.createdBy, transfer.technicianId));
      } else {
        const [user] = await tx
          .select()
          .from(users)
          .where(eq(users.id, transfer.technicianId));

        if (!user) {
          throw new Error(`Technician with id ${transfer.technicianId} not found`);
        }

        await tx
          .insert(techniciansInventory)
          .values({
            technicianName: user.fullName,
            city: user.city || 'غير محدد',
            createdBy: transfer.technicianId,
            regionId: user.regionId,
            [fieldName]: transfer.quantity,
            n950Boxes: transfer.itemType === 'n950' && transfer.packagingType === 'box' ? transfer.quantity : 0,
            n950Units: transfer.itemType === 'n950' && transfer.packagingType === 'unit' ? transfer.quantity : 0,
            i9000sBoxes: transfer.itemType === 'i9000s' && transfer.packagingType === 'box' ? transfer.quantity : 0,
            i9000sUnits: transfer.itemType === 'i9000s' && transfer.packagingType === 'unit' ? transfer.quantity : 0,
            i9100Boxes: transfer.itemType === 'i9100' && transfer.packagingType === 'box' ? transfer.quantity : 0,
            i9100Units: transfer.itemType === 'i9100' && transfer.packagingType === 'unit' ? transfer.quantity : 0,
            rollPaperBoxes: transfer.itemType === 'rollPaper' && transfer.packagingType === 'box' ? transfer.quantity : 0,
            rollPaperUnits: transfer.itemType === 'rollPaper' && transfer.packagingType === 'unit' ? transfer.quantity : 0,
            stickersBoxes: transfer.itemType === 'stickers' && transfer.packagingType === 'box' ? transfer.quantity : 0,
            stickersUnits: transfer.itemType === 'stickers' && transfer.packagingType === 'unit' ? transfer.quantity : 0,
            newBatteriesBoxes: transfer.itemType === 'newBatteries' && transfer.packagingType === 'box' ? transfer.quantity : 0,
            newBatteriesUnits: transfer.itemType === 'newBatteries' && transfer.packagingType === 'unit' ? transfer.quantity : 0,
            mobilySimBoxes: transfer.itemType === 'mobilySim' && transfer.packagingType === 'box' ? transfer.quantity : 0,
            mobilySimUnits: transfer.itemType === 'mobilySim' && transfer.packagingType === 'unit' ? transfer.quantity : 0,
            stcSimBoxes: transfer.itemType === 'stcSim' && transfer.packagingType === 'box' ? transfer.quantity : 0,
            stcSimUnits: transfer.itemType === 'stcSim' && transfer.packagingType === 'unit' ? transfer.quantity : 0,
            zainSimBoxes: transfer.itemType === 'zainSim' && transfer.packagingType === 'box' ? transfer.quantity : 0,
            zainSimUnits: transfer.itemType === 'zainSim' && transfer.packagingType === 'unit' ? transfer.quantity : 0,
            lebaraBoxes: transfer.itemType === 'lebaraSim' && transfer.packagingType === 'box' ? transfer.quantity : 0,
            lebaraUnits: transfer.itemType === 'lebaraSim' && transfer.packagingType === 'unit' ? transfer.quantity : 0,
          });
      }

      const [updatedTransfer] = await tx
        .update(warehouseTransfers)
        .set({
          status: 'accepted',
          respondedAt: new Date(),
        })
        .where(eq(warehouseTransfers.id, transferId))
        .returning();

      return updatedTransfer;
    });
  }

  async rejectWarehouseTransfer(transferId: string, reason?: string): Promise<WarehouseTransfer> {
    const [transfer] = await db
      .select()
      .from(warehouseTransfers)
      .where(eq(warehouseTransfers.id, transferId));

    if (!transfer) {
      throw new Error('Transfer not found');
    }

    if (transfer.status !== 'pending') {
      throw new Error(`Transfer already ${transfer.status}`);
    }

    const [updatedTransfer] = await db
      .update(warehouseTransfers)
      .set({
        status: 'rejected',
        rejectionReason: reason,
        respondedAt: new Date(),
      })
      .where(eq(warehouseTransfers.id, transferId))
      .returning();

    return updatedTransfer;
  }

  async assignTechnicianToSupervisor(supervisorId: string, technicianId: string): Promise<SupervisorTechnician> {
    const [assignment] = await db
      .insert(supervisorTechnicians)
      .values({
        supervisorId,
        technicianId,
      })
      .returning();
    return assignment;
  }

  async removeTechnicianFromSupervisor(supervisorId: string, technicianId: string): Promise<boolean> {
    const result = await db
      .delete(supervisorTechnicians)
      .where(
        and(
          eq(supervisorTechnicians.supervisorId, supervisorId),
          eq(supervisorTechnicians.technicianId, technicianId)
        )
      );
    return (result.rowCount || 0) > 0;
  }

  async getSupervisorTechnicians(supervisorId: string): Promise<string[]> {
    const assignments = await db
      .select({ technicianId: supervisorTechnicians.technicianId })
      .from(supervisorTechnicians)
      .where(eq(supervisorTechnicians.supervisorId, supervisorId));
    return assignments.map(a => a.technicianId);
  }

  async getTechnicianSupervisor(technicianId: string): Promise<string | null> {
    const assignments = await db
      .select({ supervisorId: supervisorTechnicians.supervisorId })
      .from(supervisorTechnicians)
      .where(eq(supervisorTechnicians.technicianId, technicianId))
      .limit(1);
    return assignments.length > 0 ? assignments[0].supervisorId : null;
  }

  async assignWarehouseToSupervisor(supervisorId: string, warehouseId: string): Promise<SupervisorWarehouse> {
    const [assignment] = await db
      .insert(supervisorWarehouses)
      .values({
        supervisorId,
        warehouseId,
      })
      .returning();
    return assignment;
  }

  async removeWarehouseFromSupervisor(supervisorId: string, warehouseId: string): Promise<boolean> {
    const result = await db
      .delete(supervisorWarehouses)
      .where(
        and(
          eq(supervisorWarehouses.supervisorId, supervisorId),
          eq(supervisorWarehouses.warehouseId, warehouseId)
        )
      );
    return (result.rowCount || 0) > 0;
  }

  async getSupervisorWarehouses(supervisorId: string): Promise<string[]> {
    const assignments = await db
      .select({ warehouseId: supervisorWarehouses.warehouseId })
      .from(supervisorWarehouses)
      .where(eq(supervisorWarehouses.supervisorId, supervisorId));
    return assignments.map(a => a.warehouseId);
  }

  // System Logging
  async logSystemActivity(logData: InsertSystemLog): Promise<void> {
    try {
      await db.insert(systemLogs).values(logData);
    } catch (error) {
      console.error('Failed to log system activity:', error);
      // Don't throw - logging failures shouldn't break main operations
    }
  }

  async getSystemLogs(filters?: {
    limit?: number;
    offset?: number;
    userId?: string;
    regionId?: string;
    action?: string;
    entityType?: string;
    severity?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<SystemLog[]> {
    const limit = filters?.limit || 50;
    const offset = filters?.offset || 0;

    let query = db.select().from(systemLogs).$dynamic();

    const conditions = [];
    
    if (filters?.userId) {
      conditions.push(eq(systemLogs.userId, filters.userId));
    }
    
    if (filters?.regionId) {
      conditions.push(eq(systemLogs.regionId, filters.regionId));
    }
    
    if (filters?.action) {
      conditions.push(eq(systemLogs.action, filters.action));
    }
    
    if (filters?.entityType) {
      conditions.push(eq(systemLogs.entityType, filters.entityType));
    }
    
    if (filters?.severity) {
      conditions.push(eq(systemLogs.severity, filters.severity));
    }
    
    if (filters?.startDate) {
      conditions.push(gte(systemLogs.createdAt, filters.startDate));
    }
    
    if (filters?.endDate) {
      conditions.push(lte(systemLogs.createdAt, filters.endDate));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const logs = await query
      .orderBy(desc(systemLogs.createdAt))
      .limit(limit)
      .offset(offset);

    return logs;
  }

  async createSystemLog(log: InsertSystemLog): Promise<SystemLog> {
    const [created] = await db.insert(systemLogs).values(log).returning();
    return created;
  }

  async exportAllData(): Promise<any> {
    // Export all tables in dependency order (no foreign key violations)
    const backup = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      data: {
        regions: await db.select().from(regions),
        users: await db.select().from(users),
        inventoryItems: await db.select().from(inventoryItems),
        transactions: await db.select().from(transactions),
        warehouses: await db.select().from(warehouses),
        warehouseInventory: await db.select().from(warehouseInventory),
        techniciansInventory: await db.select().from(techniciansInventory),
        technicianFixedInventories: await db.select().from(technicianFixedInventories),
        inventoryRequests: await db.select().from(inventoryRequests),
        warehouseTransfers: await db.select().from(warehouseTransfers),
        stockMovements: await db.select().from(stockMovements),
        receivedDevices: await db.select().from(receivedDevices),
        systemLogs: await db.select().from(systemLogs),
      }
    };
    
    return backup;
  }

  private convertDates(obj: any): any {
    if (!obj) return obj;
    if (Array.isArray(obj)) {
      return obj.map(item => this.convertDates(item));
    }
    if (typeof obj === 'object') {
      const converted: any = {};
      for (const key in obj) {
        const value = obj[key];
        if (typeof value === 'string' && (key.includes('At') || key.includes('Date') || key.includes('date') || key.includes('Time') || key.includes('time'))) {
          const date = new Date(value);
          converted[key] = isNaN(date.getTime()) ? value : date;
        } else if (typeof value === 'object') {
          converted[key] = this.convertDates(value);
        } else {
          converted[key] = value;
        }
      }
      return converted;
    }
    return obj;
  }

  async importAllData(backup: any): Promise<void> {
    if (!backup || !backup.data) {
      throw new Error('Invalid backup file');
    }

    // Clear all tables in reverse dependency order (children first)
    await db.delete(systemLogs);
    await db.delete(receivedDevices);
    await db.delete(stockMovements);
    await db.delete(warehouseTransfers);
    await db.delete(inventoryRequests);
    await db.delete(technicianFixedInventories);
    await db.delete(techniciansInventory);
    await db.delete(warehouseInventory);
    await db.delete(transactions);
    await db.delete(warehouses);
    await db.delete(inventoryItems);
    await db.delete(users);
    await db.delete(regions);

    // Insert data in dependency order (parents first)
    if (backup.data.regions?.length > 0) {
      await db.insert(regions).values(this.convertDates(backup.data.regions));
    }
    if (backup.data.users?.length > 0) {
      await db.insert(users).values(this.convertDates(backup.data.users));
    }
    if (backup.data.inventoryItems?.length > 0) {
      await db.insert(inventoryItems).values(this.convertDates(backup.data.inventoryItems));
    }
    if (backup.data.transactions?.length > 0) {
      await db.insert(transactions).values(this.convertDates(backup.data.transactions));
    }
    if (backup.data.warehouses?.length > 0) {
      await db.insert(warehouses).values(this.convertDates(backup.data.warehouses));
    }
    if (backup.data.warehouseInventory?.length > 0) {
      await db.insert(warehouseInventory).values(this.convertDates(backup.data.warehouseInventory));
    }
    if (backup.data.techniciansInventory?.length > 0) {
      await db.insert(techniciansInventory).values(this.convertDates(backup.data.techniciansInventory));
    }
    if (backup.data.technicianFixedInventories?.length > 0) {
      await db.insert(technicianFixedInventories).values(this.convertDates(backup.data.technicianFixedInventories));
    }
    if (backup.data.inventoryRequests?.length > 0) {
      await db.insert(inventoryRequests).values(this.convertDates(backup.data.inventoryRequests));
    }
    if (backup.data.warehouseTransfers?.length > 0) {
      await db.insert(warehouseTransfers).values(this.convertDates(backup.data.warehouseTransfers));
    }
    if (backup.data.stockMovements?.length > 0) {
      await db.insert(stockMovements).values(this.convertDates(backup.data.stockMovements));
    }
    if (backup.data.receivedDevices?.length > 0) {
      await db.insert(receivedDevices).values(this.convertDates(backup.data.receivedDevices));
    }
    if (backup.data.systemLogs?.length > 0) {
      await db.insert(systemLogs).values(this.convertDates(backup.data.systemLogs));
    }
  }
}