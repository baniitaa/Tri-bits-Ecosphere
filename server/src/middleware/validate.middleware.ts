import type { RequestHandler } from "express";
import type { ZodTypeAny } from "zod";

type Target = "body" | "query" | "params";

export const validate =
  (schema: ZodTypeAny, target: Target = "body"): RequestHandler =>
  (req, _res, next) => {
    (req as any)[target] = schema.parse(req[target]);
    next();
  };
