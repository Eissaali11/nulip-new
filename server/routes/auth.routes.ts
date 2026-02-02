/**
 * Authentication routes
 */

import type { Express } from "express";
import { authController } from "../controllers/auth.controller";
import { requireAuth } from "../middleware/auth";
import { validateBody } from "../middleware/validation";
import { loginSchema } from "@shared/schema";

export function registerAuthRoutes(app: Express): void {
  // Login
  app.post(
    "/api/auth/login",
    validateBody(loginSchema),
    authController.login
  );

  // Logout
  app.post("/api/auth/logout", requireAuth, authController.logout);

  // Get current user
  app.get("/api/auth/me", requireAuth, authController.getMe);
}
