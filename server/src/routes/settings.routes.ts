import { Router } from "express";
import { settingsController } from "../controllers/settings.controller";
import { asyncHandler } from "../middleware/async-handler";
import { requireAuth } from "../middleware/auth.middleware";
import { requirePermission } from "../middleware/require-permission";
import { validate } from "../middleware/validate.middleware";
import { settingsFormSchema } from "../validators/settings.schema";

export const settingsRouter = Router();

settingsRouter.get("/", requireAuth, requirePermission("settings.manage"), asyncHandler(settingsController.show));
settingsRouter.put("/", requireAuth, requirePermission("settings.manage"), validate(settingsFormSchema), asyncHandler(settingsController.update));
