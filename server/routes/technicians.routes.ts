/**
 * Technicians routes
 */

import type { Express } from "express";
import { techniciansController } from "../controllers/technicians.controller";
import { requireAuth, requireSupervisor } from "../middleware/auth";
import { validateBody } from "../middleware/validation";
import { z } from "zod";

const stockTransferSchema = z.object({
  technicianId: z.string(),
  itemType: z.string(),
  packagingType: z.enum(["box", "unit"]),
  quantity: z.number().positive(),
  fromInventory: z.enum(["fixed", "moving"]),
  toInventory: z.enum(["fixed", "moving"]),
  reason: z.string().optional(),
  notes: z.string().optional(),
});

const inventoryEntrySchema = z.object({
  itemTypeId: z.string(),
  boxes: z.number().min(0),
  units: z.number().min(0),
});

export function registerTechniciansRoutes(app: Express): void {
  // Get all technicians
  app.get("/api/technicians", requireAuth, techniciansController.getAll);

  // Get supervisor's technicians
  app.get(
    "/api/supervisor/technicians",
    requireAuth,
    requireSupervisor,
    techniciansController.getSupervisorTechnicians
  );

  // Get single technician
  app.get("/api/technicians/:id", requireAuth, techniciansController.getById);

  // Get my fixed inventory
  app.get(
    "/api/my-fixed-inventory",
    requireAuth,
    techniciansController.getMyFixedInventory
  );

  // Get my moving inventory
  app.get(
    "/api/my-moving-inventory",
    requireAuth,
    techniciansController.getMyMovingInventory
  );

  // Get technician's fixed inventory
  app.get(
    "/api/technician-fixed-inventory/:technicianId",
    requireAuth,
    techniciansController.getFixedInventory
  );

  // Update technician's fixed inventory
  app.put(
    "/api/technician-fixed-inventory/:technicianId",
    requireAuth,
    techniciansController.updateFixedInventory
  );

  // Delete technician's fixed inventory
  app.delete(
    "/api/technician-fixed-inventory/:technicianId",
    requireAuth,
    techniciansController.deleteFixedInventory
  );

  // Get stock movements
  app.get(
    "/api/stock-movements",
    requireAuth,
    techniciansController.getStockMovements
  );

  // Transfer stock
  app.post(
    "/api/stock-transfer",
    requireAuth,
    validateBody(stockTransferSchema),
    techniciansController.transferStock
  );

  // Get technician's fixed inventory entries
  app.get(
    "/api/technicians/:technicianId/fixed-inventory-entries",
    requireAuth,
    techniciansController.getFixedInventoryEntries
  );

  // Upsert technician's fixed inventory entry
  app.post(
    "/api/technicians/:technicianId/fixed-inventory-entries",
    requireAuth,
    validateBody(inventoryEntrySchema),
    techniciansController.upsertFixedInventoryEntry
  );

  // Get technician's moving inventory entries
  app.get(
    "/api/technicians/:technicianId/moving-inventory-entries",
    requireAuth,
    techniciansController.getMovingInventoryEntries
  );

  // Upsert technician's moving inventory entry (supports both single and batch)
  app.post(
    "/api/technicians/:technicianId/moving-inventory-entries",
    requireAuth,
    techniciansController.upsertMovingInventoryEntry
  );

  // Get all technicians with inventories (admin)
  app.get(
    "/api/admin/all-technicians-inventory",
    requireAuth,
    requireSupervisor,
    techniciansController.getAllTechniciansInventory
  );

  // Get supervisor's technicians with inventories
  app.get(
    "/api/supervisor/technicians-inventory",
    requireAuth,
    requireSupervisor,
    techniciansController.getSupervisorTechniciansInventory
  );
}
