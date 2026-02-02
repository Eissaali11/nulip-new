/**
 * Transactions controller
 */

import type { Request, Response } from "express";
import { storage } from "../storage";
import { asyncHandler } from "../middleware/errorHandler";
import { z } from "zod";

const transactionFiltersSchema = z.object({
  page: z.string().optional().transform((val) => (val ? parseInt(val) : undefined)),
  limit: z.string().optional().transform((val) => (val ? parseInt(val) : undefined)),
  type: z.string().optional(),
  userId: z.string().optional(),
  regionId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  search: z.string().optional(),
  recent: z.string().optional(),
});

const transactionStatisticsSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  regionId: z.string().optional(),
});

export class TransactionsController {
  /**
   * GET /api/transactions
   * Get transactions with filters
   */
  getAll = asyncHandler(async (req: Request, res: Response) => {
    const query = transactionFiltersSchema.parse(req.query);

    // If recent=true, use the simple method
    if (query.recent === "true") {
      const limitNum = query.limit || 10;
      const transactions = await storage.getRecentTransactions(limitNum);
      return res.json(transactions);
    }

    // Use the enhanced method with filters
    const filters: any = {
      page: query.page,
      limit: query.limit,
      type: query.type,
      userId: query.userId,
      regionId: query.regionId,
      startDate: query.startDate,
      endDate: query.endDate,
      search: query.search,
    };

    // Remove undefined filters
    Object.keys(filters).forEach((key) => {
      if (filters[key] === undefined) {
        delete filters[key];
      }
    });

    const result = await storage.getTransactions(filters);
    res.json(result);
  });

  /**
   * GET /api/transactions/statistics
   * Get transaction statistics
   */
  getStatistics = asyncHandler(async (req: Request, res: Response) => {
    const query = transactionStatisticsSchema.parse(req.query);

    const filters: any = {
      startDate: query.startDate,
      endDate: query.endDate,
      regionId: query.regionId,
    };

    // Remove undefined filters
    Object.keys(filters).forEach((key) => {
      if (filters[key] === undefined) {
        delete filters[key];
      }
    });

    const statistics = await storage.getTransactionStatistics(filters);
    res.json(statistics);
  });
}

export const transactionsController = new TransactionsController();
