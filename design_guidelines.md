# StockPro - دليل التصميم الموحد

## الهوية البصرية

### الألوان الأساسية
- **اللون الأساسي**: #18B2B0 (Teal/Turquoise) - احترافي وحديث
- **Hover State**: #16a09e
- **Gradient Primary**: from-[#18B2B0] via-teal-500 to-cyan-500
- **Gradient Secondary**: from-slate-900 via-purple-900 to-slate-900

### ألوان الحالات
- **Success**: #10B981 (Green)
- **Warning**: #F59E0B (Amber)
- **Error**: #EF4444 (Red)
- **Info**: #3B82F6 (Blue)

## مكونات التصميم

### 1. البانر العلوي (Hero Banner)
```
- Background: gradient-to-r from-cyan-500 via-blue-600 to-purple-600
- Height: h-80 to h-96
- Shadow: shadow-2xl
- Animation: Animated background shapes with framer-motion
- Content: Logo + Title + Description + Action Button
- Bottom wave decoration
```

### 2. البطاقات (Cards)
```
- Background: bg-gradient-to-br from-slate-800/90 to-slate-900/90
- Backdrop: backdrop-blur-xl
- Border: border-2 border-cyan-500/30 أو border-[#18B2B0]/30
- Shadow: shadow-2xl
- Rounded: rounded-xl أو rounded-2xl
- Padding: p-6 أو p-8
- Hover: hover:shadow-2xl transition-all duration-300 hover:-translate-y-1
```

### 3. الأزرار (Buttons)
```
Primary:
- bg-gradient-to-r from-[#18B2B0] to-teal-500
- hover:from-[#16a09e] hover:to-teal-600
- text-white font-bold shadow-lg
- rounded-lg px-6 py-2.5

Secondary:
- bg-gradient-to-r from-blue-600 to-cyan-600
- hover:from-blue-700 hover:to-cyan-700

Danger:
- bg-gradient-to-r from-red-600 to-rose-600
- hover:from-red-700 hover:to-rose-700
```

### 4. KPI Cards (بطاقات المؤشرات)
```
- Gradient backgrounds: from-[color]-500 via-[color]-600 to-[color2]-500
- Icon in colored circle: bg-white/20 backdrop-blur-sm p-4 rounded-2xl
- White text: text-white
- Animation: hover:shadow-2xl transition-all duration-300 hover:-translate-y-1
```

### 5. الجداول (Tables)
```
- Background: bg-white/5 backdrop-blur-sm
- Header: bg-gradient-to-r from-[#18B2B0]/20 to-transparent
- Border: border-cyan-500/30
- Hover: hover:bg-white/10
- Text: text-white
```

### 6. Forms & Inputs
```
- Background: bg-slate-800/50 backdrop-blur-sm
- Border: border-cyan-500/30 focus:border-[#18B2B0]
- Text: text-white
- Labels: text-cyan-400 font-medium
```

## الانيميشنز (Animations)

### Framer Motion Patterns
```
- Page entrance: initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
- Stagger delay: delay={0.1 * index}
- Hover scale: whileHover={{ scale: 1.05 }}
- Tap feedback: whileTap={{ scale: 0.95 }}
- Floating elements: animate={{ y: [0, -10, 0] }} transition={{ duration: 3, repeat: Infinity }}
```

## Layout Patterns

### صفحة Admin
```
1. Hero Banner (h-96)
2. Stats Grid (4 columns - gradient KPI cards)
3. Tabs Section
   - Dashboard Tab: KPI cards + Charts
   - Regions Tab: Table + CRUD
   - Users Tab: Table + CRUD
   - Transactions Tab: List
```

### صفحة Warehouses
```
1. Hero Banner (h-80)
2. Stats Overview (3-4 KPI cards)
3. Warehouses Grid (responsive cards)
4. Actions: Create/Edit/View modals
```

### صفحة My Fixed Inventory
```
1. Hero Banner (h-80) مع Logos و Device Image
2. Personal Analytics:
   - 3 KPI Cards (Total/Devices/SIMs)
   - Pie Chart (Stock Distribution)
3. Action Buttons Row
4. Inventory Items Grid (gradient cards)
```

## الخطوط (Typography)

- **Font Family**: 'Noto Sans Arabic', 'Cairo', sans-serif
- **Headings**: font-black أو font-bold
- **Body**: font-normal أو font-medium
- **RTL Direction**: dir="rtl" على كل صفحة

## Responsive Design

```
Mobile (< 768px):
- grid-cols-1
- Full width buttons
- Stacked layout

Tablet (768px - 1024px):
- grid-cols-2
- Two column forms

Desktop (> 1024px):
- grid-cols-4 (Stats)
- grid-cols-3 (Cards)
- Full features visible
```

## Dark Theme

جميع الصفحات تستخدم:
- Background: bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900
- Text: text-white
- Cards: Semi-transparent dark cards مع backdrop-blur
- Borders: Colored borders (#18B2B0) مع opacity

## Accessibility

- data-testid على كل عنصر تفاعلي
- ARIA labels بالعربية
- Focus states واضحة
- Keyboard navigation
- High contrast في الـ dark theme
