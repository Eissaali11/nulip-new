# التوثيق التقني - نظام إدارة المخزون

## 📚 جدول المحتويات

1. [نظرة عامة على البنية](#نظرة-عامة-على-البنية)
2. [Frontend Architecture](#frontend-architecture)
3. [Backend Architecture](#backend-architecture)
4. [API Documentation](#api-documentation)
5. [قاعدة البيانات](#قاعدة-البيانات)
6. [Authentication & Authorization](#authentication--authorization)
7. [State Management](#state-management)
8. [Error Handling](#error-handling)
9. [Performance Optimization](#performance-optimization)

---

## نظرة عامة على البنية

### Stack التقني

```
Frontend:  React 18 + TypeScript + Vite
Backend:   Node.js + Express.js + TypeScript
Database:  PostgreSQL + Drizzle ORM
Auth:      Passport.js + Express Session
UI:        Tailwind CSS + shadcn/ui + Radix UI
State:     TanStack React Query v5
```

### هيكل المجلدات

```
project-root/
│
├── client/                    # Frontend Application
│   ├── src/
│   │   ├── components/       # React Components
│   │   │   ├── ui/          # shadcn/ui components
│   │   │   ├── add-user-modal.tsx
│   │   │   ├── edit-user-modal.tsx
│   │   │   ├── sidebar.tsx
│   │   │   └── ...
│   │   │
│   │   ├── pages/           # Page Components
│   │   │   ├── dashboard.tsx
│   │   │   ├── fixed-inventory.tsx
│   │   │   ├── moving-inventory.tsx
│   │   │   ├── users.tsx
│   │   │   ├── regions.tsx
│   │   │   ├── withdrawn-devices.tsx
│   │   │   ├── transactions.tsx
│   │   │   └── admin-inventory-overview.tsx
│   │   │
│   │   ├── lib/            # Utilities & Helpers
│   │   │   ├── queryClient.ts
│   │   │   └── utils.ts
│   │   │
│   │   ├── hooks/          # Custom React Hooks
│   │   │   └── use-toast.ts
│   │   │
│   │   ├── App.tsx         # Main App with Routing
│   │   ├── index.css       # Global Styles
│   │   └── main.tsx        # Entry Point
│   │
│   └── index.html          # HTML Template
│
├── server/                  # Backend Application
│   ├── index.ts            # Server Entry Point
│   ├── routes.ts           # API Routes Definition
│   ├── storage.ts          # Storage Interface (IStorage)
│   ├── database-storage.ts # PostgreSQL Implementation
│   ├── auth.ts             # Authentication Logic
│   └── vite.ts             # Vite Middleware
│
├── shared/                  # Shared Code
│   └── schema.ts           # Database Schema & Zod Types
│
├── docs/                    # Documentation
│   ├── USER_GUIDE.md
│   ├── TECHNICAL_DOCS.md
│   └── DATABASE_SCHEMA.md
│
├── package.json            # Dependencies
├── tsconfig.json           # TypeScript Config
├── vite.config.ts          # Vite Configuration
├── tailwind.config.ts      # Tailwind Configuration
└── drizzle.config.ts       # Drizzle ORM Config
```

---

## Frontend Architecture

### التقنيات الأساسية

#### React 18 + TypeScript
```typescript
// Component Example
interface Props {
  user: UserSafe;
  onUpdate: (user: UserSafe) => void;
}

export function UserCard({ user, onUpdate }: Props) {
  return (
    <div className="card">
      <h3>{user.fullName}</h3>
      <p>{user.email}</p>
    </div>
  );
}
```

#### Routing - Wouter
```typescript
// App.tsx
import { Route, Switch } from "wouter";

function App() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/fixed-inventory" component={FixedInventory} />
      <Route path="/moving-inventory" component={MovingInventory} />
      <Route path="/users" component={Users} />
      {/* ... more routes */}
    </Switch>
  );
}
```

#### State Management - TanStack React Query v5
```typescript
// Fetching Data
const { data: users, isLoading } = useQuery({
  queryKey: ['/api/users'],
  enabled: !!user && user.role === 'admin'
});

// Mutations
const createUser = useMutation({
  mutationFn: async (data: InsertUser) => {
    return apiRequest('/api/users', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['/api/users'] });
    toast({ title: 'تم إنشاء المستخدم بنجاح' });
  }
});
```

### Form Handling

#### React Hook Form + Zod
```typescript
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserSchema } from "@shared/schema";

const form = useForm({
  resolver: zodResolver(insertUserSchema.extend({
    city: z.string().optional()
  })),
  defaultValues: {
    username: "",
    email: "",
    password: "",
    fullName: "",
    role: "employee",
    isActive: true
  }
});

const onSubmit = (data: InsertUser) => {
  createUser.mutate(data);
};
```

### UI Components

#### shadcn/ui + Radix UI
```typescript
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem } from "@/components/ui/select";

// Usage
<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>إضافة مستخدم</DialogTitle>
    </DialogHeader>
    <Form {...form}>
      <FormField name="username" render={...} />
      <Button type="submit">حفظ</Button>
    </Form>
  </DialogContent>
</Dialog>
```

### Styling

#### Tailwind CSS
```typescript
// Component with Tailwind
<div className="flex flex-col gap-4 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
    العنوان
  </h2>
  <Button className="bg-primary hover:bg-primary/90">
    إجراء
  </Button>
</div>
```

#### Custom CSS Variables
```css
/* index.css */
:root {
  --primary: 222.2 47.4% 11.2%;
  --primary-foreground: 210 40% 98%;
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
}

.dark {
  --primary: 210 40% 98%;
  --background: 222.2 84% 4.9%;
}
```

---

## Backend Architecture

### Express.js Server

#### Server Setup
```typescript
// server/index.ts
import express from "express";
import session from "express-session";
import passport from "passport";

const app = express();

app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET!,
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

// Register routes
registerRoutes(app);

const port = parseInt(process.env.PORT || '5000', 10);
app.listen({ port, host: "0.0.0.0" });
```

### Storage Interface

```typescript
// server/storage.ts
export interface IStorage {
  // Users
  getUsers(): Promise<UserSafe[]>;
  getUser(id: string): Promise<UserSafe | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<UserSafe>;
  updateUser(id: string, updates: Partial<InsertUser>): Promise<UserSafe>;
  deleteUser(id: string): Promise<boolean>;

  // Fixed Inventory
  getTechnicianFixedInventory(technicianId: string): Promise<TechnicianFixedInventory | undefined>;
  createOrUpdateTechnicianFixedInventory(data: InsertTechnicianFixedInventory): Promise<TechnicianFixedInventory>;
  
  // Moving Inventory
  getTechniciansInventory(): Promise<TechniciansInventory[]>;
  createTechniciansInventory(data: InsertTechniciansInventory): Promise<TechniciansInventory>;
  
  // Stock Movements
  transferFromFixedToMoving(data: StockTransferRequest): Promise<void>;
  updateMovingInventoryDirectly(data: DirectUpdateRequest): Promise<void>;
  
  // ... more methods
}
```

### Database Implementation

```typescript
// server/database-storage.ts
import { db } from "./db";
import { users, techniciansInventory, stockMovements } from "@shared/schema";
import { eq, and, gte, lte } from "drizzle-orm";

export class DatabaseStorage implements IStorage {
  async getUsers(): Promise<UserSafe[]> {
    const allUsers = await db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        fullName: users.fullName,
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

  async createUser(insertUser: InsertUser): Promise<UserSafe> {
    // Check duplicates
    const existingUser = await this.getUserByUsername(insertUser.username);
    if (existingUser) {
      throw new Error("Username already exists");
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
        city: users.city,
        role: users.role,
        regionId: users.regionId,
        isActive: users.isActive,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      });
    return user;
  }
}
```

### Middleware

#### Authentication Middleware
```typescript
// server/routes.ts
const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Authentication required" });
};

const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (req.user && (req.user as User).role === 'admin') {
    return next();
  }
  res.status(403).json({ message: "Admin access required" });
};
```

---

## API Documentation

### Base URL
```
Development: http://localhost:5000/api
Production: https://your-domain/api
```

### Authentication Endpoints

#### POST /api/auth/login
تسجيل الدخول

**Request**:
```json
{
  "username": "admin",
  "password": "password123"
}
```

**Response** (200):
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "username": "admin",
    "email": "admin@example.com",
    "fullName": "المسؤول",
    "role": "admin",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

**Errors**:
- 401: Invalid credentials
- 400: Missing fields

#### POST /api/auth/logout
تسجيل الخروج

**Response** (200):
```json
{
  "success": true
}
```

#### GET /api/auth/me
الحصول على بيانات المستخدم الحالي

**Response** (200):
```json
{
  "user": {
    "id": "uuid",
    "username": "admin",
    ...
  }
}
```

**Errors**:
- 401: Not authenticated

---

### Users Endpoints

#### GET /api/users
الحصول على جميع المستخدمين

**Auth**: Required (Admin only)

**Response** (200):
```json
[
  {
    "id": "uuid",
    "username": "john_doe",
    "email": "john@example.com",
    "fullName": "John Doe",
    "city": "Riyadh",
    "role": "employee",
    "regionId": "uuid",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
]
```

#### POST /api/users
إنشاء مستخدم جديد

**Auth**: Required (Admin only)

**Request**:
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "SecurePassword123",
  "fullName": "John Doe",
  "city": "Riyadh",
  "role": "employee",
  "regionId": "uuid"
}
```

**Response** (201):
```json
{
  "id": "uuid",
  "username": "john_doe",
  ...
}
```

**Errors**:
- 400: Invalid data / Validation errors
- 409: Username or email already exists
- 401: Not authenticated
- 403: Not admin

#### PATCH /api/users/:id
تحديث مستخدم

**Auth**: Required (Admin only)

**Request**:
```json
{
  "fullName": "John Doe Updated",
  "city": "Jeddah",
  "isActive": false
}
```

**Response** (200):
```json
{
  "id": "uuid",
  "username": "john_doe",
  "fullName": "John Doe Updated",
  ...
}
```

**Errors**:
- 404: User not found
- 409: Username/email conflict
- 400: Invalid data

#### DELETE /api/users/:id
حذف مستخدم

**Auth**: Required (Admin only)

**Response** (200):
```json
{
  "success": true
}
```

**Errors**:
- 404: User not found

---

### Fixed Inventory Endpoints

#### GET /api/technician-fixed-inventory/:technicianId
الحصول على المخزون الثابت لفني

**Auth**: Required

**Response** (200):
```json
{
  "id": "uuid",
  "technicianId": "uuid",
  "n950Boxes": 10,
  "n950Units": 5,
  "i900Boxes": 8,
  "i900Units": 3,
  "rollPaperBoxes": 20,
  "rollPaperUnits": 10,
  "stickersBoxes": 15,
  "stickersUnits": 25,
  "mobilySimBoxes": 5,
  "mobilySimUnits": 30,
  "stcSimBoxes": 5,
  "stcSimUnits": 25,
  "lowStockThreshold": 30,
  "criticalStockThreshold": 70,
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

#### POST /api/technician-fixed-inventory
إنشاء/تحديث المخزون الثابت

**Auth**: Required (Admin only)

**Request**:
```json
{
  "technicianId": "uuid",
  "n950Boxes": 10,
  "n950Units": 5,
  "i900Boxes": 8,
  "i900Units": 3,
  "rollPaperBoxes": 20,
  "rollPaperUnits": 10,
  "stickersBoxes": 15,
  "stickersUnits": 25,
  "mobilySimBoxes": 5,
  "mobilySimUnits": 30,
  "stcSimBoxes": 5,
  "stcSimUnits": 25,
  "lowStockThreshold": 30,
  "criticalStockThreshold": 70
}
```

**Response** (200):
```json
{
  "id": "uuid",
  "technicianId": "uuid",
  ...
}
```

---

### Moving Inventory Endpoints

#### GET /api/technicians-inventory
الحصول على جميع المخزون المتحرك

**Auth**: Required

**Query Parameters**:
- `technicianId` (optional): Filter by technician

**Response** (200):
```json
[
  {
    "id": "uuid",
    "technicianName": "أحمد محمد",
    "city": "الرياض",
    "n950Devices": 10,
    "i900Devices": 5,
    "rollPaper": 50,
    "stickers": 100,
    "mobilySim": 30,
    "stcSim": 25,
    "notes": "ملاحظات",
    "createdBy": "uuid",
    "regionId": "uuid",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
]
```

#### POST /api/technicians-inventory
إنشاء مخزون متحرك

**Auth**: Required

**Request**:
```json
{
  "technicianName": "أحمد محمد",
  "city": "الرياض",
  "n950Devices": 0,
  "i900Devices": 0,
  "rollPaper": 0,
  "stickers": 0,
  "mobilySim": 0,
  "stcSim": 0,
  "notes": "",
  "regionId": "uuid"
}
```

#### PATCH /api/technicians-inventory/:id
تحديث المخزون المتحرك

**Auth**: Required

**Request**:
```json
{
  "n950Devices": 15,
  "rollPaper": 60,
  "notes": "تم التحديث"
}
```

---

### Stock Movement Endpoints

#### POST /api/stock-movements/transfer
نقل من المخزون الثابت إلى المتحرك

**Auth**: Required

**Request**:
```json
{
  "technicianId": "uuid",
  "quantities": {
    "n950": 5,
    "i900": 3,
    "rollPaper": 20,
    "stickers": 50,
    "mobilySim": 10,
    "stcSim": 10
  },
  "reason": "نقل للعمل الميداني"
}
```

**Response** (200):
```json
{
  "success": true,
  "message": "تم نقل المخزون بنجاح"
}
```

**Logic**:
1. Validate technician exists
2. Check fixed inventory has enough stock
3. Deduct from fixed inventory
4. Add to moving inventory
5. Create stock movement records
6. Return success

**Errors**:
- 400: Insufficient stock
- 404: Technician not found

#### POST /api/stock-movements/direct-update
تحديث مباشر للمخزون المتحرك

**Auth**: Required

**Request**:
```json
{
  "technicianId": "uuid",
  "operation": "add", // or "subtract"
  "quantities": {
    "n950": 5,
    "i900": 3
  },
  "reason": "استلام من المخزن الرئيسي"
}
```

**Response** (200):
```json
{
  "success": true
}
```

**Logic**:
- Does NOT affect fixed inventory
- Only updates moving inventory
- Creates movement record

---

### Regions Endpoints

#### GET /api/regions
الحصول على جميع المناطق

**Auth**: Required

**Response** (200):
```json
[
  {
    "id": "uuid",
    "name": "الرياض",
    "description": "منطقة الرياض",
    "isActive": true,
    "itemCount": 50,
    "totalQuantity": 500,
    "lowStockCount": 5,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
]
```

#### POST /api/regions
إنشاء منطقة جديدة

**Auth**: Required (Admin only)

**Request**:
```json
{
  "name": "جدة",
  "description": "منطقة جدة",
  "isActive": true
}
```

#### PATCH /api/regions/:id
تحديث منطقة

#### DELETE /api/regions/:id
حذف منطقة

**Constraints**:
- Cannot delete if has users
- Cannot delete if has inventory

---

### Withdrawn Devices Endpoints

#### GET /api/withdrawn-devices
الحصول على جميع الأجهزة المسحوبة

**Auth**: Required

**Response** (200):
```json
[
  {
    "id": "uuid",
    "city": "الرياض",
    "technicianName": "أحمد",
    "terminalId": "T12345",
    "serialNumber": "SN67890",
    "battery": "جيدة",
    "chargerCable": "موجود",
    "chargerHead": "موجود",
    "hasSim": "نعم",
    "simCardType": "Mobily",
    "damagePart": "الشاشة",
    "notes": "ملاحظات",
    "createdBy": "uuid",
    "regionId": "uuid",
    "createdAt": "2024-01-01T00:00:00Z"
  }
]
```

#### POST /api/withdrawn-devices
تسجيل جهاز مسحوب

#### PATCH /api/withdrawn-devices/:id
تحديث جهاز مسحوب

#### DELETE /api/withdrawn-devices/:id
حذف جهاز مسحوب

---

### Transactions Endpoints

#### GET /api/transactions
الحصول على المعاملات

**Auth**: Required

**Query Parameters**:
- `type`: "add" | "withdraw" | "all"
- `userId`: Filter by user ID
- `regionId`: Filter by region ID
- `startDate`: ISO date string
- `endDate`: ISO date string
- `search`: Search term

**Response** (200):
```json
[
  {
    "id": "uuid",
    "itemId": "uuid",
    "itemName": "N950",
    "userId": "uuid",
    "userName": "أحمد",
    "regionId": "uuid",
    "regionName": "الرياض",
    "type": "withdraw",
    "quantity": 5,
    "reason": "تركيب لعميل",
    "createdAt": "2024-01-01T00:00:00Z"
  }
]
```

---

## قاعدة البيانات

### Database Tables

#### users
```sql
CREATE TABLE users (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  full_name TEXT NOT NULL,
  city TEXT,
  role TEXT NOT NULL DEFAULT 'employee',
  region_id VARCHAR REFERENCES regions(id),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### technician_fixed_inventories
```sql
CREATE TABLE technician_fixed_inventories (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  technician_id VARCHAR NOT NULL REFERENCES users(id),
  n950_boxes INTEGER NOT NULL DEFAULT 0,
  n950_units INTEGER NOT NULL DEFAULT 0,
  i900_boxes INTEGER NOT NULL DEFAULT 0,
  i900_units INTEGER NOT NULL DEFAULT 0,
  roll_paper_boxes INTEGER NOT NULL DEFAULT 0,
  roll_paper_units INTEGER NOT NULL DEFAULT 0,
  stickers_boxes INTEGER NOT NULL DEFAULT 0,
  stickers_units INTEGER NOT NULL DEFAULT 0,
  mobily_sim_boxes INTEGER NOT NULL DEFAULT 0,
  mobily_sim_units INTEGER NOT NULL DEFAULT 0,
  stc_sim_boxes INTEGER NOT NULL DEFAULT 0,
  stc_sim_units INTEGER NOT NULL DEFAULT 0,
  low_stock_threshold INTEGER NOT NULL DEFAULT 30,
  critical_stock_threshold INTEGER NOT NULL DEFAULT 70,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(technician_id)
);
```

#### stock_movements
```sql
CREATE TABLE stock_movements (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  technician_id VARCHAR NOT NULL REFERENCES users(id),
  movement_type TEXT NOT NULL, -- 'transfer' or 'direct_update'
  item_type TEXT NOT NULL,     -- 'n950', 'i900', etc.
  quantity_changed INTEGER NOT NULL,
  from_inventory TEXT NOT NULL, -- 'fixed' or 'moving'
  to_inventory TEXT NOT NULL,   -- 'fixed' or 'moving'
  reason TEXT NOT NULL,
  created_by VARCHAR REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Indexes

```sql
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_stock_movements_technician ON stock_movements(technician_id);
CREATE INDEX idx_stock_movements_created_at ON stock_movements(created_at);
CREATE INDEX idx_transactions_created_at ON transactions(created_at);
CREATE INDEX idx_transactions_type ON transactions(type);
```

---

## Authentication & Authorization

### Passport.js Setup

```typescript
// server/auth.ts
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcrypt";

passport.use(new LocalStrategy(
  async (username, password, done) => {
    try {
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return done(null, false, { message: "Incorrect username" });
      }

      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        return done(null, false, { message: "Incorrect password" });
      }

      return done(null, user);
    } catch (error) {
      return done(error);
    }
  }
));

passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
  const user = await storage.getUser(id);
  done(null, user);
});
```

### Session Management

```typescript
import session from "express-session";
import connectPgSimple from "connect-pg-simple";

const PgStore = connectPgSimple(session);

app.use(session({
  store: new PgStore({
    conString: process.env.DATABASE_URL,
    tableName: "session"
  }),
  secret: process.env.SESSION_SECRET!,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  }
}));
```

---

## State Management

### React Query Configuration

```typescript
// client/src/lib/queryClient.ts
import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: async ({ queryKey }) => {
        const res = await fetch(queryKey[0] as string, {
          credentials: 'include'
        });
        if (!res.ok) {
          throw new Error(`Error: ${res.status}`);
        }
        return res.json();
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1
    }
  }
});

export async function apiRequest(url: string, options: RequestInit = {}) {
  const res = await fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Request failed');
  }

  return res.json();
}
```

### Cache Invalidation Strategy

```typescript
// After mutation
useMutation({
  mutationFn: createUser,
  onSuccess: () => {
    // Invalidate users list
    queryClient.invalidateQueries({ queryKey: ['/api/users'] });
    
    // Invalidate specific user if updating
    queryClient.invalidateQueries({ queryKey: ['/api/users', userId] });
  }
});
```

---

## Error Handling

### Frontend Error Handling

```typescript
// Using React Query
const { data, error, isError } = useQuery({
  queryKey: ['/api/users'],
  queryFn: fetchUsers
});

if (isError) {
  return <ErrorDisplay message={error.message} />;
}
```

### Backend Error Handling

```typescript
// server/routes.ts
app.post("/api/users", requireAuth, requireAdmin, async (req, res) => {
  try {
    const validatedData = insertUserSchema.parse(req.body);
    const user = await storage.createUser(validatedData);
    res.status(201).json(user);
  } catch (error) {
    console.error('Error creating user:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: "Invalid data", 
        errors: error.errors 
      });
    }
    
    if (error instanceof Error && error.message.includes("already exists")) {
      return res.status(409).json({ message: error.message });
    }
    
    res.status(500).json({ 
      message: error instanceof Error ? error.message : "Failed to create user"
    });
  }
});
```

---

## Performance Optimization

### Frontend Optimizations

1. **Code Splitting**:
```typescript
// Lazy load pages
const Dashboard = lazy(() => import('./pages/dashboard'));
const Users = lazy(() => import('./pages/users'));

<Suspense fallback={<Loading />}>
  <Route path="/" component={Dashboard} />
</Suspense>
```

2. **React Query Caching**:
- Default staleTime: 5 minutes
- Automatic background refetch
- Optimistic updates

3. **Debouncing Search**:
```typescript
const [search, setSearch] = useState("");
const debouncedSearch = useDebounce(search, 300);

useQuery({
  queryKey: ['/api/users', debouncedSearch],
  enabled: debouncedSearch.length > 0
});
```

### Backend Optimizations

1. **Database Queries**:
```typescript
// Use indexes
// Batch operations
// Avoid N+1 queries with joins
const users = await db
  .select()
  .from(users)
  .leftJoin(regions, eq(users.regionId, regions.id));
```

2. **Response Compression**:
```typescript
import compression from 'compression';
app.use(compression());
```

3. **Connection Pooling**:
```typescript
import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL!);
```

---

## Build & Deployment

### Development
```bash
npm run dev
```

### Build
```bash
npm run build
```
Generates:
- `dist/client/` - Frontend build
- `dist/index.js` - Backend bundle

### Production
```bash
npm start
```

### Environment Variables
```env
DATABASE_URL=postgresql://...
SESSION_SECRET=...
NODE_ENV=production
PORT=5000
```

---

## Testing & Debugging

### Debugging Tips

1. **Check LSP Errors**:
```bash
npm run check
```

2. **Database Debugging**:
```typescript
// Enable query logging
export const db = drizzle(sql, { 
  schema,
  logger: true 
});
```

3. **Network Debugging**:
- Use browser DevTools Network tab
- Check request/response
- Verify cookies are sent

4. **State Debugging**:
- Use React Query DevTools
- Check query cache
- Verify mutations

---

## Security Best Practices

1. **Password Hashing**: bcrypt with salt rounds
2. **Session Security**: HttpOnly cookies, secure in production
3. **SQL Injection**: Prepared statements via Drizzle
4. **XSS Protection**: React auto-escapes
5. **CSRF Protection**: SameSite cookies
6. **Input Validation**: Zod schemas on both sides
7. **Role-Based Access**: Middleware checks

---

**نهاية التوثيق التقني**
