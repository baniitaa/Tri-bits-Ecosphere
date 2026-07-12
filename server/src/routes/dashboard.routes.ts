import { Router } from "express";
import { dashboardController } from "../controllers/dashboard.controller";
import { asyncHandler } from "../middleware/async-handler";
import { requireAuth } from "../middleware/auth.middleware";

export const dashboardRouter = Router();

dashboardRouter.get("/overview", requireAuth, asyncHandler(dashboardController.overview));
