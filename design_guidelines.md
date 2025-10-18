# نظام إدارة المخزون - Design Guidelines

## Design Approach
**System-Based Approach**: Material Design + Carbon Design System hybrid
**Rationale**: Utility-focused inventory management requires data clarity, efficient workflows, and enterprise-grade UI patterns. Material's visual feedback combined with Carbon's data-handling excellence creates optimal admin interface.

---

## Core Design Elements

### A. Color Palette

**Light Mode:**
- Primary Blue: 210 95% 45% (professional, trustworthy)
- Primary Hover: 210 95% 38%
- Background: 0 0% 98%
- Surface: 0 0% 100%
- Border: 220 13% 91%
- Text Primary: 220 15% 15%
- Text Secondary: 220 9% 46%

**Dark Mode:**
- Primary Blue: 210 90% 55%
- Primary Hover: 210 90% 62%
- Background: 222 47% 11%
- Surface: 217 33% 17%
- Border: 217 20% 25%
- Text Primary: 210 40% 98%
- Text Secondary: 217 10% 70%

**Status Colors (Both Modes):**
- Success: 142 76% 36% / 142 71% 45%
- Warning: 38 92% 50% / 43 96% 56%
- Error: 0 84% 60% / 0 72% 51%
- Info: 199 89% 48% / 199 89% 60%

### B. Typography (RTL)

**Font Family**: 'Cairo', 'Tajawal', sans-serif (Google Fonts)

**Scale:**
- H1: text-3xl font-bold (إدارة المخزون)
- H2: text-2xl font-semibold (عناوين الصفحات)
- H3: text-xl font-semibold (عناوين الأقسام)
- Body: text-base font-normal
- Small: text-sm
- Label: text-sm font-medium

**RTL Considerations**: Direction RTL, text alignment right by default

### C. Layout System

**Spacing Primitives**: Use Tailwind units: 2, 3, 4, 6, 8, 12, 16, 20
- Component padding: p-4, p-6
- Section spacing: space-y-6, space-y-8
- Card gaps: gap-4, gap-6
- Table cell padding: px-4 py-3

**Grid Structure**: 
- Sidebar: w-64 (navigation)
- Main content: flex-1 with max-w-7xl
- Dashboard cards: grid-cols-1 md:grid-cols-2 lg:grid-cols-4

### D. Component Library

**Navigation Sidebar:**
- Fixed right-side (RTL)
- Logo + app name at top
- Icon + label menu items
- Active state: bg-blue with subtle glow
- Collapsible on mobile (hamburger top-right)

**Data Tables:**
- Striped rows (subtle alternating background)
- Hover state: light highlight
- Sortable headers (chevron icons)
- Row actions: icon buttons (edit, delete, view)
- Pagination: bottom with page numbers
- Search + filters above table
- Borders: subtle, not heavy

**Forms:**
- Labels above inputs (right-aligned)
- Input fields: rounded-lg, border, bg-surface
- Focus state: blue border ring
- Helper text below inputs
- Required field indicators (*)
- Submit buttons: primary blue, full-width on mobile
- Form sections with clear dividers

**Buttons:**
- Primary: bg-primary text-white rounded-lg px-6 py-2.5
- Secondary: border-2 border-primary text-primary
- Danger: bg-error text-white
- Icon buttons: p-2 rounded-lg hover:bg-surface
- Button groups: flex gap-2

**Cards:**
- Rounded corners: rounded-xl
- Shadow: subtle elevation
- Header with title + actions
- Padding: p-6
- Dividers between sections

**Stats/Metrics Cards:**
- Icon + number + label + trend indicator
- Color-coded by category
- Grid layout: 2x2 or 4x1

**Modals/Dialogs:**
- Overlay: bg-black/50 backdrop-blur-sm
- Content: centered, max-w-lg
- Header: title + close button
- Footer: action buttons (right-aligned in RTL)

**Toasts/Alerts:**
- Top-center positioning
- Color-coded by type
- Icon + message + close button
- Auto-dismiss after 5s

### E. Interactions

**Minimal Animations:**
- Page transitions: fade-in only
- Hover states: subtle color shift
- Loading: simple spinner
- No complex scroll effects
- Focus visible for accessibility

---

## Page-Specific Layouts

**Dashboard:**
- Stats cards grid (4 metrics)
- Recent activity table
- Quick actions section
- Low stock alerts panel

**Inventory List:**
- Search + filter toolbar
- Data table (item, SKU, quantity, location, status)
- Bulk actions dropdown
- Add item button (top-left in RTL)

**Add/Edit Item Form:**
- Two-column layout on desktop
- Sections: Basic Info, Pricing, Stock, Images
- Save + Cancel buttons at bottom
- Validation feedback inline

**Reports Page:**
- Date range picker
- Report type selector
- Charts (bar, line for trends)
- Export button (PDF, Excel)

---

## RTL Implementation Notes

- All flex/grid items flow right-to-left
- Icons positioned on right side of text
- Menus open from right edge
- Dropdowns align to right
- Chevrons point left for "next"
- Form labels right-aligned
- Number inputs maintain LTR for numerals

---

## Dark Mode Strategy

- Toggle in header (sun/moon icon)
- Persistent preference (localStorage)
- All components use CSS variables
- Reduced contrast to prevent eye strain
- Form inputs with visible but subtle borders
- Tables maintain readability with proper contrast

---

## Accessibility

- ARIA labels in Arabic
- Keyboard navigation support
- Focus indicators visible in both modes
- Color contrast ratios meet WCAG AA
- Screen reader friendly table markup
- Form error announcements