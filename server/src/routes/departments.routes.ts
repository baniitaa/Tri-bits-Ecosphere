import { Router } from "express";
import { departmentsController } from "../controllers/departments.controller";
import { asyncHandler } from "../middleware/async-handler";
import { requireAuth } from "../middleware/auth.middleware";
import { requirePermission } from "../middleware/require-permission";
import { validate } from "../middleware/validate.middleware";
import { createDepartmentSchema, departmentIdParamSchema, updateDepartmentSchema } from "../validators/department.schema";

export const departmentsRouter = Router();

departmentsRouter.get("/", requireAuth, requirePermission("departments.manage"), asyncHandler(departmentsController.index));
departmentsRouter.post("/", requireAuth, requirePermission("departments.manage"), validate(createDepartmentSchema), asyncHandler(departmentsController.store));
departmentsRouter.put("/:id", requireAuth, requirePermission("departments.manage"), validate(departmentIdParamSchema, "params"), validate(updateDepartmentSchema), asyncHandler(departmentsController.update));
departmentsRouter.delete("/:id", requireAuth, requirePermission("departments.manage"), validate(departmentIdParamSchema, "params"), asyncHandler(departmentsController.destroy));
