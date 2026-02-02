/**
 * Item Types controller
 */

import type { Request, Response } from "express";
import { storage } from "../storage";
import { asyncHandler } from "../middleware/errorHandler";
import { validateBody } from "../middleware/validation";
import { z } from "zod";
import { NotFoundError, ConflictError } from "../utils/errors";

const createItemTypeSchema = z.object({
  id: z.string().optional(),
  nameAr: z.string().min(1),
  nameEn: z.string().min(1),
  category: z.enum(["devices", "papers", "sim", "accessories"]),
  unitsPerBox: z.number().int().positive(),
  isActive: z.boolean().optional().default(true),
  isVisible: z.boolean().optional().default(true),
  sortOrder: z.number().int().optional().default(0),
  icon: z.string().optional(),
  color: z.string().optional(),
});

const updateItemTypeSchema = z.object({
  nameAr: z.string().min(1).optional(),
  nameEn: z.string().min(1).optional(),
  category: z.enum(["devices", "papers", "sim", "accessories"]).optional(),
  unitsPerBox: z.number().int().positive().optional(),
  isActive: z.boolean().optional(),
  isVisible: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
});

const toggleActiveSchema = z.object({
  isActive: z.boolean(),
});

const toggleVisibilitySchema = z.object({
  isVisible: z.boolean(),
});

export class ItemTypesController {
  /**
   * GET /api/item-types
   * Get all item types (admin view - shows all including inactive)
   */
  getAll = asyncHandler(async (req: Request, res: Response) => {
    const types = await storage.getItemTypes();
    res.json(types);
  });

  /**
   * GET /api/item-types/active
   * Get active item types only
   */
  getActive = asyncHandler(async (req: Request, res: Response) => {
    const types = await storage.getActiveItemTypes();
    res.json(types);
  });

  /**
   * GET /api/item-types/:id
   * Get single item type
   */
  getById = asyncHandler(async (req: Request, res: Response) => {
    const type = await storage.getItemTypeById(req.params.id);
    if (!type) {
      throw new NotFoundError("Item type not found");
    }
    res.json(type);
  });

  /**
   * POST /api/item-types
   * Create new item type
   */
  create = asyncHandler(async (req: Request, res: Response) => {
    const data = createItemTypeSchema.parse(req.body);

    // Check if ID already exists (only if ID was provided)
    if (data.id) {
      const existing = await storage.getItemTypeById(data.id);
      if (existing) {
        throw new ConflictError("Item type ID already exists");
      }
    }

    const type = await storage.createItemType(data);
    res.status(201).json(type);
  });

  /**
   * PATCH /api/item-types/:id
   * Update item type
   */
  update = asyncHandler(async (req: Request, res: Response) => {
    const data = updateItemTypeSchema.parse(req.body);
    const type = await storage.updateItemType(req.params.id, data);

    if (!type) {
      throw new NotFoundError("Item type not found");
    }

    res.json(type);
  });

  /**
   * PATCH /api/item-types/:id/toggle-active
   * Toggle item type active status
   */
  toggleActive = asyncHandler(async (req: Request, res: Response) => {
    const { isActive } = toggleActiveSchema.parse(req.body);
    const type = await storage.toggleItemTypeActive(req.params.id, isActive);

    if (!type) {
      throw new NotFoundError("Item type not found");
    }

    res.json(type);
  });

  /**
   * PATCH /api/item-types/:id/toggle-visibility
   * Toggle item type visibility
   */
  toggleVisibility = asyncHandler(async (req: Request, res: Response) => {
    const { isVisible } = toggleVisibilitySchema.parse(req.body);
    const type = await storage.toggleItemTypeVisibility(req.params.id, isVisible);

    if (!type) {
      throw new NotFoundError("Item type not found");
    }

    res.json(type);
  });

  /**
   * DELETE /api/item-types/:id
   * Delete item type (soft delete)
   */
  delete = asyncHandler(async (req: Request, res: Response) => {
    // Soft delete by setting isActive to false
    const type = await storage.toggleItemTypeActive(req.params.id, false);

    if (!type) {
      throw new NotFoundError("Item type not found");
    }

    res.json({ success: true, message: "Item type disabled successfully" });
  });

  /**
   * POST /api/item-types/seed
   * Seed default item types
   */
  seed = asyncHandler(async (req: Request, res: Response) => {
    await storage.seedDefaultItemTypes();
    res.json({ success: true, message: "Default item types seeded successfully" });
  });
}

export const itemTypesController = new ItemTypesController();
