import { z } from "zod";
import { userFormSchema } from "../../../shared/src/schemas";

export const userIdParamSchema = z.object({
  id: z.string().min(1)
});

export const createUserSchema = userFormSchema.extend({
  password: z.string().min(8)
});

export const updateUserSchema = userFormSchema.partial().extend({
  password: z.string().min(8).optional()
});
