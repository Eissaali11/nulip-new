import { type InventoryItem, type InsertInventoryItem, type Transaction, type InsertTransaction, type InventoryItemWithStatus, type DashboardStats } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Inventory Items
  getInventoryItems(): Promise<InventoryItemWithStatus[]>;
  getInventoryItem(id: string): Promise<InventoryItem | undefined>;
  createInventoryItem(item: InsertInventoryItem): Promise<InventoryItem>;
  updateInventoryItem(id: string, updates: Partial<InsertInventoryItem>): Promise<InventoryItem>;
  deleteInventoryItem(id: string): Promise<boolean>;
  
  // Transactions
  getTransactions(): Promise<Transaction[]>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  getRecentTransactions(limit?: number): Promise<Transaction[]>;
  
  // Dashboard
  getDashboardStats(): Promise<DashboardStats>;
  
  // Stock Operations
  addStock(itemId: string, quantity: number, reason?: string): Promise<InventoryItem>;
  withdrawStock(itemId: string, quantity: number, reason?: string): Promise<InventoryItem>;
}

export class MemStorage implements IStorage {
  private inventoryItems: Map<string, InventoryItem>;
  private transactions: Map<string, Transaction>;

  constructor() {
    this.inventoryItems = new Map();
    this.transactions = new Map();
  }

  private getItemStatus(item: InventoryItem): 'available' | 'low' | 'out' {
    if (item.quantity === 0) return 'out';
    if (item.quantity <= item.minThreshold) return 'low';
    return 'available';
  }

  async getInventoryItems(): Promise<InventoryItemWithStatus[]> {
    return Array.from(this.inventoryItems.values()).map(item => ({
      ...item,
      status: this.getItemStatus(item)
    }));
  }

  async getInventoryItem(id: string): Promise<InventoryItem | undefined> {
    return this.inventoryItems.get(id);
  }

  async createInventoryItem(insertItem: InsertInventoryItem): Promise<InventoryItem> {
    const id = randomUUID();
    const item: InventoryItem = {
      ...insertItem,
      id,
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

  async getTransactions(): Promise<Transaction[]> {
    return Array.from(this.transactions.values()).sort(
      (a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
    );
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

  async getRecentTransactions(limit: number = 10): Promise<Transaction[]> {
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

  async addStock(itemId: string, quantity: number, reason?: string): Promise<InventoryItem> {
    const item = this.inventoryItems.get(itemId);
    if (!item) {
      throw new Error(`Item with id ${itemId} not found`);
    }

    const updatedItem = await this.updateInventoryItem(itemId, {
      quantity: item.quantity + quantity,
    });

    await this.createTransaction({
      itemId,
      type: "add",
      quantity,
      reason,
    });

    return updatedItem;
  }

  async withdrawStock(itemId: string, quantity: number, reason?: string): Promise<InventoryItem> {
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
      type: "withdraw",
      quantity,
      reason,
    });

    return updatedItem;
  }
}

export const storage = new MemStorage();
