import { Router } from "express";
import { asyncHandler } from "../middleware/async-handler";
import { requireAuth } from "../middleware/auth.middleware";
import { requirePermission } from "../middleware/require-permission";
import { validate } from "../middleware/validate.middleware";
import { environmentalController } from "../controllers/environmental.controller";
import {
  categoriesQuerySchema,
  createCarbonTransactionSchema,
  createEmissionFactorSchema,
  createEnvironmentalGoalSchema,
  environmentalIdParamSchema,
  updateCarbonTransactionSchema,
  updateEmissionFactorSchema,
  updateEnvironmentalGoalSchema
} from "../validators/environmental.schema";

export const environmentalRouter = Router();

environmentalRouter.get("/categories", requireAuth, requirePermission("environmental.manage"), validate(categoriesQuerySchema, "query"), asyncHandler(environmentalController.categories));
environmentalRouter.get("/products", requireAuth, requirePermission("environmental.manage"), asyncHandler(environmentalController.products));
environmentalRouter.get("/emission-factors", requireAuth, requirePermission("environmental.manage"), asyncHandler(environmentalController.factors));
environmentalRouter.post("/emission-factors", requireAuth, requirePermission("environmental.manage"), validate(createEmissionFactorSchema), asyncHandler(environmentalController.createFactor));
environmentalRouter.put("/emission-factors/:id", requireAuth, requirePermission("environmental.manage"), validate(environmentalIdParamSchema, "params"), validate(updateEmissionFactorSchema), asyncHandler(environmentalController.updateFactor));
environmentalRouter.delete("/emission-factors/:id", requireAuth, requirePermission("environmental.manage"), validate(environmentalIdParamSchema, "params"), asyncHandler(environmentalController.deleteFactor));
environmentalRouter.get("/carbon-transactions", requireAuth, requirePermission("environmental.manage"), asyncHandler(environmentalController.transactions));
environmentalRouter.post("/carbon-transactions", requireAuth, requirePermission("environmental.manage"), validate(createCarbonTransactionSchema), asyncHandler(environmentalController.createTransaction));
environmentalRouter.put("/carbon-transactions/:id", requireAuth, requirePermission("environmental.manage"), validate(environmentalIdParamSchema, "params"), validate(updateCarbonTransactionSchema), asyncHandler(environmentalController.updateTransaction));
environmentalRouter.delete("/carbon-transactions/:id", requireAuth, requirePermission("environmental.manage"), validate(environmentalIdParamSchema, "params"), asyncHandler(environmentalController.deleteTransaction));
environmentalRouter.get("/goals", requireAuth, requirePermission("environmental.manage"), asyncHandler(environmentalController.goals));
environmentalRouter.post("/goals", requireAuth, requirePermission("environmental.manage"), validate(createEnvironmentalGoalSchema), asyncHandler(environmentalController.createGoal));
environmentalRouter.put("/goals/:id", requireAuth, requirePermission("environmental.manage"), validate(environmentalIdParamSchema, "params"), validate(updateEnvironmentalGoalSchema), asyncHandler(environmentalController.updateGoal));
environmentalRouter.delete("/goals/:id", requireAuth, requirePermission("environmental.manage"), validate(environmentalIdParamSchema, "params"), asyncHandler(environmentalController.deleteGoal));
environmentalRouter.get("/dashboard", requireAuth, requirePermission("environmental.manage"), asyncHandler(environmentalController.dashboard));
