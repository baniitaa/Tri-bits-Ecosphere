import { z } from "zod";
import {
  csrActivityFormSchema,
  csrParticipationFormSchema,
  trainingSessionFormSchema,
  trainingParticipationFormSchema
} from "../../../shared/src/schemas";

export const socialIdParamSchema = z.object({
  id: z.string().min(1)
});

export const createCsrActivitySchema = csrActivityFormSchema;
export const updateCsrActivitySchema = csrActivityFormSchema.partial();
export const createCsrParticipationSchema = csrParticipationFormSchema;

export const createTrainingSessionSchema = trainingSessionFormSchema;
export const updateTrainingSessionSchema = trainingSessionFormSchema.partial();
export const createTrainingParticipationSchema = trainingParticipationFormSchema;
