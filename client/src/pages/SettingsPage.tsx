import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Page } from "@/components/layout/Page";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { settingsApi } from "@/api/settings";
import { settingsFormSchema, type SettingsFormInput } from "@shared/schemas";
import { queryClient } from "@/lib/queryClient";
import { zodResolver } from "@hookform/resolvers/zod";

export function SettingsPage() {
  const settingsQuery = useQuery({
    queryKey: ["settings"],
    queryFn: settingsApi.get
  });

  const form = useForm<SettingsFormInput>({
    resolver: zodResolver(settingsFormSchema),
    defaultValues: {
      organizationName: "",
      legalName: "",
      timezone: "Asia/Kolkata",
      currency: "INR",
      emissionCalculationEnabled: true,
      evidenceRequired: true,
      badgeAutoAwardEnabled: true,
      notificationEnabled: true,
      environmentalWeight: 40,
      socialWeight: 30,
      governanceWeight: 30
    }
  });

  useEffect(() => {
    const settings = settingsQuery.data?.data;
    if (settings) {
      form.reset({
        organizationName: settings.organizationName,
        legalName: settings.legalName ?? "",
        timezone: settings.timezone,
        currency: settings.currency,
        emissionCalculationEnabled: settings.emissionCalculationEnabled,
        evidenceRequired: settings.evidenceRequired,
        badgeAutoAwardEnabled: settings.badgeAutoAwardEnabled,
        notificationEnabled: settings.notificationEnabled,
        environmentalWeight: settings.environmentalWeight,
        socialWeight: settings.socialWeight,
        governanceWeight: settings.governanceWeight
      });
    }
  }, [settingsQuery.data, form]);

  const mutation = useMutation({
    mutationFn: settingsApi.update,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["settings"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard", "overview"] });
    }
  });

  return (
    <Page title="Settings" description="Configure the organization-level ESG behavior.">
      <Card>
        <CardHeader>
          <CardTitle>Organization settings</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Organization name" error={form.formState.errors.organizationName?.message}>
                <Input {...form.register("organizationName")} />
              </Field>
              <Field label="Legal name">
                <Input {...form.register("legalName")} />
              </Field>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Timezone" error={form.formState.errors.timezone?.message}>
                <Input {...form.register("timezone")} />
              </Field>
              <Field label="Currency" error={form.formState.errors.currency?.message}>
                <Input {...form.register("currency")} />
              </Field>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <Field label="Environmental weight" error={form.formState.errors.environmentalWeight?.message}>
                <Input type="number" {...form.register("environmentalWeight", { valueAsNumber: true })} />
              </Field>
              <Field label="Social weight" error={form.formState.errors.socialWeight?.message}>
                <Input type="number" {...form.register("socialWeight", { valueAsNumber: true })} />
              </Field>
              <Field label="Governance weight" error={form.formState.errors.governanceWeight?.message}>
                <Input type="number" {...form.register("governanceWeight", { valueAsNumber: true })} />
              </Field>
            </div>
            <div className="space-y-3 rounded-2xl border border-slate-200 p-4">
              <label className="flex items-center gap-3 text-sm text-slate-700">
                <Checkbox {...form.register("emissionCalculationEnabled")} />
                Emission calculation enabled
              </label>
              <label className="flex items-center gap-3 text-sm text-slate-700">
                <Checkbox {...form.register("evidenceRequired")} />
                Evidence required
              </label>
              <label className="flex items-center gap-3 text-sm text-slate-700">
                <Checkbox {...form.register("badgeAutoAwardEnabled")} />
                Badge auto award enabled
              </label>
              <label className="flex items-center gap-3 text-sm text-slate-700">
                <Checkbox {...form.register("notificationEnabled")} />
                Notifications enabled
              </label>
            </div>
            {mutation.error ? <p className="text-sm text-rose-600">{mutation.error.message}</p> : null}
            <Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? "Saving..." : "Save settings"}</Button>
          </form>
        </CardContent>
      </Card>
    </Page>
  );
}
