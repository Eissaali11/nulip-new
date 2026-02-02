/**
 * Technicians controller
 */

import type { Request, Response } from "express";
import { storage } from "../storage";
import { asyncHandler } from "../middleware/errorHandler";
import { NotFoundError } from "../utils/errors";
import { z } from "zod";

export class TechniciansController {
  /**
   * GET /api/technicians
   * Get all technicians
   */
  getAll = asyncHandler(async (req: Request, res: Response) => {
    const user = req.user!;
    let technicians;

    if (user.role === "supervisor") {
      // Get only assigned technicians for supervisor
      technicians = await storage.getSupervisorTechnicians(user.id);
    } else {
      // Admin gets all
      const users = await storage.getUsers();
      technicians = users.filter((u) => u.role === "technician");
    }

    res.json(technicians);
  });

  /**
   * GET /api/supervisor/technicians
   * Get supervisor's assigned technicians
   */
  getSupervisorTechnicians = asyncHandler(async (req: Request, res: Response) => {
    const user = req.user!;
    const technicians = await storage.getSupervisorTechnicians(user.id);
    res.json(technicians);
  });

  /**
   * GET /api/technicians/:id
   * Get single technician details
   */
  getById = asyncHandler(async (req: Request, res: Response) => {
    const technician = await storage.getUser(req.params.id);
    if (!technician) {
      throw new NotFoundError("Technician not found");
    }
    res.json(technician);
  });

  /**
   * GET /api/my-fixed-inventory
   * Get technician's fixed inventory
   */
  getMyFixedInventory = asyncHandler(async (req: Request, res: Response) => {
    const user = req.user!;
    const inventory = await storage.getTechnicianFixedInventory(user.id);
    res.json(inventory);
  });

  /**
   * GET /api/my-moving-inventory
   * Get technician's moving inventory (legacy + dynamic entries)
   */
  getMyMovingInventory = asyncHandler(async (req: Request, res: Response) => {
    const user = req.user!;
    // Get legacy moving inventory
    const legacyInventory = await storage.getTechnicianInventory(user.id);
    // Get dynamic entries
    const entries = await storage.getTechnicianMovingInventoryEntries(user.id);
    
    res.json({
      ...legacyInventory,
      entries,
    });
  });

  /**
   * GET /api/technician-fixed-inventory/:technicianId
   * Get technician's fixed inventory
   */
  getFixedInventory = asyncHandler(async (req: Request, res: Response) => {
    const inventory = await storage.getTechnicianFixedInventory(
      req.params.technicianId
    );
    res.json(inventory);
  });

  /**
   * PUT /api/technician-fixed-inventory/:technicianId
   * Update technician's fixed inventory
   */
  updateFixedInventory = asyncHandler(async (req: Request, res: Response) => {
    const user = req.user!;
    const updates = req.body;
    const inventory = await storage.updateTechnicianFixedInventory(
      req.params.technicianId,
      updates
    );

    // Log the activity
    await storage.logSystemActivity({
      userId: user.id,
      userName: user.username,
      userRole: user.role,
      regionId: null,
      action: "update",
      entityType: "inventory",
      entityId: req.params.technicianId,
      entityName: "المخزون الثابت",
      description: `تم تحديث المخزون الثابت للفني`,
      severity: "info",
      success: true,
    });

    res.json(inventory);
  });

  /**
   * DELETE /api/technician-fixed-inventory/:technicianId
   * Delete technician's fixed inventory
   */
  deleteFixedInventory = asyncHandler(async (req: Request, res: Response) => {
    await storage.deleteTechnicianFixedInventory(req.params.technicianId);
    res.json({ message: "Fixed inventory deleted successfully" });
  });

  /**
   * GET /api/stock-movements
   * Get stock movements
   */
  getStockMovements = asyncHandler(async (req: Request, res: Response) => {
    const { technicianId, limit } = req.query;
    const movements = await storage.getStockMovements(
      technicianId as string | undefined,
      limit ? parseInt(limit as string) : undefined
    );
    res.json(movements);
  });

  /**
   * POST /api/stock-transfer
   * Transfer stock between inventories
   */
  transferStock = asyncHandler(async (req: Request, res: Response) => {
    const user = req.user!;
    const schema = z.object({
      technicianId: z.string(),
      itemType: z.string(),
      packagingType: z.enum(["box", "unit"]),
      quantity: z.number().positive(),
      fromInventory: z.enum(["fixed", "moving"]),
      toInventory: z.enum(["fixed", "moving"]),
      reason: z.string().optional(),
      notes: z.string().optional(),
    });

    const data = schema.parse(req.body);
    const result = await storage.transferStock({
      ...data,
      performedBy: user.id,
    });

    // Log the activity
    await storage.logSystemActivity({
      userId: user.id,
      userName: user.username,
      userRole: user.role,
      regionId: null,
      action: "transfer",
      entityType: "inventory",
      entityId: data.technicianId,
      entityName: data.itemType,
      description: `تم نقل ${data.quantity} ${data.packagingType} من ${data.fromInventory} إلى ${data.toInventory}`,
      severity: "info",
      success: true,
    });

    res.json(result);
  });

  /**
   * GET /api/technicians/:technicianId/fixed-inventory-entries
   * Get technician's fixed inventory entries
   */
  getFixedInventoryEntries = asyncHandler(async (req: Request, res: Response) => {
    const entries = await storage.getTechnicianFixedInventoryEntries(
      req.params.technicianId
    );
    res.json(entries);
  });

  /**
   * POST /api/technicians/:technicianId/fixed-inventory-entries
   * Upsert technician's fixed inventory entry
   */
  upsertFixedInventoryEntry = asyncHandler(async (req: Request, res: Response) => {
    const schema = z.object({
      itemTypeId: z.string(),
      boxes: z.number().min(0),
      units: z.number().min(0),
    });
    const data = schema.parse(req.body);
    const entry = await storage.upsertTechnicianFixedInventoryEntry(
      req.params.technicianId,
      data.itemTypeId,
      data.boxes,
      data.units
    );
    res.json(entry);
  });

  /**
   * GET /api/technicians/:technicianId/moving-inventory-entries
   * Get technician's moving inventory entries
   */
  getMovingInventoryEntries = asyncHandler(async (req: Request, res: Response) => {
    const entries = await storage.getTechnicianMovingInventoryEntries(
      req.params.technicianId
    );
    res.json(entries);
  });

  /**
   * POST /api/technicians/:technicianId/moving-inventory-entries
   * Upsert technician's moving inventory entry (supports single or batch)
   */
  upsertMovingInventoryEntry = asyncHandler(async (req: Request, res: Response) => {
    const singleSchema = z.object({
      itemTypeId: z.string(),
      boxes: z.number().min(0),
      units: z.number().min(0),
    });
    
    const batchSchema = z.object({
      entries: z.array(singleSchema),
    });
    
    const { technicianId } = req.params;
    
    // Check if it's a batch request with { entries: [...] }
    if (req.body.entries && Array.isArray(req.body.entries)) {
      const { entries } = batchSchema.parse(req.body);
      const results = [];
      for (const entry of entries) {
        const result = await storage.upsertTechnicianMovingInventoryEntry(
          technicianId,
          entry.itemTypeId,
          entry.boxes,
          entry.units
        );
        results.push(result);
      }
      return res.json(results);
    }
    
    // Single entry format
    const data = singleSchema.parse(req.body);
    const entry = await storage.upsertTechnicianMovingInventoryEntry(
      technicianId,
      data.itemTypeId,
      data.boxes,
      data.units
    );
    res.json(entry);
  });

  /**
   * GET /api/admin/all-technicians-inventory
   * Get all technicians with both inventories (admin)
   */
  getAllTechniciansInventory = asyncHandler(async (req: Request, res: Response) => {
    const technicians = await storage.getAllTechniciansWithBothInventories();
    res.json({ technicians });
  });

  /**
   * GET /api/supervisor/technicians-inventory
   * Get supervisor's technicians with inventories
   */
  getSupervisorTechniciansInventory = asyncHandler(
    async (req: Request, res: Response) => {
      const user = req.user!;
      
      // If admin, return all technicians
      if (user.role === 'admin') {
        const technicians = await storage.getAllTechniciansWithBothInventories();
        return res.json({ technicians });
      }
      
      // For supervisors, check regionId
      if (!user.regionId) {
        return res.status(400).json({ 
          success: false,
          message: "المشرف يجب أن يكون مرتبط بمنطقة لعرض البيانات" 
        });
      }
      
      const technicians = await storage.getRegionTechniciansWithInventories(
        user.regionId
      );
      res.json({ technicians });
    }
  );
}

export const techniciansController = new TechniciansController();
