import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Download, FileText, FileSpreadsheet, FileJson } from "lucide-react";
import { Page } from "@/components/layout/Page";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { reportsApi } from "@/api/reports";
import { departmentsApi } from "@/api/departments";
import { queryClient } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { customReportFormSchema, type CustomReportFormInput } from "@shared/schemas";

const today = new Date().toISOString().slice(0, 10);

const defaultValues: CustomReportFormInput = {
  title: "ESG Summary Report",
  reportType: "ESG_SUMMARY",
  fromDate: "",
  toDate: today,
  departmentId: "",
  format: "JSON",
  sections: ["summary"]
};

export function ReportsPage() {
  const [preview, setPreview] = useState<any>(null);
  const summaryQuery = useQuery({
    queryKey: ["reports", "summary"],
    queryFn: reportsApi.summary
  });
  const departmentsQuery = useQuery({
    queryKey: ["departments", "reports"],
    queryFn: () => departmentsApi.list("?page=1&pageSize=100")
  });

  const departments = departmentsQuery.data?.data ?? [];
  const summary = summaryQuery.data?.data;

  const form = useForm<CustomReportFormInput>({
    resolver: zodResolver(customReportFormSchema),
    defaultValues
  });

  const buildMutation = useMutation({
    mutationFn: reportsApi.build,
    onSuccess: (data) => setPreview(data.data)
  });

  const exportMutation = useMutation({
    mutationFn: reportsApi.export,
    onSuccess: async ({ blob, filename }) => {
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      anchor.click();
      URL.revokeObjectURL(url);
      await queryClient.invalidateQueries({ queryKey: ["reports", "summary"] });
    }
  });

  const topCards = useMemo(
    () => [
      { label: "Environmental score", value: summary?.overall.environmentalScore ?? 0, icon: FileText },
      { label: "Social score", value: summary?.overall.socialScore ?? 0, icon: FileSpreadsheet },
      { label: "Governance score", value: summary?.overall.governanceScore ?? 0, icon: FileJson }
    ],
    [summary]
  );

  const submitReport = async (values: CustomReportFormInput) => {
    buildMutation.mutate(values);
  };

  return (
    <Page title="Reports" description="Build custom ESG reports and export them in multiple formats.">
      <div className="grid gap-4 md:grid-cols-3">
        {topCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label}>
              <CardContent className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">{card.label}</p>
                  <p className="mt-2 text-3xl font-semibold text-slate-900">{card.value}</p>
                </div>
                <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
                  <Icon className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Custom report builder</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={form.handleSubmit(submitReport)}>
              <Field label="Title">
                <Input {...form.register("title")} />
              </Field>
              <Field label="Report type">
                <Select {...form.register("reportType")}>
                  <option value="ESG_SUMMARY">ESG Summary</option>
                  <option value="ENVIRONMENTAL">Environmental</option>
                  <option value="SOCIAL">Social</option>
                  <option value="GOVERNANCE">Governance</option>
                </Select>
              </Field>
              <Field label="Department">
                <Select {...form.register("departmentId")}>
                  <option value="">All departments</option>
                  {departments.map((department) => (
                    <option key={department.id} value={department.id}>
                      {department.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="From date">
                  <Input type="date" {...form.register("fromDate")} />
                </Field>
                <Field label="To date">
                  <Input type="date" {...form.register("toDate")} />
                </Field>
              </div>
              <Field label="Export format">
                <Select {...form.register("format")}>
                  <option value="JSON">JSON</option>
                  <option value="CSV">CSV</option>
                  <option value="XLSX">Excel</option>
                  <option value="PDF">PDF</option>
                </Select>
              </Field>
              <p className="text-xs text-slate-500">The report includes summary, details, and charts by default.</p>
              <div className="flex flex-wrap gap-2">
                <Button type="submit" disabled={buildMutation.isPending}>
                  Build report
                </Button>
                <Button type="button" variant="secondary" onClick={() => exportMutation.mutate(form.getValues())} disabled={exportMutation.isPending}>
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Preview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {preview ? (
              <>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs uppercase text-slate-500">Title</p>
                    <p className="mt-1 font-medium text-slate-900">{preview.title}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs uppercase text-slate-500">Type</p>
                    <p className="mt-1 font-medium text-slate-900">{preview.reportType}</p>
                  </div>
                </div>
                <pre className="max-h-[460px] overflow-auto rounded-2xl bg-slate-950 p-4 text-xs text-slate-100">
                  {JSON.stringify(preview, null, 2)}
                </pre>
              </>
            ) : (
              <p className="text-sm text-slate-500">Build a report to see the JSON preview here.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </Page>
  );
}
