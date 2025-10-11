# دليل المطور والصيانة

## 👨‍💻 دليل التطوير الشامل

---

## 📋 جدول المحتويات

1. [إعداد بيئة التطوير](#إعداد-بيئة-التطوير)
2. [هيكل الكود](#هيكل-الكود)
3. [إضافة ميزة جديدة](#إضافة-ميزة-جديدة)
4. [Best Practices](#best-practices)
5. [الاختبار](#الاختبار)
6. [التصحيح (Debugging)](#التصحيح)
7. [الأداء](#الأداء)
8. [الأمان](#الأمان)
9. [النشر](#النشر)
10. [الصيانة](#الصيانة)

---

## إعداد بيئة التطوير

### المتطلبات

```bash
# Required
Node.js: v20.x or higher
PostgreSQL: v14 or higher
npm: v10.x or higher

# Optional
Git
VS Code (recommended)
```

### التثبيت الأولي

```bash
# 1. Clone the repository
git clone <repository-url>
cd inventory-management

# 2. Install dependencies
npm install

# 3. Setup environment variables
cp .env.example .env
# Edit .env with your configuration

# 4. Setup database
npm run db:push

# 5. Run development server
npm run dev
```

### متغيرات البيئة

```env
# Database
DATABASE_URL=postgresql://user:pass@host:port/db
PGHOST=localhost
PGPORT=5432
PGUSER=postgres
PGPASSWORD=password
PGDATABASE=inventory

# Session
SESSION_SECRET=your-secret-key-here

# Server
PORT=5000
NODE_ENV=development
```

### VS Code Extensions (Recommended)

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-typescript-next",
    "formulahendry.auto-rename-tag",
    "usernamehw.errorlens"
  ]
}
```

---

## هيكل الكود

### Architecture Overview

```
┌─────────────────────┐
│   Client (React)    │
│  - Components       │
│  - Pages            │
│  - State (RQ)       │
└──────────┬──────────┘
           │ HTTP/REST
           ▼
┌─────────────────────┐
│  Server (Express)   │
│  - Routes           │
│  - Middleware       │
│  - Auth             │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Storage Layer      │
│  - Interface        │
│  - Implementation   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Database (PG)      │
│  - Drizzle ORM      │
│  - Schema           │
└─────────────────────┘
```

### Directory Structure Details

#### `/client` - Frontend

```
client/
├── src/
│   ├── components/          # Reusable components
│   │   ├── ui/             # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── form.tsx
│   │   │   └── ...
│   │   ├── add-user-modal.tsx
│   │   ├── edit-user-modal.tsx
│   │   └── sidebar.tsx
│   │
│   ├── pages/              # Page components (routes)
│   │   ├── dashboard.tsx
│   │   ├── fixed-inventory.tsx
│   │   ├── moving-inventory.tsx
│   │   ├── users.tsx
│   │   └── ...
│   │
│   ├── lib/                # Utilities
│   │   ├── queryClient.ts  # React Query setup
│   │   └── utils.ts        # Helper functions
│   │
│   ├── hooks/              # Custom React hooks
│   │   └── use-toast.ts
│   │
│   ├── App.tsx             # Main app with routing
│   ├── index.css           # Global styles
│   └── main.tsx            # Entry point
│
└── index.html              # HTML template
```

#### `/server` - Backend

```
server/
├── index.ts                # Server entry point
├── routes.ts               # API routes definition
├── storage.ts              # IStorage interface
├── database-storage.ts     # PostgreSQL implementation
├── auth.ts                 # Passport.js auth setup
├── db.ts                   # Database connection
└── vite.ts                 # Vite middleware
```

#### `/shared` - Shared Code

```
shared/
└── schema.ts              # Database schema + Zod types
    ├── Tables definitions (Drizzle)
    ├── Insert schemas (Zod)
    ├── Types (TypeScript)
    └── Relations
```

### Naming Conventions

#### Files
- **Components**: `PascalCase.tsx` (e.g., `UserCard.tsx`)
- **Pages**: `kebab-case.tsx` (e.g., `fixed-inventory.tsx`)
- **Utilities**: `camelCase.ts` (e.g., `queryClient.ts`)
- **Types**: `PascalCase.ts` (e.g., `User.ts`)

#### Code
- **Components**: `PascalCase` (e.g., `UserCard`)
- **Functions**: `camelCase` (e.g., `createUser`)
- **Variables**: `camelCase` (e.g., `userName`)
- **Constants**: `UPPER_SNAKE_CASE` (e.g., `API_BASE_URL`)
- **Types/Interfaces**: `PascalCase` (e.g., `User`, `IStorage`)

---

## إضافة ميزة جديدة

### Step-by-Step Guide

#### 1. تحديث Database Schema

```typescript
// shared/schema.ts

// 1. Add table definition
export const yourNewTable = pgTable("your_new_table", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  // ... more columns
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// 2. Create insert schema
export const insertYourNewTableSchema = createInsertSchema(yourNewTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// 3. Create types
export type YourNewTable = typeof yourNewTable.$inferSelect;
export type InsertYourNewTable = z.infer<typeof insertYourNewTableSchema>;
```

```bash
# Push to database
npm run db:push
```

#### 2. تحديث Storage Interface

```typescript
// server/storage.ts

export interface IStorage {
  // ... existing methods
  
  // Add new methods
  getYourNewItems(): Promise<YourNewTable[]>;
  getYourNewItem(id: string): Promise<YourNewTable | undefined>;
  createYourNewItem(data: InsertYourNewTable): Promise<YourNewTable>;
  updateYourNewItem(id: string, data: Partial<InsertYourNewTable>): Promise<YourNewTable>;
  deleteYourNewItem(id: string): Promise<boolean>;
}
```

#### 3. تحديث Database Implementation

```typescript
// server/database-storage.ts

export class DatabaseStorage implements IStorage {
  // ... existing methods

  async getYourNewItems(): Promise<YourNewTable[]> {
    return await db.select().from(yourNewTable);
  }

  async getYourNewItem(id: string): Promise<YourNewTable | undefined> {
    const [item] = await db
      .select()
      .from(yourNewTable)
      .where(eq(yourNewTable.id, id));
    return item || undefined;
  }

  async createYourNewItem(data: InsertYourNewTable): Promise<YourNewTable> {
    const [item] = await db
      .insert(yourNewTable)
      .values(data)
      .returning();
    return item;
  }

  async updateYourNewItem(
    id: string, 
    data: Partial<InsertYourNewTable>
  ): Promise<YourNewTable> {
    const [item] = await db
      .update(yourNewTable)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(yourNewTable.id, id))
      .returning();
    
    if (!item) {
      throw new Error(`Item with id ${id} not found`);
    }
    return item;
  }

  async deleteYourNewItem(id: string): Promise<boolean> {
    const result = await db
      .delete(yourNewTable)
      .where(eq(yourNewTable.id, id));
    return (result.rowCount || 0) > 0;
  }
}
```

#### 4. إضافة API Routes

```typescript
// server/routes.ts

export function registerRoutes(app: Express) {
  // ... existing routes

  // GET all items
  app.get("/api/your-items", requireAuth, async (req, res) => {
    try {
      const items = await storage.getYourNewItems();
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch items" });
    }
  });

  // GET single item
  app.get("/api/your-items/:id", requireAuth, async (req, res) => {
    try {
      const item = await storage.getYourNewItem(req.params.id);
      if (!item) {
        return res.status(404).json({ message: "Item not found" });
      }
      res.json(item);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch item" });
    }
  });

  // POST create item
  app.post("/api/your-items", requireAuth, async (req, res) => {
    try {
      const validatedData = insertYourNewTableSchema.parse(req.body);
      const item = await storage.createYourNewItem(validatedData);
      res.status(201).json(item);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid data", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Failed to create item" });
    }
  });

  // PATCH update item
  app.patch("/api/your-items/:id", requireAuth, async (req, res) => {
    try {
      const validatedData = insertYourNewTableSchema.partial().parse(req.body);
      const item = await storage.updateYourNewItem(req.params.id, validatedData);
      res.json(item);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data" });
      }
      if (error instanceof Error && error.message.includes("not found")) {
        return res.status(404).json({ message: "Item not found" });
      }
      res.status(500).json({ message: "Failed to update item" });
    }
  });

  // DELETE item
  app.delete("/api/your-items/:id", requireAuth, async (req, res) => {
    try {
      const deleted = await storage.deleteYourNewItem(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Item not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete item" });
    }
  });
}
```

#### 5. إنشاء Frontend Page

```typescript
// client/src/pages/your-items.tsx

import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import type { YourNewTable, InsertYourNewTable } from "@shared/schema";

export default function YourItemsPage() {
  // Fetch items
  const { data: items, isLoading } = useQuery<YourNewTable[]>({
    queryKey: ['/api/your-items']
  });

  // Create mutation
  const createItem = useMutation({
    mutationFn: async (data: InsertYourNewTable) => {
      return apiRequest('/api/your-items', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/your-items'] });
    }
  });

  // Delete mutation
  const deleteItem = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest(`/api/your-items/${id}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/your-items'] });
    }
  });

  if (isLoading) {
    return <div>جاري التحميل...</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Your Items</h1>
      
      <Button onClick={() => {/* open create modal */}}>
        إضافة عنصر جديد
      </Button>

      <div className="mt-6 grid gap-4">
        {items?.map((item) => (
          <div key={item.id} className="border p-4 rounded-lg">
            <h3>{item.name}</h3>
            <Button 
              variant="destructive"
              onClick={() => deleteItem.mutate(item.id)}
            >
              حذف
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
```

#### 6. إضافة Route في App

```typescript
// client/src/App.tsx

import YourItemsPage from "./pages/your-items";

function App() {
  return (
    <Switch>
      {/* existing routes */}
      <Route path="/your-items" component={YourItemsPage} />
    </Switch>
  );
}
```

#### 7. إضافة في Sidebar

```typescript
// client/src/components/sidebar.tsx

<Link href="/your-items">
  <YourIcon className="mr-2 h-4 w-4" />
  <span>Your Items</span>
</Link>
```

---

## Best Practices

### TypeScript

```typescript
// ✅ Good: Strong typing
interface UserProps {
  user: User;
  onUpdate: (user: User) => void;
}

// ❌ Bad: Using any
const doSomething = (data: any) => {
  // ...
}

// ✅ Good: Type guards
function isUser(obj: unknown): obj is User {
  return typeof obj === 'object' && obj !== null && 'id' in obj;
}
```

### React Components

```typescript
// ✅ Good: Functional component with proper typing
interface CardProps {
  title: string;
  children: React.ReactNode;
}

export function Card({ title, children }: CardProps) {
  return (
    <div className="card">
      <h3>{title}</h3>
      {children}
    </div>
  );
}

// ✅ Good: Use React Query for data fetching
const { data, isLoading, error } = useQuery({
  queryKey: ['/api/users'],
  staleTime: 5 * 60 * 1000
});

// ❌ Bad: Fetching in useEffect
useEffect(() => {
  fetch('/api/users')
    .then(res => res.json())
    .then(setData);
}, []);
```

### Forms

```typescript
// ✅ Good: React Hook Form + Zod
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserSchema } from "@shared/schema";

const form = useForm({
  resolver: zodResolver(insertUserSchema),
  defaultValues: {
    username: "",
    email: "",
    password: ""
  }
});

const onSubmit = async (data: InsertUser) => {
  await createUser.mutateAsync(data);
};
```

### API Requests

```typescript
// ✅ Good: Using apiRequest helper
const createUser = useMutation({
  mutationFn: async (data: InsertUser) => {
    return apiRequest('/api/users', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }
});

// ❌ Bad: Manual fetch without error handling
const createUser = async (data) => {
  const res = await fetch('/api/users', {
    method: 'POST',
    body: JSON.stringify(data)
  });
  return res.json();
};
```

### Database Queries

```typescript
// ✅ Good: Using Drizzle with proper joins
const usersWithRegions = await db
  .select({
    id: users.id,
    name: users.fullName,
    regionName: regions.name
  })
  .from(users)
  .leftJoin(regions, eq(users.regionId, regions.id));

// ✅ Good: Using transactions for complex operations
await db.transaction(async (tx) => {
  await tx.update(fixedInventory).set({ n950Units: n950Units - 5 });
  await tx.update(movingInventory).set({ n950Devices: n950Devices + 5 });
  await tx.insert(stockMovements).values({ /* ... */ });
});

// ❌ Bad: N+1 queries
const users = await db.select().from(users);
for (const user of users) {
  const region = await db
    .select()
    .from(regions)
    .where(eq(regions.id, user.regionId));
}
```

### Error Handling

```typescript
// ✅ Good: Comprehensive error handling
app.post("/api/users", async (req, res) => {
  try {
    const data = insertUserSchema.parse(req.body);
    const user = await storage.createUser(data);
    res.status(201).json(user);
  } catch (error) {
    console.error('Error creating user:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: "Invalid data", 
        errors: error.errors 
      });
    }
    
    if (error instanceof Error) {
      if (error.message.includes("already exists")) {
        return res.status(409).json({ message: error.message });
      }
      return res.status(500).json({ message: error.message });
    }
    
    res.status(500).json({ message: "Internal server error" });
  }
});
```

### CSS/Styling

```typescript
// ✅ Good: Using Tailwind utilities
<div className="flex items-center gap-4 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
    العنوان
  </h2>
</div>

// ✅ Good: Using cn() for conditional classes
import { cn } from "@/lib/utils";

<div className={cn(
  "px-4 py-2 rounded-md",
  variant === "primary" && "bg-blue-500 text-white",
  variant === "secondary" && "bg-gray-500 text-white",
  isDisabled && "opacity-50 cursor-not-allowed"
)}>
```

---

## الاختبار

### Manual Testing Checklist

#### Frontend
- [ ] جميع الصفحات تحمّل بدون أخطاء
- [ ] النماذج تُرسل البيانات بشكل صحيح
- [ ] رسائل الخطأ تظهر بوضوح
- [ ] Loading states تعمل
- [ ] التصميم متجاوب (جوال، تابلت، ديسكتوب)
- [ ] Dark mode يعمل بشكل صحيح
- [ ] Navigation يعمل
- [ ] Cache invalidation يعمل بعد mutations

#### Backend
- [ ] جميع Endpoints تستجيب
- [ ] Authentication يعمل
- [ ] Authorization يعمل (Admin/Employee)
- [ ] Validation يعمل (Zod schemas)
- [ ] Database queries تعمل
- [ ] Error handling شامل
- [ ] Logs واضحة

#### Database
- [ ] Migrations نجحت
- [ ] Constraints تعمل
- [ ] Foreign keys صحيحة
- [ ] Indexes موجودة
- [ ] Data integrity محفوظة

### Test Commands

```bash
# Type checking
npm run check

# Build test
npm run build

# Manual test in browser
npm run dev
# Then open http://localhost:5000
```

---

## التصحيح

### Frontend Debugging

#### React DevTools
```typescript
// Install React DevTools extension
// Inspect components, props, state
```

#### React Query DevTools
```typescript
// Already installed in development
// Open browser console
// Check query cache, mutations, status
```

#### Browser Console
```javascript
// Log data
console.log('User data:', user);

// Log errors
console.error('Error:', error);

// Check network requests
// Open Network tab in DevTools
```

### Backend Debugging

#### Server Logs
```typescript
// server/routes.ts
console.log('Request body:', req.body);
console.error('Error creating user:', error);
```

#### Database Queries
```typescript
// Enable query logging
export const db = drizzle(sql, { 
  schema,
  logger: true  // Shows all SQL queries
});
```

#### Network Debugging
```bash
# Check if server is running
curl http://localhost:5000/api/auth/me

# Test API endpoint
curl -X POST http://localhost:5000/api/users \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@example.com",...}'
```

### Common Issues & Solutions

#### Issue: Port already in use
```bash
# Solution
pkill -f "tsx server/index.ts"
npm run dev
```

#### Issue: Database connection fails
```bash
# Check DATABASE_URL
echo $DATABASE_URL

# Test connection
psql $DATABASE_URL
```

#### Issue: TypeScript errors
```bash
# Check for errors
npm run check

# Fix auto-fixable issues
npx eslint --fix .
```

#### Issue: React Query not refetching
```typescript
// Solution: Invalidate cache
queryClient.invalidateQueries({ queryKey: ['/api/users'] });
```

---

## الأداء

### Frontend Optimization

#### Code Splitting
```typescript
// Lazy load pages
const Dashboard = lazy(() => import('./pages/dashboard'));

<Suspense fallback={<Loading />}>
  <Dashboard />
</Suspense>
```

#### Memoization
```typescript
// Memo expensive computations
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(data);
}, [data]);

// Memo callbacks
const handleClick = useCallback(() => {
  doSomething(id);
}, [id]);
```

#### React Query Caching
```typescript
// Set staleTime to avoid unnecessary refetches
const { data } = useQuery({
  queryKey: ['/api/users'],
  staleTime: 5 * 60 * 1000  // 5 minutes
});
```

### Backend Optimization

#### Database Queries
```typescript
// Use indexes
// Create index on frequently queried columns
CREATE INDEX idx_users_email ON users(email);

// Use joins instead of N+1 queries
const data = await db
  .select()
  .from(users)
  .leftJoin(regions, eq(users.regionId, regions.id));

// Limit results
.limit(100)
```

#### Caching (Future)
```typescript
// Consider Redis for frequently accessed data
import Redis from 'ioredis';
const redis = new Redis(process.env.REDIS_URL);
```

---

## الأمان

### Authentication Security

```typescript
// ✅ Hash passwords with bcrypt
import bcrypt from 'bcrypt';
const hashedPassword = await bcrypt.hash(password, 10);

// ✅ Secure session cookies
app.use(session({
  secret: process.env.SESSION_SECRET!,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000
  }
}));
```

### Input Validation

```typescript
// ✅ Always validate with Zod
const data = insertUserSchema.parse(req.body);

// ✅ Sanitize inputs
const username = req.body.username.trim().toLowerCase();
```

### SQL Injection Prevention

```typescript
// ✅ Drizzle uses prepared statements
const user = await db
  .select()
  .from(users)
  .where(eq(users.id, userId));  // Safe

// ❌ Never use raw SQL with user input
const query = `SELECT * FROM users WHERE id = '${userId}'`;  // Vulnerable!
```

### XSS Prevention

```typescript
// ✅ React auto-escapes
<div>{userInput}</div>  // Safe

// ❌ Dangerous HTML
<div dangerouslySetInnerHTML={{ __html: userInput }} />  // Vulnerable!
```

---

## النشر

### Build Process

```bash
# 1. Build frontend and backend
npm run build

# Output:
# - dist/client/     (frontend static files)
# - dist/index.js    (backend bundle)

# 2. Run in production
npm start
```

### Environment Setup

```env
# Production .env
DATABASE_URL=postgresql://prod_user:pass@prod_host:5432/prod_db
SESSION_SECRET=strong-random-secret
NODE_ENV=production
PORT=5000
```

### Deployment on Replit

1. **Push code to Replit**
2. **Set environment variables** in Secrets
3. **Click "Publish"** button
4. **Wait for build** to complete
5. **Access** at `https://your-app.replit.app`

### Pre-Deployment Checklist

- [ ] All tests pass
- [ ] TypeScript check passes (`npm run check`)
- [ ] Build succeeds (`npm run build`)
- [ ] Environment variables set
- [ ] Database migrations applied
- [ ] Secrets configured
- [ ] Error logging enabled
- [ ] Performance optimized

---

## الصيانة

### Daily Tasks

```bash
# Check application logs
tail -f logs/app.log

# Monitor server health
curl https://your-app.replit.app/api/health

# Check database connection
psql $DATABASE_URL -c "SELECT 1;"
```

### Weekly Tasks

```bash
# Update dependencies
npm outdated
npm update

# Check for security vulnerabilities
npm audit
npm audit fix

# Analyze bundle size
npm run build
ls -lh dist/client/assets/
```

### Monthly Tasks

```sql
-- Analyze database tables
ANALYZE users;
ANALYZE technicians_inventory;

-- Vacuum database
VACUUM ANALYZE;

-- Check table sizes
SELECT 
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Backup Strategy

```bash
# Daily automatic backups (Replit/Neon)
# Manual backup
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Restore from backup
psql $DATABASE_URL < backup_20240101.sql
```

### Monitoring

#### Application Metrics
- Response times
- Error rates
- Active users
- API usage

#### Database Metrics
- Connection pool usage
- Slow queries
- Table sizes
- Index usage

#### Server Metrics
- CPU usage
- Memory usage
- Disk space
- Network traffic

---

## Git Workflow

### Branching Strategy

```bash
# Main branches
main          # Production code
develop       # Development code

# Feature branches
feature/user-management
feature/inventory-tracking
feature/excel-export

# Bugfix branches
bugfix/user-creation-error
bugfix/inventory-calculation

# Hotfix branches
hotfix/critical-security-fix
```

### Commit Messages

```bash
# Format: <type>: <description>

# Examples:
feat: add user profile page
fix: resolve inventory calculation bug
docs: update API documentation
style: format code with prettier
refactor: restructure storage layer
test: add unit tests for auth
chore: update dependencies
```

### Pull Request Process

1. Create feature branch
2. Make changes
3. Test locally
4. Commit with clear messages
5. Push to remote
6. Create Pull Request
7. Code review
8. Merge to develop
9. Test on staging
10. Merge to main
11. Deploy to production

---

## Troubleshooting Guide

### Issue: Application won't start

**Symptoms**: Server crashes on startup

**Solutions**:
```bash
# 1. Check Node version
node --version  # Should be v20+

# 2. Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# 3. Check environment variables
printenv | grep DATABASE_URL
printenv | grep SESSION_SECRET

# 4. Check port availability
lsof -i :5000
```

### Issue: Database connection fails

**Symptoms**: "Connection refused" or timeout

**Solutions**:
```bash
# 1. Verify DATABASE_URL
echo $DATABASE_URL

# 2. Test connection
psql $DATABASE_URL -c "SELECT 1;"

# 3. Check firewall/network
ping your-db-host

# 4. Verify database exists
psql $DATABASE_URL -c "\l"
```

### Issue: Authentication not working

**Symptoms**: Always returns 401

**Solutions**:
```typescript
// 1. Check SESSION_SECRET exists
console.log('SESSION_SECRET:', process.env.SESSION_SECRET ? 'Set' : 'Missing');

// 2. Verify cookie settings
// In production, secure: true requires HTTPS

// 3. Check Passport serialization
passport.serializeUser((user, done) => {
  console.log('Serializing user:', user.id);
  done(null, user.id);
});
```

### Issue: React Query not updating

**Symptoms**: UI doesn't reflect changes

**Solutions**:
```typescript
// 1. Check cache invalidation
queryClient.invalidateQueries({ queryKey: ['/api/users'] });

// 2. Check queryKey consistency
// Make sure same key used in useQuery and invalidation

// 3. Enable React Query DevTools
// Check cache state in browser

// 4. Force refetch
queryClient.refetchQueries({ queryKey: ['/api/users'] });
```

---

## Contact & Support

### Internal Documentation
- README.md: Overview
- docs/USER_GUIDE.md: User manual
- docs/TECHNICAL_DOCS.md: Technical specs
- docs/DATABASE_SCHEMA.md: Database info
- docs/DEVELOPER_GUIDE.md: This file

### Getting Help
1. Check this documentation
2. Search existing issues/tickets
3. Ask team members
4. Create issue with details:
   - What you're trying to do
   - What's happening
   - Error messages
   - Steps to reproduce

---

**Happy Coding! 🚀**
