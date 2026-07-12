import { Router } from "express";
import { employeesController } from "../controllers/employees.controller";
import { asyncHandler } from "../middleware/async-handler";
import { requireAuth } from "../middleware/auth.middleware";
import { requirePermission } from "../middleware/require-permission";
import { validate } from "../middleware/validate.middleware";
import { createEmployeeSchema, employeeIdParamSchema, updateEmployeeSchema } from "../validators/employee.schema";

export const employeesRouter = Router();

employeesRouter.get("/", requireAuth, requirePermission("employees.manage"), asyncHandler(employeesController.index));
employeesRouter.post("/", requireAuth, requirePermission("employees.manage"), validate(createEmployeeSchema), asyncHandler(employeesController.store));
employeesRouter.put("/:id", requireAuth, requirePermission("employees.manage"), validate(employeeIdParamSchema, "params"), validate(updateEmployeeSchema), asyncHandler(employeesController.update));
employeesRouter.delete("/:id", requireAuth, requirePermission("employees.manage"), validate(employeeIdParamSchema, "params"), asyncHandler(employeesController.destroy));
