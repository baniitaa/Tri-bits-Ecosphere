import { Router } from "express";
import { governanceController } from "../controllers/governance.controller";
import { asyncHandler } from "../middleware/async-handler";
import { requireAuth } from "../middleware/auth.middleware";
import { requirePermission } from "../middleware/require-permission";
import { validate } from "../middleware/validate.middleware";
import {
  createAcknowledgementSchema,
  createAuditSchema,
  createComplianceIssueSchema,
  createPolicySchema,
  governanceIdParamSchema,
  updateAuditSchema,
  updateComplianceIssueSchema,
  updatePolicySchema
} from "../validators/governance.schema";

export const governanceRouter = Router();

governanceRouter.get("/dashboard", requireAuth, requirePermission("governance.manage"), asyncHandler(governanceController.dashboard));

governanceRouter.get("/policies", requireAuth, requirePermission("governance.manage"), asyncHandler(governanceController.policies));
governanceRouter.post("/policies", requireAuth, requirePermission("governance.manage"), validate(createPolicySchema), asyncHandler(governanceController.createPolicy));
governanceRouter.put("/policies/:id", requireAuth, requirePermission("governance.manage"), validate(governanceIdParamSchema, "params"), validate(updatePolicySchema), asyncHandler(governanceController.updatePolicy));
governanceRouter.delete("/policies/:id", requireAuth, requirePermission("governance.manage"), validate(governanceIdParamSchema, "params"), asyncHandler(governanceController.deletePolicy));
governanceRouter.post("/policies/:id/acknowledgements", requireAuth, requirePermission("governance.manage"), validate(governanceIdParamSchema, "params"), validate(createAcknowledgementSchema), asyncHandler(governanceController.acknowledgePolicy));

governanceRouter.get("/audits", requireAuth, requirePermission("governance.manage"), asyncHandler(governanceController.audits));
governanceRouter.post("/audits", requireAuth, requirePermission("governance.manage"), validate(createAuditSchema), asyncHandler(governanceController.createAudit));
governanceRouter.put("/audits/:id", requireAuth, requirePermission("governance.manage"), validate(governanceIdParamSchema, "params"), validate(updateAuditSchema), asyncHandler(governanceController.updateAudit));
governanceRouter.delete("/audits/:id", requireAuth, requirePermission("governance.manage"), validate(governanceIdParamSchema, "params"), asyncHandler(governanceController.deleteAudit));

governanceRouter.get("/issues", requireAuth, requirePermission("governance.manage"), asyncHandler(governanceController.issues));
governanceRouter.post("/issues", requireAuth, requirePermission("governance.manage"), validate(createComplianceIssueSchema), asyncHandler(governanceController.createIssue));
governanceRouter.put("/issues/:id", requireAuth, requirePermission("governance.manage"), validate(governanceIdParamSchema, "params"), validate(updateComplianceIssueSchema), asyncHandler(governanceController.updateIssue));
governanceRouter.delete("/issues/:id", requireAuth, requirePermission("governance.manage"), validate(governanceIdParamSchema, "params"), asyncHandler(governanceController.deleteIssue));
