import type { Response } from "express";

export const sendSuccess = <T>(res: Response, data: T, message = "OK", meta?: Record<string, unknown>) =>
  res.json({ success: true, message, data, ...(meta ? { meta } : {}) });

export const sendPaginated = <T>(
  res: Response,
  data: T[],
  pagination: { page: number; pageSize: number; total: number },
  message = "OK"
) =>
  res.json({
    success: true,
    message,
    data,
    meta: pagination
  });
