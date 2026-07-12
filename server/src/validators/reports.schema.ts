import { z } from "zod";
import { customReportFormSchema } from "../../../shared/src/schemas";

export const reportIdParamSchema = z.object({
  id: z.string().min(1)
});

export const buildReportSchema = customReportFormSchema;
export const exportReportSchema = customReportFormSchema;
