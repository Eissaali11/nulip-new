import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Regions table for managing different areas
export const regions = pgTable("regions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Users table for employee accounts
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  role: text("role").notNull().default("employee"), // "admin", "employee"
  regionId: varchar("region_id").references(() => regions.id),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const inventoryItems = pgTable("inventory_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  type: text("type").notNull(), // "devices", "sim", "papers"
  unit: text("unit").notNull(),
  quantity: integer("quantity").notNull().default(0),
  minThreshold: integer("min_threshold").notNull().default(5),
  technicianName: text("technician_name"),
  city: text("city"),
  regionId: varchar("region_id").references(() => regions.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Technicians inventory table - new structure for tracking technician equipment
export const techniciansInventory = pgTable("technicians_inventory", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  technicianName: text("technician_name").notNull(),
  city: text("city").notNull(),
  n950Devices: integer("n950_devices").notNull().default(0),
  i900Devices: integer("i900_devices").notNull().default(0),
  rollPapers: integer("roll_papers").notNull().default(0),
  mobilySim: integer("mobily_sim").notNull().default(0),
  stcSim: integer("stc_sim").notNull().default(0),
  notes: text("notes"),
  regionId: varchar("region_id").references(() => regions.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const transactions = pgTable("transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  itemId: varchar("item_id").notNull().references(() => inventoryItems.id),
  userId: varchar("user_id").references(() => users.id),
  type: text("type").notNull(), // "add", "withdraw"
  quantity: integer("quantity").notNull(),
  reason: text("reason"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Schema for regions
export const insertRegionSchema = createInsertSchema(regions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Schema for users
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertInventoryItemSchema = createInsertSchema(inventoryItems).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTechnicianInventorySchema = createInsertSchema(techniciansInventory).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
});

// Types
export type InsertRegion = z.infer<typeof insertRegionSchema>;
export type Region = typeof regions.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertInventoryItem = z.infer<typeof insertInventoryItemSchema>;
export type InventoryItem = typeof inventoryItems.$inferSelect;
export type InsertTechnicianInventory = z.infer<typeof insertTechnicianInventorySchema>;
export type TechnicianInventory = typeof techniciansInventory.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;

// Additional types for API responses
export type InventoryItemWithStatus = InventoryItem & {
  status: 'available' | 'low' | 'out';
  regionName?: string;
};

export type RegionWithStats = Region & {
  itemCount: number;
  totalQuantity: number;
  lowStockCount: number;
};

export type UserSafe = Omit<User, 'password'>;

export type TransactionWithDetails = Transaction & {
  itemName?: string;
  userName?: string;
  regionName?: string;
};

export type DashboardStats = {
  totalItems: number;
  lowStockItems: number;
  outOfStockItems: number;
  todayTransactions: number;
  totalRegions?: number;
  totalUsers?: number;
};

export type AdminStats = {
  totalRegions: number;
  totalUsers: number;
  activeUsers: number;
  totalTransactions: number;
  recentTransactions: TransactionWithDetails[];
};

// Authentication schemas
export const loginSchema = z.object({
  username: z.string().min(1, "اسم المستخدم مطلوب"),
  password: z.string().min(1, "كلمة المرور مطلوبة"),
});

export type LoginRequest = z.infer<typeof loginSchema>;

export type AuthResponse = {
  user: UserSafe;
  token?: string;
  success: boolean;
  message?: string;
};

// Define relations for better queries
export const regionsRelations = relations(regions, ({ many }) => ({
  users: many(users),
  inventoryItems: many(inventoryItems),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  region: one(regions, {
    fields: [users.regionId],
    references: [regions.id],
  }),
  transactions: many(transactions),
}));

export const inventoryItemsRelations = relations(inventoryItems, ({ one, many }) => ({
  region: one(regions, {
    fields: [inventoryItems.regionId],
    references: [regions.id],
  }),
  transactions: many(transactions),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  item: one(inventoryItems, {
    fields: [transactions.itemId],
    references: [inventoryItems.id],
  }),
  user: one(users, {
    fields: [transactions.userId],
    references: [users.id],
  }),
}));
