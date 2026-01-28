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

## Recent Changes (January 28, 2026)

### Added Lebara SIM Item Type
- Added Lebara SIM as a new item type across the entire inventory management system
- Updated all modals: edit-technician-fixed-inventory-modal, update-warehouse-inventory-modal, request-inventory-modal, transfer-from-warehouse-modal
- Updated all pages: warehouse-details, technician-details, my-fixed-inventory, my-moving-inventory
- Updated exportToExcel.ts to include Lebara in all Excel reports
- Added Lebara to shared/itemTypes.ts configuration

### Item Types Configuration
The system uses a centralized item types configuration in `shared/itemTypes.ts`. When adding a new item type:
1. Add the item definition to `ITEM_TYPES` array in itemTypes.ts
2. Add database columns (`${itemId}Boxes` and `${itemId}Units`) to relevant tables in schema.ts
3. Run `npm run db:push` to apply schema changes
4. Update all modals and pages that display inventory items
5. Update exportToExcel.ts for Excel report generation

### Current Item Types
- Devices: N950, I9000S, I9100
- Papers: Roll Paper, Stickers
- Accessories: New Batteries
- SIM Cards: Mobily SIM, STC SIM, Zain SIM, Lebara SIM