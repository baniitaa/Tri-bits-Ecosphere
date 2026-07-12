import type { Request, Response } from "express";
import { notificationsService } from "../services/notifications.service";
import { sendSuccess } from "../utils/response";

export const notificationsController = {
  async list(req: Request, res: Response) {
    const notifications = await notificationsService.list(req.authUser!.id);
    return sendSuccess(res, notifications);
  },

  async unreadCount(req: Request, res: Response) {
    const unreadCount = await notificationsService.unreadCount(req.authUser!.id);
    return sendSuccess(res, { unreadCount });
  },

  async markRead(req: Request, res: Response) {
    await notificationsService.markRead(String(req.params.id), req.authUser!.id);
    return sendSuccess(res, null, "Notification marked as read");
  },

  async markAllRead(req: Request, res: Response) {
    await notificationsService.markAllRead(req.authUser!.id);
    return sendSuccess(res, null, "Notifications marked as read");
  }
};
