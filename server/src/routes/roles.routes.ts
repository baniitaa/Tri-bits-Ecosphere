import { Router } from "express";
import { rolesController } from "../controllers/roles.controller";
import { asyncHandler } from "../middleware/async-handler";
import { requireAuth } from "../middleware/auth.middleware";
import { requirePermission } from "../middleware/require-permission";
import { validate } from "../middleware/validate.middleware";
import {
  createRoleSchema,
  roleIdParamSchema,
  updateRolePermissionsSchema,
  updateRoleSchema
} from "../validators/role.schema";

export const rolesRouter = Router();

rolesRouter.get("/", requireAuth, requirePermission("roles.manage"), asyncHandler(rolesController.index));
rolesRouter.get("/permissions", requireAuth, requirePermission("roles.manage"), asyncHandler(rolesController.permissions));
rolesRouter.post("/", requireAuth, requirePermission("roles.manage"), validate(createRoleSchema), asyncHandler(rolesController.store));
rolesRouter.put("/:id", requireAuth, requirePermission("roles.manage"), validate(roleIdParamSchema, "params"), validate(updateRoleSchema), asyncHandler(rolesController.update));
rolesRouter.delete("/:id", requireAuth, requirePermission("roles.manage"), validate(roleIdParamSchema, "params"), asyncHandler(rolesController.destroy));
rolesRouter.put("/:id/permissions", requireAuth, requirePermission("roles.manage"), validate(roleIdParamSchema, "params"), validate(updateRolePermissionsSchema), asyncHandler(rolesController.updatePermissions));
