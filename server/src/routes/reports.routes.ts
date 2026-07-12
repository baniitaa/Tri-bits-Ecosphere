import { Router } from "express";
import { reportsController } from "../controllers/reports.controller";
import { asyncHandler } from "../middleware/async-handler";
import { requireAuth } from "../middleware/auth.middleware";
import { requirePermission } from "../middleware/require-permission";
import { validate } from "../middleware/validate.middleware";
import { buildReportSchema, exportReportSchema } from "../validators/reports.schema";

export const reportsRouter = Router();

reportsRouter.get("/summary", requireAuth, requirePermission("reports.manage"), asyncHandler(reportsController.summary));
reportsRouter.post("/build", requireAuth, requirePermission("reports.manage"), validate(buildReportSchema), asyncHandler(reportsController.build));
reportsRouter.post("/export", requireAuth, requirePermission("reports.manage"), validate(exportReportSchema), asyncHandler(reportsController.export));
