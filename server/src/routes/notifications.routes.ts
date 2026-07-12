import { Router } from "express";
import { notificationsController } from "../controllers/notifications.controller";
import { asyncHandler } from "../middleware/async-handler";
import { requireAuth } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import { notificationIdParamSchema } from "../validators/notifications.schema";

export const notificationsRouter = Router();

notificationsRouter.get("/", requireAuth, asyncHandler(notificationsController.list));
notificationsRouter.get("/unread-count", requireAuth, asyncHandler(notificationsController.unreadCount));
notificationsRouter.post("/mark-all-read", requireAuth, asyncHandler(notificationsController.markAllRead));
notificationsRouter.post("/:id/read", requireAuth, validate(notificationIdParamSchema, "params"), asyncHandler(notificationsController.markRead));
