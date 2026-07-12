import { z } from "zod";
import { departmentFormSchema } from "../../../shared/src/schemas";

export const departmentIdParamSchema = z.object({
  id: z.string().min(1)
});

export const createDepartmentSchema = departmentFormSchema;
export const updateDepartmentSchema = departmentFormSchema.partial();
