# Inventory Management System

## Overview

This is a comprehensive inventory management system built with React on the frontend and Express.js on the backend. The application provides real-time inventory tracking, stock management, and transaction monitoring for various types of items including devices, SIM cards, and papers. The system features an Arabic-language interface with modern UI components and supports operations like adding stock, withdrawing items, and generating reports.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety and modern development
- **UI Framework**: Radix UI components with shadcn/ui for consistent, accessible design system
- **Styling**: Tailwind CSS with custom CSS variables for theming support
- **State Management**: TanStack React Query for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation for type-safe form management
- **Build Tool**: Vite for fast development and optimized production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **API Design**: RESTful API with comprehensive CRUD operations for inventory and transactions
- **Data Validation**: Zod schemas shared between frontend and backend for consistent validation
- **Development Setup**: Hot module replacement with Vite integration for seamless development experience

### Database Design
- **ORM**: Drizzle ORM with PostgreSQL dialect for robust database operations
- **Schema**: Two main tables - inventory_items and transactions with proper foreign key relationships
- **Data Types**: Structured data with UUID primary keys, timestamps, and proper indexing
- **Migrations**: Managed through Drizzle Kit for version-controlled database changes

### Component Architecture
- **Design System**: Comprehensive shadcn/ui component library with 30+ pre-built components
- **Modular Components**: Reusable components for inventory tables, modals, sidebars, and forms
- **Responsive Design**: Mobile-first approach with responsive layouts and touch-friendly interfaces
- **Accessibility**: Built on Radix UI primitives ensuring WCAG compliance

### State Management Pattern
- **Server State**: TanStack React Query for API data fetching, caching, and synchronization
- **Client State**: React hooks for local component state management
- **Form State**: React Hook Form for complex form state and validation
- **Global State**: Context API for application-wide state like themes and user preferences

## External Dependencies

### Database Services
- **Neon Database**: Serverless PostgreSQL hosting with `@neondatabase/serverless` driver
- **Connection Pooling**: Built-in connection management for production environments

### UI and Styling
- **Radix UI**: Complete set of accessible, unstyled UI primitives
- **Tailwind CSS**: Utility-first CSS framework with custom design tokens
- **Lucide React**: Modern icon library with 1000+ consistent icons
- **Google Fonts**: Noto Sans Arabic and other web fonts for internationalization

### Development Tools
- **TypeScript**: Static type checking across the entire application stack
- **ESBuild**: Fast bundling for production server builds
- **PostCSS**: CSS processing with Tailwind CSS and Autoprefixer
- **Replit Integration**: Development plugins for Replit environment optimization

### Form and Validation
- **React Hook Form**: Performant form library with minimal re-renders
- **Zod**: TypeScript-first schema validation library
- **Hookform Resolvers**: Integration layer between React Hook Form and Zod

### Data Fetching
- **TanStack React Query**: Powerful data synchronization for React applications
- **Native Fetch API**: Modern HTTP client for API communications

## Recent Changes (January 31, 2026)

### Dynamic Item Types Management System

The inventory system now supports **dynamic item types** that can be added, edited, enabled/disabled, and shown/hidden through an admin interface. New item types automatically appear across all pages and modals.

#### Architecture
- **Database Schema**: Normalized design with `item_types` table containing all item type definitions
- **Entry Tables**: Three normalized entry tables with foreign keys:
  - `warehouse_inventory_entries` (warehouseId, itemTypeId, boxes, units)
  - `technician_fixed_inventory_entries` (technicianId, itemTypeId, boxes, units)
  - `technician_moving_inventory_entries` (technicianId, itemTypeId, boxes, units)
- **Legacy Compatibility**: Dual-write pattern maintains legacy columns during transition

#### Key Files
- `shared/schema.ts`: Database schema with itemTypes and entry tables
- `server/database-storage.ts`: Storage methods with upsert operations for entries
- `server/routes.ts`: API endpoints for CRUD operations on item types and entries
- `client/src/hooks/use-item-types.ts`: React hook with `useActiveItemTypes()` and `buildInventoryDisplayItems()` helper

#### Pages Updated for Dynamic Item Types
- `warehouse-details.tsx` - Uses dynamic item types with entries
- `my-fixed-inventory.tsx` - Uses dynamic item types with entries
- `my-moving-inventory.tsx` - Uses dynamic item types with entries
- `technician-details.tsx` - Uses dynamic item types with entries

#### Modals Updated for Dynamic Item Types
- `update-warehouse-inventory-modal.tsx` - Dynamic with dual-write
- `transfer-from-warehouse-modal.tsx` - Dynamic with dual-write
- `edit-fixed-inventory-modal.tsx` - Dynamic with dual-write
- `update-moving-inventory-modal.tsx` - Dynamic with dual-write
- `transfer-to-moving-modal.tsx` - Dynamic with dual-write

#### How to Add New Item Types (Admin)
1. Use the admin interface to add a new item type via the item_types table
2. The new item type will automatically appear on all display pages
3. All modals will show the new item type for inventory updates
4. No code changes required for new item types

#### Legacy Field Mapping
For backward compatibility, the system maps legacy columns to dynamic item types:
```
n950 -> n950Boxes, n950Units
i9000s -> i9000sBoxes, i9000sUnits
i9100 -> i9100Boxes, i9100Units
rollPaper -> rollPaperBoxes, rollPaperUnits
stickers -> stickersBoxes, stickersUnits
newBatteries -> newBatteriesBoxes, newBatteriesUnits
mobilySim -> mobilySimBoxes, mobilySimUnits
stcSim -> stcSimBoxes, stcSimUnits
zainSim -> zainSimBoxes, zainSimUnits
lebaraSim -> lebaraBoxes, lebaraUnits
```

#### Current Item Types
- **Devices**: N950, I9000S, I9100
- **Papers**: Roll Paper, Stickers
- **Accessories**: New Batteries
- **SIM Cards**: Mobily SIM, STC SIM, Zain SIM, Lebara SIM

#### Known Limitations (Future Work)
1. **Excel Exports**: The exportToExcel functions still use hardcoded columns; new dynamic item types will not appear in exports until these are updated
2. **Data Migration**: No automatic backfill from legacy columns to entry tables; entries are created on first update via modals