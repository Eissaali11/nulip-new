/**
 * Authentication and authorization middleware
 */

import type { Request, Response, NextFunction } from "express";
import { AuthenticationError, AuthorizationError } from "../utils/errors";
import { ROLES, hasRoleOrAbove, canManageUsers } from "@shared/roles";

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: string;
        username: string;
        regionId: string | null;
      };
    }
  }
}

// Session store interface
interface SessionStore {
  get(token: string): Promise<SessionData | null>;
  set(token: string, data: SessionData, expiry: number): Promise<void>;
  delete(token: string): Promise<void>;
}

export interface SessionData {
  userId: string;
  role: string;
  username: string;
  regionId: string | null;
  expiry: number;
}

// PostgreSQL-backed session store for Bearer tokens
import { pool } from "../db";

class PostgresSessionStore implements SessionStore {
  async get(token: string): Promise<SessionData | null> {
    const client = await pool.connect();
    try {
      const result = await client.query(
        `SELECT "userId", role, username, "regionId", expiry FROM bearer_sessions WHERE token = $1`,
        [token]
      );
      
      if (result.rows && result.rows.length > 0) {
        const row = result.rows[0];
        const now = Date.now();
        
        // Check if session has expired
        if (Number(row.expiry) < now) {
          await this.delete(token);
          return null;
        }
        
        return {
          userId: row.userId,
          role: row.role,
          username: row.username,
          regionId: row.regionId,
          expiry: Number(row.expiry)
        };
      }
      return null;
    } catch (error) {
      console.error("Session get error:", error);
      return null;
    } finally {
      client.release();
    }
  }

  async set(token: string, data: SessionData, expiry: number): Promise<void> {
    const client = await pool.connect();
    try {
      // First try to create table if it doesn't exist
      await client.query(`
        CREATE TABLE IF NOT EXISTS bearer_sessions (
          token VARCHAR(255) PRIMARY KEY,
          "userId" VARCHAR(255) NOT NULL,
          role VARCHAR(50) NOT NULL,
          username VARCHAR(255) NOT NULL,
          "regionId" VARCHAR(255),
          expiry BIGINT NOT NULL,
          "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      await client.query(
        `INSERT INTO bearer_sessions (token, "userId", role, username, "regionId", expiry)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (token) DO UPDATE SET
           "userId" = EXCLUDED."userId",
           role = EXCLUDED.role,
           username = EXCLUDED.username,
           "regionId" = EXCLUDED."regionId",
           expiry = EXCLUDED.expiry`,
        [token, data.userId, data.role, data.username, data.regionId, expiry]
      );
    } catch (error) {
      console.error("Session set error:", error);
    } finally {
      client.release();
    }
  }

  async delete(token: string): Promise<void> {
    const client = await pool.connect();
    try {
      await client.query(`DELETE FROM bearer_sessions WHERE token = $1`, [token]);
    } catch (error) {
      console.error("Session delete error:", error);
    } finally {
      client.release();
    }
  }
}

// Export PostgreSQL-backed session store instance
export const sessionStore: SessionStore = new PostgresSessionStore();

/**
 * Middleware to require authentication
 * Checks Bearer token first (Frontend primary method), then Express Session
 */
export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // 1. Check Bearer token FIRST (Frontend sends this)
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

    if (token) {
      const session = await sessionStore.get(token);
      if (session) {
        req.user = {
          id: session.userId,
          role: session.role,
          username: session.username,
          regionId: session.regionId,
        };
        return next();
      }
    }

    // 2. Fallback to Express Session (PostgreSQL-backed cookie)
    if (req.session && (req.session as any).user) {
      req.user = (req.session as any).user;
      return next();
    }

    throw new AuthenticationError("Session expired");
  } catch (error) {
    next(error);
  }
}

/**
 * Middleware to require admin role (System Manager only)
 */
export function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    return next(new AuthenticationError("Authentication required"));
  }

  if (req.user.role !== ROLES.ADMIN) {
    return next(new AuthorizationError("يجب أن تكون مدير نظام للوصول إلى هذه الصفحة"));
  }

  next();
}

/**
 * Middleware to require supervisor role or above
 */
export function requireSupervisor(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    return next(new AuthenticationError("Authentication required"));
  }

  if (!hasRoleOrAbove(req.user.role, ROLES.SUPERVISOR)) {
    return next(new AuthorizationError("يجب أن تكون مشرف أو أعلى للوصول إلى هذه الصفحة"));
  }

  next();
}

/**
 * Middleware factory to require a specific role or above
 */
export function requireRole(minRole: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AuthenticationError("Authentication required"));
    }

    if (!hasRoleOrAbove(req.user.role, minRole)) {
      return next(new AuthorizationError("ليس لديك الصلاحيات الكافية"));
    }

    next();
  };
}

/**
 * Generate a session token
 */
export function generateSessionToken(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}
