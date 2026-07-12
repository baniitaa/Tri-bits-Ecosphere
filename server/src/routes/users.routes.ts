import { Router } from "express";
import { usersController } from "../controllers/users.controller";
import { asyncHandler } from "../middleware/async-handler";
import { requireAuth } from "../middleware/auth.middleware";
import { requirePermission } from "../middleware/require-permission";
import { validate } from "../middleware/validate.middleware";
import { createUserSchema, updateUserSchema, userIdParamSchema } from "../validators/user.schema";

export const usersRouter = Router();

usersRouter.get("/", requireAuth, requirePermission("users.manage"), asyncHandler(usersController.index));
usersRouter.post("/", requireAuth, requirePermission("users.manage"), validate(createUserSchema), asyncHandler(usersController.store));
usersRouter.put("/:id", requireAuth, requirePermission("users.manage"), validate(userIdParamSchema, "params"), validate(updateUserSchema), asyncHandler(usersController.update));
usersRouter.delete("/:id", requireAuth, requirePermission("users.manage"), validate(userIdParamSchema, "params"), asyncHandler(usersController.destroy));
