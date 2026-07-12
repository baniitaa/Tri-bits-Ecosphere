import { z } from "zod";
import {
  emissionFactorFormSchema,
  carbonTransactionFormSchema,
  environmentalGoalFormSchema
} from "../../../shared/src/schemas";

export const environmentalIdParamSchema = z.object({
  id: z.string().min(1)
});

export const createEmissionFactorSchema = emissionFactorFormSchema;
export const updateEmissionFactorSchema = emissionFactorFormSchema.partial();

export const createCarbonTransactionSchema = carbonTransactionFormSchema;
export const updateCarbonTransactionSchema = carbonTransactionFormSchema.partial();

export const createEnvironmentalGoalSchema = environmentalGoalFormSchema;
export const updateEnvironmentalGoalSchema = environmentalGoalFormSchema.partial();

export const categoriesQuerySchema = z.object({
  group: z.string().optional()
});
