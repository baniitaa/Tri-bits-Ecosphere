import { apiDownload, apiRequest } from "@/lib/api";
import type { CustomReportFormInput } from "@shared/schemas";

export type ReportSummary = {
  environmental: any;
  social: any;
  governance: any;
  overall: {
    environmentalScore: number;
    socialScore: number;
    governanceScore: number;
  };
};

export const reportsApi = {
  summary: () => apiRequest<ReportSummary>("/reports/summary"),
  build: (input: CustomReportFormInput) => apiRequest<any>("/reports/build", { method: "POST", body: JSON.stringify(input) }),
  export: (input: CustomReportFormInput) => apiDownload("/reports/export", { method: "POST", body: JSON.stringify(input) })
};
