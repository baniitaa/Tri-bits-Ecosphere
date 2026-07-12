import { apiRequest } from "@/lib/api";
import type { SettingsFormInput } from "@shared/schemas";

export type OrganizationSettings = SettingsFormInput & {
  id: string;
  organizationName: string;
  legalName?: string | null;
};

export const settingsApi = {
  get: () => apiRequest<OrganizationSettings>("/settings"),
  update: (input: SettingsFormInput) => apiRequest<OrganizationSettings>("/settings", { method: "PUT", body: JSON.stringify(input) })
};
