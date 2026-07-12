import { Router } from "express";
import { asyncHandler } from "../middleware/async-handler";
import { requireAuth } from "../middleware/auth.middleware";
import { requirePermission } from "../middleware/require-permission";
import { validate } from "../middleware/validate.middleware";
import { socialController } from "../controllers/social.controller";
import {
  createCsrActivitySchema,
  createCsrParticipationSchema,
  createTrainingParticipationSchema,
  createTrainingSessionSchema,
  socialIdParamSchema,
  updateCsrActivitySchema,
  updateTrainingSessionSchema
} from "../validators/social.schema";

export const socialRouter = Router();

socialRouter.get("/dashboard", requireAuth, requirePermission("social.manage"), asyncHandler(socialController.dashboard));

socialRouter.get("/csr-activities", requireAuth, requirePermission("social.manage"), asyncHandler(socialController.activities));
socialRouter.post("/csr-activities", requireAuth, requirePermission("social.manage"), validate(createCsrActivitySchema), asyncHandler(socialController.createActivity));
socialRouter.put("/csr-activities/:id", requireAuth, requirePermission("social.manage"), validate(socialIdParamSchema, "params"), validate(updateCsrActivitySchema), asyncHandler(socialController.updateActivity));
socialRouter.post("/csr-activities/:id/approve", requireAuth, requirePermission("social.manage"), validate(socialIdParamSchema, "params"), asyncHandler(socialController.approveActivity));
socialRouter.delete("/csr-activities/:id", requireAuth, requirePermission("social.manage"), validate(socialIdParamSchema, "params"), asyncHandler(socialController.deleteActivity));
socialRouter.post("/csr-activities/:id/participations", requireAuth, requirePermission("social.manage"), validate(socialIdParamSchema, "params"), validate(createCsrParticipationSchema), asyncHandler(socialController.addCsrParticipation));

socialRouter.get("/trainings", requireAuth, requirePermission("social.manage"), asyncHandler(socialController.trainings));
socialRouter.post("/trainings", requireAuth, requirePermission("social.manage"), validate(createTrainingSessionSchema), asyncHandler(socialController.createTraining));
socialRouter.put("/trainings/:id", requireAuth, requirePermission("social.manage"), validate(socialIdParamSchema, "params"), validate(updateTrainingSessionSchema), asyncHandler(socialController.updateTraining));
socialRouter.delete("/trainings/:id", requireAuth, requirePermission("social.manage"), validate(socialIdParamSchema, "params"), asyncHandler(socialController.deleteTraining));
socialRouter.post("/trainings/:id/participations", requireAuth, requirePermission("social.manage"), validate(socialIdParamSchema, "params"), validate(createTrainingParticipationSchema), asyncHandler(socialController.addTrainingParticipation));
