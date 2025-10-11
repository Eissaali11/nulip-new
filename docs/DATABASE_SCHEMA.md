# قاعدة البيانات - التوثيق الكامل

## 📊 نظرة عامة

هذا المستند يوثق بنية قاعدة البيانات الكاملة لنظام إدارة المخزون.

### التقنيات المستخدمة
- **Database**: PostgreSQL 14+
- **ORM**: Drizzle ORM v0.39
- **Provider**: Neon Serverless PostgreSQL
- **Connection**: @neondatabase/serverless

---

## 📋 الجداول (Tables)

### 1. users (المستخدمون)

**الغرض**: تخزين بيانات المستخدمين والموظفين

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

**الأعمدة**:

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | VARCHAR | NO | gen_random_uuid() | معرف فريد للمستخدم |
| username | TEXT | NO | - | اسم المستخدم (فريد) |
| email | TEXT | NO | - | البريد الإلكتروني (فريد) |
| password | TEXT | NO | - | كلمة المرور المشفرة (bcrypt) |
| full_name | TEXT | NO | - | الاسم الكامل |
| city | TEXT | YES | NULL | المدينة |
| role | TEXT | NO | 'employee' | الصلاحية: 'admin' أو 'employee' |
| region_id | VARCHAR | YES | NULL | معرف المنطقة (FK) |
| is_active | BOOLEAN | NO | true | حالة النشاط |
| created_at | TIMESTAMP | YES | NOW() | تاريخ الإنشاء |
| updated_at | TIMESTAMP | YES | NOW() | تاريخ آخر تحديث |

**Constraints**:
- PRIMARY KEY: id
- UNIQUE: username
- UNIQUE: email
- FOREIGN KEY: region_id → regions(id)

**Indexes**:
```sql
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_region ON users(region_id);
```

---

### 2. regions (المناطق)

**الغرض**: تنظيم المستخدمين والمخزون حسب المناطق الجغرافية

```sql
CREATE TABLE regions (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**الأعمدة**:

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | VARCHAR | NO | gen_random_uuid() | معرف فريد للمنطقة |
| name | TEXT | NO | - | اسم المنطقة |
| description | TEXT | YES | NULL | وصف المنطقة |
| is_active | BOOLEAN | NO | true | حالة النشاط |
| created_at | TIMESTAMP | YES | NOW() | تاريخ الإنشاء |
| updated_at | TIMESTAMP | YES | NOW() | تاريخ آخر تحديث |

**Business Rules**:
- لا يمكن حذف منطقة تحتوي على مستخدمين
- لا يمكن حذف منطقة تحتوي على مخزون

---

### 3. technician_fixed_inventories (المخزون الثابت)

**الغرض**: تخزين المخزون الثابت لكل فني (القاعدة الأساسية)

```sql
CREATE TABLE technician_fixed_inventories (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  technician_id VARCHAR NOT NULL REFERENCES users(id),
  
  -- N950 Devices
  n950_boxes INTEGER NOT NULL DEFAULT 0,
  n950_units INTEGER NOT NULL DEFAULT 0,
  
  -- I900 Devices
  i900_boxes INTEGER NOT NULL DEFAULT 0,
  i900_units INTEGER NOT NULL DEFAULT 0,
  
  -- Roll Paper
  roll_paper_boxes INTEGER NOT NULL DEFAULT 0,
  roll_paper_units INTEGER NOT NULL DEFAULT 0,
  
  -- Stickers
  stickers_boxes INTEGER NOT NULL DEFAULT 0,
  stickers_units INTEGER NOT NULL DEFAULT 0,
  
  -- Mobily SIM
  mobily_sim_boxes INTEGER NOT NULL DEFAULT 0,
  mobily_sim_units INTEGER NOT NULL DEFAULT 0,
  
  -- STC SIM
  stc_sim_boxes INTEGER NOT NULL DEFAULT 0,
  stc_sim_units INTEGER NOT NULL DEFAULT 0,
  
  -- Alert Thresholds (percentage)
  low_stock_threshold INTEGER NOT NULL DEFAULT 30,
  critical_stock_threshold INTEGER NOT NULL DEFAULT 70,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(technician_id)
);
```

**الأعمدة**:

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| id | VARCHAR | gen_random_uuid() | معرف فريد |
| technician_id | VARCHAR | - | معرف الفني (FK) |
| n950_boxes | INTEGER | 0 | عدد صناديق N950 |
| n950_units | INTEGER | 0 | عدد وحدات N950 |
| i900_boxes | INTEGER | 0 | عدد صناديق I900 |
| i900_units | INTEGER | 0 | عدد وحدات I900 |
| roll_paper_boxes | INTEGER | 0 | عدد صناديق الأوراق |
| roll_paper_units | INTEGER | 0 | عدد وحدات الأوراق |
| stickers_boxes | INTEGER | 0 | عدد صناديق الملصقات |
| stickers_units | INTEGER | 0 | عدد وحدات الملصقات |
| mobily_sim_boxes | INTEGER | 0 | عدد صناديق شرائح موبايلي |
| mobily_sim_units | INTEGER | 0 | عدد وحدات شرائح موبايلي |
| stc_sim_boxes | INTEGER | 0 | عدد صناديق شرائح STC |
| stc_sim_units | INTEGER | 0 | عدد وحدات شرائح STC |
| low_stock_threshold | INTEGER | 30 | نسبة التحذير (%) |
| critical_stock_threshold | INTEGER | 70 | نسبة الحرج (%) |

**Constraints**:
- PRIMARY KEY: id
- UNIQUE: technician_id (فني واحد = سجل واحد)
- FOREIGN KEY: technician_id → users(id)

**Business Rules**:
1. يُدخل يدوياً من قبل المسؤول
2. يُخصم منه عند النقل للمخزون المتحرك
3. لا يتأثر بالتحديثات المباشرة للمخزون المتحرك

---

### 4. technicians_inventory (المخزون المتحرك)

**الغرض**: تخزين المخزون المتحرك الفعلي لكل فني

```sql
CREATE TABLE technicians_inventory (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  technician_name TEXT NOT NULL,
  city TEXT NOT NULL,
  n950_devices INTEGER NOT NULL DEFAULT 0,
  i900_devices INTEGER NOT NULL DEFAULT 0,
  roll_paper INTEGER NOT NULL DEFAULT 0,
  stickers INTEGER NOT NULL DEFAULT 0,
  mobily_sim INTEGER NOT NULL DEFAULT 0,
  stc_sim INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_by VARCHAR REFERENCES users(id),
  region_id VARCHAR REFERENCES regions(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**الأعمدة**:

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| id | VARCHAR | gen_random_uuid() | معرف فريد |
| technician_name | TEXT | - | اسم الفني |
| city | TEXT | - | المدينة |
| n950_devices | INTEGER | 0 | عدد أجهزة N950 |
| i900_devices | INTEGER | 0 | عدد أجهزة I900 |
| roll_paper | INTEGER | 0 | عدد أوراق الرول |
| stickers | INTEGER | 0 | عدد الملصقات |
| mobily_sim | INTEGER | 0 | عدد شرائح موبايلي |
| stc_sim | INTEGER | 0 | عدد شرائح STC |
| notes | TEXT | NULL | ملاحظات |
| created_by | VARCHAR | NULL | من أنشأ السجل (FK) |
| region_id | VARCHAR | NULL | معرف المنطقة (FK) |

**Indexes**:
```sql
CREATE INDEX idx_technicians_inventory_city ON technicians_inventory(city);
CREATE INDEX idx_technicians_inventory_region ON technicians_inventory(region_id);
```

**Business Rules**:
1. يستقبل التحويلات من المخزون الثابت
2. يمكن تحديثه مباشرة (إضافة/خصم)
3. يمثل المخزون الفعلي للعمل الميداني

---

### 5. stock_movements (حركات المخزون)

**الغرض**: تسجيل جميع حركات المخزون (نقل، تحديث)

```sql
CREATE TABLE stock_movements (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  technician_id VARCHAR NOT NULL REFERENCES users(id),
  movement_type TEXT NOT NULL,      -- 'transfer' or 'direct_update'
  item_type TEXT NOT NULL,          -- 'n950', 'i900', 'rollPaper', etc.
  quantity_changed INTEGER NOT NULL,
  from_inventory TEXT NOT NULL,     -- 'fixed' or 'moving'
  to_inventory TEXT NOT NULL,       -- 'fixed' or 'moving'
  reason TEXT NOT NULL,
  created_by VARCHAR REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);
```

**الأعمدة**:

| Column | Type | Description |
|--------|------|-------------|
| id | VARCHAR | معرف فريد |
| technician_id | VARCHAR | معرف الفني (FK) |
| movement_type | TEXT | نوع الحركة: 'transfer' أو 'direct_update' |
| item_type | TEXT | نوع الصنف: 'n950', 'i900', 'rollPaper', 'stickers', 'mobilySim', 'stcSim' |
| quantity_changed | INTEGER | الكمية المتغيرة |
| from_inventory | TEXT | من أين: 'fixed' أو 'moving' |
| to_inventory | TEXT | إلى أين: 'fixed' أو 'moving' |
| reason | TEXT | سبب الحركة |
| created_by | VARCHAR | من قام بالعملية (FK) |
| created_at | TIMESTAMP | تاريخ الحركة |

**Indexes**:
```sql
CREATE INDEX idx_stock_movements_technician ON stock_movements(technician_id);
CREATE INDEX idx_stock_movements_created_at ON stock_movements(created_at);
CREATE INDEX idx_stock_movements_type ON stock_movements(movement_type);
```

**أنواع الحركات**:

1. **transfer** (النقل):
   - من: fixed
   - إلى: moving
   - يخصم من الثابت ويضيف للمتحرك

2. **direct_update** (التحديث المباشر):
   - من: moving
   - إلى: moving
   - لا يؤثر على الثابت

---

### 6. inventory_items (المخزون العام)

**الغرض**: تخزين أصناف المخزون العامة (نظام قديم، للتوافق)

```sql
CREATE TABLE inventory_items (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL,               -- 'devices', 'sim', 'papers'
  unit TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  min_threshold INTEGER NOT NULL DEFAULT 5,
  technician_name TEXT,
  city TEXT,
  region_id VARCHAR REFERENCES regions(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**الأعمدة**:

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| id | VARCHAR | gen_random_uuid() | معرف فريد |
| name | TEXT | - | اسم الصنف |
| type | TEXT | - | نوع الصنف: 'devices', 'sim', 'papers' |
| unit | TEXT | - | الوحدة |
| quantity | INTEGER | 0 | الكمية |
| min_threshold | INTEGER | 5 | الحد الأدنى |
| technician_name | TEXT | NULL | اسم الفني |
| city | TEXT | NULL | المدينة |
| region_id | VARCHAR | NULL | معرف المنطقة (FK) |

**Indexes**:
```sql
CREATE INDEX idx_inventory_items_type ON inventory_items(type);
CREATE INDEX idx_inventory_items_region ON inventory_items(region_id);
CREATE INDEX idx_inventory_items_quantity ON inventory_items(quantity);
```

---

### 7. transactions (المعاملات)

**الغرض**: تسجيل جميع معاملات الإضافة والسحب

```sql
CREATE TABLE transactions (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id VARCHAR NOT NULL REFERENCES inventory_items(id),
  user_id VARCHAR REFERENCES users(id),
  type TEXT NOT NULL,               -- 'add' or 'withdraw'
  quantity INTEGER NOT NULL,
  reason TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**الأعمدة**:

| Column | Type | Description |
|--------|------|-------------|
| id | VARCHAR | معرف فريد |
| item_id | VARCHAR | معرف الصنف (FK) |
| user_id | VARCHAR | معرف المستخدم (FK) |
| type | TEXT | نوع العملية: 'add' أو 'withdraw' |
| quantity | INTEGER | الكمية |
| reason | TEXT | سبب العملية |
| created_at | TIMESTAMP | تاريخ العملية |

**Indexes**:
```sql
CREATE INDEX idx_transactions_item ON transactions(item_id);
CREATE INDEX idx_transactions_user ON transactions(user_id);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_created_at ON transactions(created_at);
```

---

### 8. withdrawn_devices (الأجهزة المسحوبة)

**الغرض**: تتبع الأجهزة المسحوبة من الخدمة

```sql
CREATE TABLE withdrawn_devices (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  city TEXT NOT NULL,
  technician_name TEXT NOT NULL,
  terminal_id TEXT NOT NULL,
  serial_number TEXT NOT NULL,
  battery TEXT NOT NULL,            -- 'جيدة', 'متوسطة', 'سيئة'
  charger_cable TEXT NOT NULL,      -- 'موجود', 'غير موجود'
  charger_head TEXT NOT NULL,       -- 'موجود', 'غير موجود'
  has_sim TEXT NOT NULL,            -- 'نعم', 'لا'
  sim_card_type TEXT,               -- 'Mobily', 'STC', 'غير محدد'
  damage_part TEXT,
  notes TEXT,
  created_by VARCHAR REFERENCES users(id),
  region_id VARCHAR REFERENCES regions(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**الأعمدة**:

| Column | Type | Description |
|--------|------|-------------|
| id | VARCHAR | معرف فريد |
| city | TEXT | المدينة |
| technician_name | TEXT | اسم الفني |
| terminal_id | TEXT | رقم الجهاز |
| serial_number | TEXT | الرقم التسلسلي |
| battery | TEXT | حالة البطارية |
| charger_cable | TEXT | كابل الشاحن |
| charger_head | TEXT | رأس الشاحن |
| has_sim | TEXT | وجود شريحة |
| sim_card_type | TEXT | نوع الشريحة |
| damage_part | TEXT | جزء العطل |
| notes | TEXT | ملاحظات |
| created_by | VARCHAR | من سجل الجهاز (FK) |
| region_id | VARCHAR | معرف المنطقة (FK) |

**Indexes**:
```sql
CREATE INDEX idx_withdrawn_devices_terminal ON withdrawn_devices(terminal_id);
CREATE INDEX idx_withdrawn_devices_city ON withdrawn_devices(city);
CREATE INDEX idx_withdrawn_devices_region ON withdrawn_devices(region_id);
```

---

## 🔗 العلاقات (Relationships)

### ERD Diagram

```
┌─────────────┐         ┌──────────────────────┐
│   regions   │────┬───<│        users         │
└─────────────┘    │    └──────────────────────┘
                   │              │
                   │              │ 1:1
                   │              ▼
                   │    ┌──────────────────────────────────┐
                   │    │ technician_fixed_inventories     │
                   │    └──────────────────────────────────┘
                   │              │
                   │              │ 1:N
                   │              ▼
                   │    ┌──────────────────────┐
                   ├───<│  stock_movements     │
                   │    └──────────────────────┘
                   │              
                   ├───<│  technicians_inventory│
                   │    └──────────────────────┘
                   │              
                   ├───<│  inventory_items     │
                   │    └──────────────────────┘
                   │              │
                   │              │ 1:N
                   │              ▼
                   │    ┌──────────────────────┐
                   └───<│    transactions      │
                        └──────────────────────┘
                   
┌─────────────┐         ┌──────────────────────┐
│   users     │────────<│  withdrawn_devices   │
└─────────────┘         └──────────────────────┘
                                  │
                        ┌─────────┘
                        ▼
                  ┌──────────┐
                  │ regions  │
                  └──────────┘
```

### Relationship Details

1. **users → regions** (Many to One):
   - كل مستخدم ينتمي لمنطقة واحدة
   - المنطقة يمكن أن تحتوي على عدة مستخدمين

2. **users → technician_fixed_inventories** (One to One):
   - كل فني له مخزون ثابت واحد فقط
   - المخزون الثابت يخص فني واحد فقط

3. **users → stock_movements** (One to Many):
   - المستخدم يمكنه إنشاء عدة حركات مخزون
   - كل حركة مخزون تخص مستخدم واحد

4. **regions → inventory_items** (One to Many):
   - المنطقة يمكن أن تحتوي على عدة أصناف
   - كل صنف ينتمي لمنطقة واحدة

5. **inventory_items → transactions** (One to Many):
   - الصنف يمكن أن يكون له عدة معاملات
   - كل معاملة تخص صنف واحد

6. **users → withdrawn_devices** (One to Many):
   - المستخدم يمكنه تسجيل عدة أجهزة مسحوبة
   - كل جهاز مسحوب سجله مستخدم واحد

---

## 🔐 Constraints & Rules

### Primary Keys
جميع الجداول تستخدم UUID كـ Primary Key:
```sql
id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()
```

### Foreign Keys

```sql
-- Users
region_id VARCHAR REFERENCES regions(id)

-- Technician Fixed Inventories
technician_id VARCHAR REFERENCES users(id)

-- Stock Movements
technician_id VARCHAR REFERENCES users(id)
created_by VARCHAR REFERENCES users(id)

-- Technicians Inventory
created_by VARCHAR REFERENCES users(id)
region_id VARCHAR REFERENCES regions(id)

-- Inventory Items
region_id VARCHAR REFERENCES regions(id)

-- Transactions
item_id VARCHAR REFERENCES inventory_items(id)
user_id VARCHAR REFERENCES users(id)

-- Withdrawn Devices
created_by VARCHAR REFERENCES users(id)
region_id VARCHAR REFERENCES regions(id)
```

### Unique Constraints

```sql
-- Users
UNIQUE(username)
UNIQUE(email)

-- Technician Fixed Inventories
UNIQUE(technician_id)
```

### Check Constraints

```sql
-- Users
CHECK (role IN ('admin', 'employee'))

-- Stock Movements
CHECK (movement_type IN ('transfer', 'direct_update'))
CHECK (from_inventory IN ('fixed', 'moving'))
CHECK (to_inventory IN ('fixed', 'moving'))

-- Transactions
CHECK (type IN ('add', 'withdraw'))
CHECK (quantity > 0)

-- Withdrawn Devices
CHECK (battery IN ('جيدة', 'متوسطة', 'سيئة'))
CHECK (charger_cable IN ('موجود', 'غير موجود'))
CHECK (charger_head IN ('موجود', 'غير موجود'))
CHECK (has_sim IN ('نعم', 'لا'))
```

---

## 📈 Indexes Strategy

### Performance Indexes

```sql
-- Frequently queried columns
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_region ON users(region_id);

-- Stock movements (heavy queries)
CREATE INDEX idx_stock_movements_technician ON stock_movements(technician_id);
CREATE INDEX idx_stock_movements_created_at ON stock_movements(created_at);
CREATE INDEX idx_stock_movements_type ON stock_movements(movement_type);

-- Transactions (reporting)
CREATE INDEX idx_transactions_created_at ON transactions(created_at);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_item ON transactions(item_id);
CREATE INDEX idx_transactions_user ON transactions(user_id);

-- Withdrawn devices (search)
CREATE INDEX idx_withdrawn_devices_terminal ON withdrawn_devices(terminal_id);
CREATE INDEX idx_withdrawn_devices_city ON withdrawn_devices(city);
```

### Composite Indexes

```sql
-- For complex queries
CREATE INDEX idx_transactions_date_type ON transactions(created_at, type);
CREATE INDEX idx_stock_movements_tech_date ON stock_movements(technician_id, created_at);
```

---

## 🔄 Data Flow

### 1. نقل المخزون (Transfer Flow)

```sql
-- Step 1: Check fixed inventory
SELECT * FROM technician_fixed_inventories 
WHERE technician_id = $1;

-- Step 2: Validate quantities
-- (في الكود: تحقق من توفر الكميات)

-- Step 3: Deduct from fixed
UPDATE technician_fixed_inventories
SET 
  n950_units = n950_units - $quantity,
  updated_at = NOW()
WHERE technician_id = $1;

-- Step 4: Add to moving
UPDATE technicians_inventory
SET 
  n950_devices = n950_devices + $quantity,
  updated_at = NOW()
WHERE id = $2;

-- Step 5: Record movement
INSERT INTO stock_movements (
  technician_id,
  movement_type,
  item_type,
  quantity_changed,
  from_inventory,
  to_inventory,
  reason,
  created_by
) VALUES (
  $1, 'transfer', 'n950', $quantity,
  'fixed', 'moving', $reason, $userId
);
```

### 2. التحديث المباشر (Direct Update Flow)

```sql
-- Step 1: Update moving inventory
UPDATE technicians_inventory
SET 
  n950_devices = n950_devices + $quantity,
  updated_at = NOW()
WHERE id = $1;

-- Step 2: Record movement
INSERT INTO stock_movements (
  technician_id,
  movement_type,
  item_type,
  quantity_changed,
  from_inventory,
  to_inventory,
  reason,
  created_by
) VALUES (
  $techId, 'direct_update', 'n950', $quantity,
  'moving', 'moving', $reason, $userId
);
```

---

## 🛡️ Data Integrity

### Cascade Rules

```sql
-- عند حذف منطقة
ON DELETE RESTRICT  -- لا يمكن الحذف إذا كانت هناك بيانات مرتبطة

-- عند حذف مستخدم
ON DELETE RESTRICT  -- لا يمكن الحذف إذا كان له مخزون أو معاملات

-- عند حذف صنف مخزون
ON DELETE CASCADE   -- حذف جميع المعاملات المرتبطة (غير مستخدم حالياً)
```

### Data Validation

1. **في Database**:
   - NOT NULL constraints
   - CHECK constraints
   - UNIQUE constraints
   - FOREIGN KEY constraints

2. **في Backend (Drizzle + Zod)**:
   - Schema validation
   - Custom business rules
   - Type safety

3. **في Frontend (Zod + React Hook Form)**:
   - Form validation
   - User input sanitization
   - Real-time validation

---

## 🔧 Migrations

### Using Drizzle Kit

```bash
# Push schema changes to database
npm run db:push

# Generate migrations (if needed)
npx drizzle-kit generate:pg

# Apply migrations
npx drizzle-kit push:pg
```

### Migration Safety

⚠️ **مهم جداً**:
- **لا تغير** نوع عمود ID من serial إلى varchar أو العكس
- استخدم `npm run db:push --force` للتحديث الآمن
- احفظ نسخة احتياطية قبل أي تغيير كبير

---

## 📊 Sample Queries

### 1. الحصول على المخزون مع التنبيهات

```sql
SELECT 
  u.id,
  u.full_name AS technician_name,
  u.city,
  tfi.n950_boxes,
  tfi.n950_units,
  (tfi.n950_boxes * 10 + tfi.n950_units) AS total_n950,
  CASE
    WHEN (tfi.n950_boxes * 10 + tfi.n950_units) * 100.0 / NULLIF((
      SELECT SUM(n950_boxes * 10 + n950_units) 
      FROM technician_fixed_inventories
    ), 0) > tfi.low_stock_threshold THEN 'good'
    WHEN (tfi.n950_boxes * 10 + tfi.n950_units) * 100.0 / NULLIF((
      SELECT SUM(n950_boxes * 10 + n950_units) 
      FROM technician_fixed_inventories
    ), 0) > tfi.critical_stock_threshold THEN 'warning'
    ELSE 'critical'
  END AS alert_level
FROM users u
LEFT JOIN technician_fixed_inventories tfi ON u.id = tfi.technician_id
WHERE u.role = 'employee';
```

### 2. تقرير المعاملات الشهري

```sql
SELECT 
  DATE_TRUNC('day', t.created_at) AS transaction_date,
  t.type,
  COUNT(*) AS transaction_count,
  SUM(t.quantity) AS total_quantity,
  u.full_name AS user_name,
  r.name AS region_name
FROM transactions t
LEFT JOIN users u ON t.user_id = u.id
LEFT JOIN inventory_items i ON t.item_id = i.id
LEFT JOIN regions r ON i.region_id = r.id
WHERE t.created_at >= DATE_TRUNC('month', CURRENT_DATE)
GROUP BY DATE_TRUNC('day', t.created_at), t.type, u.full_name, r.name
ORDER BY transaction_date DESC;
```

### 3. إحصائيات حركات المخزون

```sql
SELECT 
  sm.technician_id,
  u.full_name AS technician_name,
  sm.movement_type,
  sm.item_type,
  COUNT(*) AS movement_count,
  SUM(sm.quantity_changed) AS total_quantity
FROM stock_movements sm
LEFT JOIN users u ON sm.technician_id = u.id
WHERE sm.created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY sm.technician_id, u.full_name, sm.movement_type, sm.item_type
ORDER BY movement_count DESC;
```

### 4. الفنيين ذوي المخزون المنخفض

```sql
SELECT 
  u.id,
  u.full_name,
  u.city,
  tfi.n950_boxes,
  tfi.n950_units,
  (tfi.n950_boxes * 10 + tfi.n950_units) AS total_n950
FROM users u
INNER JOIN technician_fixed_inventories tfi ON u.id = tfi.technician_id
WHERE 
  u.role = 'employee' AND
  (tfi.n950_boxes * 10 + tfi.n950_units) < 10
ORDER BY total_n950 ASC;
```

---

## 🔒 Security Considerations

### Password Storage
```sql
-- كلمات المرور مشفرة باستخدام bcrypt
-- لا تُخزن أبداً بنص واضح
UPDATE users 
SET password = crypt('password', gen_salt('bf'))
WHERE id = $1;
```

### Row-Level Security (RLS)

```sql
-- Future: يمكن تفعيل RLS للحماية الإضافية
ALTER TABLE technicians_inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY technician_own_inventory ON technicians_inventory
FOR SELECT
USING (created_by = current_user_id());
```

### Audit Trail

جميع الجداول تحتوي على:
- `created_at`: متى تم الإنشاء
- `updated_at`: متى تم آخر تحديث
- `created_by`: من قام بالإنشاء (في بعض الجداول)

---

## 📝 Maintenance Tasks

### Daily
- Backup database
- Monitor slow queries
- Check error logs

### Weekly  
- Analyze query performance
- Update statistics: `ANALYZE;`
- Check index usage

### Monthly
- Vacuum database: `VACUUM ANALYZE;`
- Review and optimize indexes
- Archive old transactions (if needed)

### Commands

```sql
-- Analyze table
ANALYZE users;

-- Vacuum and analyze
VACUUM ANALYZE;

-- Check table size
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check index usage
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan ASC;
```

---

**نهاية توثيق قاعدة البيانات**
