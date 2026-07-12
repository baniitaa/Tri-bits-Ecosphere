import { z } from "zod";
import { employeeFormSchema } from "../../../shared/src/schemas";

export const employeeIdParamSchema = z.object({
  id: z.string().min(1)
});

export const createEmployeeSchema = employeeFormSchema.extend({
  dateOfJoining: z.string().optional().nullable()
});

export const updateEmployeeSchema = employeeFormSchema.partial().extend({
  dateOfJoining: z.string().optional().nullable()
});
