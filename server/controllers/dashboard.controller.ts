/**
 * Dashboard controller
 */

import type { Request, Response } from "express";
import { storage } from "../storage";
import { asyncHandler } from "../middleware/errorHandler";

export class DashboardController {
  /**
   * GET /api/dashboard
   * Get dashboard statistics
   */
  getStats = asyncHandler(async (req: Request, res: Response) => {
    const stats = await storage.getDashboardStats();
    res.json(stats);
  });

  /**
   * GET /api/admin/stats
   * Get admin statistics
   */
  getAdminStats = asyncHandler(async (req: Request, res: Response) => {
    const stats = await storage.getAdminStats();
    res.json(stats);
  });
}

export const dashboardController = new DashboardController();
