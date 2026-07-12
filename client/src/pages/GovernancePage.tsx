import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Page } from "@/components/layout/Page";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Table } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { governanceApi } from "@/api/governance";
import { departmentsApi } from "@/api/departments";
import { employeesApi } from "@/api/employees";
import { queryClient } from "@/lib/queryClient";
import {
  auditFormSchema,
  complianceIssueFormSchema,
  policyAcknowledgementFormSchema,
  policyFormSchema,
  type AuditFormInput,
  type ComplianceIssueFormInput,
  type PolicyAcknowledgementFormInput,
  type PolicyFormInput
} from "@shared/schemas";

const today = new Date().toISOString().slice(0, 10);

const policyDefaults: PolicyFormInput = {
  title: "",
  description: "",
  category: "",
  version: "1.0",
  status: "DRAFT",
  effectiveDate: today,
  reviewDate: ""
};

const auditDefaults: AuditFormInput = {
  title: "",
  description: "",
  auditType: "Internal",
  status: "SCHEDULED",
  scheduledDate: today,
  completedDate: "",
  departmentId: "",
  auditorName: ""
};

const issueDefaults: ComplianceIssueFormInput = {
  title: "",
  description: "",
  severity: "MEDIUM",
  status: "OPEN",
  policyId: "",
  auditId: "",
  departmentId: "",
  assignedToUserId: "",
  dueDate: today,
  closureNotes: ""
};

const acknowledgementDefaults: PolicyAcknowledgementFormInput = {
  employeeId: ""
};

const formatDate = (value?: string | Date | null) => {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleDateString();
};

export function GovernancePage() {
  const [editingPolicyId, setEditingPolicyId] = useState<string | null>(null);
  const [editingAuditId, setEditingAuditId] = useState<string | null>(null);
  const [editingIssueId, setEditingIssueId] = useState<string | null>(null);
  const [selectedPolicyId, setSelectedPolicyId] = useState<string | null>(null);

  const dashboardQuery = useQuery({ queryKey: ["governance", "dashboard"], queryFn: governanceApi.dashboard });
  const policiesQuery = useQuery({ queryKey: ["governance", "policies"], queryFn: governanceApi.policies });
  const auditsQuery = useQuery({ queryKey: ["governance", "audits"], queryFn: governanceApi.audits });
  const issuesQuery = useQuery({ queryKey: ["governance", "issues"], queryFn: governanceApi.issues });
  const departmentsQuery = useQuery({ queryKey: ["departments", "governance"], queryFn: () => departmentsApi.list("?page=1&pageSize=100") });
  const employeesQuery = useQuery({ queryKey: ["employees", "governance"], queryFn: () => employeesApi.list("?page=1&pageSize=100") });

  const dashboard = dashboardQuery.data?.data;
  const policies = policiesQuery.data?.data ?? [];
  const audits = auditsQuery.data?.data ?? [];
  const issues = issuesQuery.data?.data ?? [];
  const departments = departmentsQuery.data?.data ?? [];
  const employees = employeesQuery.data?.data ?? [];

  const policyForm = useForm<PolicyFormInput>({
    resolver: zodResolver(policyFormSchema),
    defaultValues: policyDefaults
  });
  const auditForm = useForm<AuditFormInput>({
    resolver: zodResolver(auditFormSchema),
    defaultValues: auditDefaults
  });
  const issueForm = useForm<ComplianceIssueFormInput>({
    resolver: zodResolver(complianceIssueFormSchema),
    defaultValues: issueDefaults
  });
  const acknowledgementForm = useForm<PolicyAcknowledgementFormInput>({
    resolver: zodResolver(policyAcknowledgementFormSchema),
    defaultValues: acknowledgementDefaults
  });

  useEffect(() => {
    const selected = policies.find((policy) => policy.id === editingPolicyId);
    if (selected) {
      policyForm.reset({
        title: selected.title,
        description: selected.description ?? "",
        category: selected.category ?? "",
        version: selected.version,
        status: selected.status as PolicyFormInput["status"],
        effectiveDate: selected.effectiveDate ? new Date(selected.effectiveDate).toISOString().slice(0, 10) : "",
        reviewDate: selected.reviewDate ? new Date(selected.reviewDate).toISOString().slice(0, 10) : ""
      });
    }
  }, [editingPolicyId, policies, policyForm]);

  useEffect(() => {
    const selected = audits.find((audit) => audit.id === editingAuditId);
    if (selected) {
      auditForm.reset({
        title: selected.title,
        description: selected.description ?? "",
        auditType: selected.auditType,
        status: selected.status as AuditFormInput["status"],
        scheduledDate: new Date(selected.scheduledDate).toISOString().slice(0, 10),
        completedDate: selected.completedDate ? new Date(selected.completedDate).toISOString().slice(0, 10) : "",
        departmentId: selected.department?.id ?? "",
        auditorName: selected.auditorName ?? ""
      });
    }
  }, [auditForm, audits, editingAuditId]);

  useEffect(() => {
    const selected = issues.find((issue) => issue.id === editingIssueId);
    if (selected) {
      issueForm.reset({
        title: selected.title,
        description: selected.description ?? "",
        severity: selected.severity as ComplianceIssueFormInput["severity"],
        status: selected.status as ComplianceIssueFormInput["status"],
        policyId: selected.policy?.id ?? "",
        auditId: selected.audit?.id ?? "",
        departmentId: selected.department?.id ?? "",
        assignedToUserId: selected.assignedToUser?.id ?? "",
        dueDate: selected.dueDate ? new Date(selected.dueDate).toISOString().slice(0, 10) : "",
        closureNotes: selected.closureNotes ?? ""
      });
    }
  }, [editingIssueId, issueForm, issues]);

  const policyMutation = useMutation({
    mutationFn: async (values: PolicyFormInput) => (editingPolicyId ? governanceApi.updatePolicy(editingPolicyId, values) : governanceApi.createPolicy(values)),
    onSuccess: async () => {
      setEditingPolicyId(null);
      policyForm.reset(policyDefaults);
      await queryClient.invalidateQueries({ queryKey: ["governance", "policies"] });
      await queryClient.invalidateQueries({ queryKey: ["governance", "dashboard"] });
    }
  });

  const auditMutation = useMutation({
    mutationFn: async (values: AuditFormInput) => (editingAuditId ? governanceApi.updateAudit(editingAuditId, values) : governanceApi.createAudit(values)),
    onSuccess: async () => {
      setEditingAuditId(null);
      auditForm.reset(auditDefaults);
      await queryClient.invalidateQueries({ queryKey: ["governance", "audits"] });
      await queryClient.invalidateQueries({ queryKey: ["governance", "dashboard"] });
    }
  });

  const issueMutation = useMutation({
    mutationFn: async (values: ComplianceIssueFormInput) => (editingIssueId ? governanceApi.updateIssue(editingIssueId, values) : governanceApi.createIssue(values)),
    onSuccess: async () => {
      setEditingIssueId(null);
      issueForm.reset(issueDefaults);
      await queryClient.invalidateQueries({ queryKey: ["governance", "issues"] });
      await queryClient.invalidateQueries({ queryKey: ["governance", "dashboard"] });
    }
  });

  const acknowledgementMutation = useMutation({
    mutationFn: async (values: PolicyAcknowledgementFormInput) => {
      if (!selectedPolicyId) {
        throw new Error("Select a policy first");
      }
      return governanceApi.acknowledgePolicy(selectedPolicyId, values);
    },
    onSuccess: async () => {
      acknowledgementForm.reset(acknowledgementDefaults);
      await queryClient.invalidateQueries({ queryKey: ["governance", "policies"] });
      await queryClient.invalidateQueries({ queryKey: ["governance", "dashboard"] });
    }
  });

  const cards = useMemo(
    () => [
      { label: "Policies", value: dashboard?.policyCount ?? 0 },
      { label: "Audits", value: dashboard?.auditCount ?? 0 },
      { label: "Issues", value: dashboard?.issueCount ?? 0 },
      { label: "Overdue issues", value: dashboard?.overdueIssueCount ?? 0 }
    ],
    [dashboard]
  );

  return (
    <Page title="Governance" description="Manage policies, audits, and compliance issues.">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.label}>
            <CardContent>
              <p className="text-sm text-slate-500">{card.label}</p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">{card.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Policies</CardTitle>
            <Button variant="secondary" size="sm" onClick={() => { setEditingPolicyId(null); policyForm.reset(policyDefaults); }}>
              New policy
            </Button>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
                <tr>
                  <th className="py-3 pr-4">Policy</th>
                  <th className="py-3 pr-4">Category</th>
                  <th className="py-3 pr-4">Acknowledgements</th>
                  <th className="py-3 pr-4">Status</th>
                  <th className="py-3 pr-4"></th>
                </tr>
              </thead>
              <tbody>
                {policies.map((policy) => (
                  <tr key={policy.id} className="border-b border-slate-100">
                    <td className="py-3 pr-4">
                      <div className="font-medium text-slate-900">{policy.title}</div>
                      <div className="text-xs text-slate-500">Version {policy.version}</div>
                    </td>
                    <td className="py-3 pr-4 text-slate-600">{policy.category ?? "-"}</td>
                    <td className="py-3 pr-4">{policy._count.acknowledgements}</td>
                    <td className="py-3 pr-4">
                      <Badge className={policy.status === "ACTIVE" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}>
                        {policy.status}
                      </Badge>
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="secondary" onClick={() => setSelectedPolicyId(policy.id)}>Select</Button>
                        <Button size="sm" variant="secondary" onClick={() => setEditingPolicyId(policy.id)}>Edit</Button>
                        <Button size="sm" variant="destructive" onClick={() => governanceApi.deletePolicy(policy.id).then(async () => {
                          await queryClient.invalidateQueries({ queryKey: ["governance", "policies"] });
                          await queryClient.invalidateQueries({ queryKey: ["governance", "dashboard"] });
                        })}>
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{editingPolicyId ? "Edit policy" : "Create policy"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={policyForm.handleSubmit((values) => policyMutation.mutate(values))}>
              <Field label="Title" error={policyForm.formState.errors.title?.message}>
                <Input {...policyForm.register("title")} />
              </Field>
              <Field label="Description">
                <Textarea {...policyForm.register("description")} />
              </Field>
              <Field label="Category">
                <Input {...policyForm.register("category")} />
              </Field>
              <Field label="Version">
                <Input {...policyForm.register("version")} />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Effective date">
                  <Input type="date" {...policyForm.register("effectiveDate")} />
                </Field>
                <Field label="Review date">
                  <Input type="date" {...policyForm.register("reviewDate")} />
                </Field>
              </div>
              <Field label="Status">
                <Select {...policyForm.register("status")}>
                  <option value="DRAFT">Draft</option>
                  <option value="ACTIVE">Active</option>
                  <option value="ARCHIVED">Archived</option>
                </Select>
              </Field>
              <div className="flex gap-2">
                <Button type="submit" disabled={policyMutation.isPending}>{editingPolicyId ? "Update" : "Create"}</Button>
                <Button type="button" variant="secondary" onClick={() => { setEditingPolicyId(null); policyForm.reset(policyDefaults); }}>
                  Clear
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Audits</CardTitle>
            <Button variant="secondary" size="sm" onClick={() => { setEditingAuditId(null); auditForm.reset(auditDefaults); }}>
              New audit
            </Button>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
                <tr>
                  <th className="py-3 pr-4">Audit</th>
                  <th className="py-3 pr-4">Department</th>
                  <th className="py-3 pr-4">Issues</th>
                  <th className="py-3 pr-4">Status</th>
                  <th className="py-3 pr-4"></th>
                </tr>
              </thead>
              <tbody>
                {audits.map((audit) => (
                  <tr key={audit.id} className="border-b border-slate-100">
                    <td className="py-3 pr-4">
                      <div className="font-medium text-slate-900">{audit.title}</div>
                      <div className="text-xs text-slate-500">{audit.auditType} · {formatDate(audit.scheduledDate)}</div>
                    </td>
                    <td className="py-3 pr-4 text-slate-600">{audit.department?.name ?? "-"}</td>
                    <td className="py-3 pr-4">{audit._count.issues}</td>
                    <td className="py-3 pr-4">
                      <Badge className={audit.status === "COMPLETED" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}>
                        {audit.status}
                      </Badge>
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="secondary" onClick={() => setEditingAuditId(audit.id)}>Edit</Button>
                        <Button size="sm" variant="destructive" onClick={() => governanceApi.deleteAudit(audit.id).then(async () => {
                          await queryClient.invalidateQueries({ queryKey: ["governance", "audits"] });
                        })}>
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{editingAuditId ? "Edit audit" : "Create audit"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={auditForm.handleSubmit((values) => auditMutation.mutate(values))}>
              <Field label="Title">
                <Input {...auditForm.register("title")} />
              </Field>
              <Field label="Description">
                <Textarea {...auditForm.register("description")} />
              </Field>
              <Field label="Audit type">
                <Input {...auditForm.register("auditType")} />
              </Field>
              <Field label="Department">
                <Select {...auditForm.register("departmentId")}>
                  <option value="">No department</option>
                  {departments.map((department) => (
                    <option key={department.id} value={department.id}>{department.name}</option>
                  ))}
                </Select>
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Scheduled date">
                  <Input type="date" {...auditForm.register("scheduledDate")} />
                </Field>
                <Field label="Completed date">
                  <Input type="date" {...auditForm.register("completedDate")} />
                </Field>
              </div>
              <Field label="Auditor name">
                <Input {...auditForm.register("auditorName")} />
              </Field>
              <Field label="Status">
                <Select {...auditForm.register("status")}>
                  <option value="SCHEDULED">Scheduled</option>
                  <option value="IN_PROGRESS">In progress</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                </Select>
              </Field>
              <div className="flex gap-2">
                <Button type="submit" disabled={auditMutation.isPending}>{editingAuditId ? "Update" : "Create"}</Button>
                <Button type="button" variant="secondary" onClick={() => { setEditingAuditId(null); auditForm.reset(auditDefaults); }}>
                  Clear
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Compliance issues</CardTitle>
            <Button variant="secondary" size="sm" onClick={() => { setEditingIssueId(null); issueForm.reset(issueDefaults); }}>
              New issue
            </Button>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
                <tr>
                  <th className="py-3 pr-4">Issue</th>
                  <th className="py-3 pr-4">Assigned</th>
                  <th className="py-3 pr-4">Severity</th>
                  <th className="py-3 pr-4">Status</th>
                  <th className="py-3 pr-4"></th>
                </tr>
              </thead>
              <tbody>
                {issues.map((issue) => (
                  <tr key={issue.id} className="border-b border-slate-100">
                    <td className="py-3 pr-4">
                      <div className="font-medium text-slate-900">{issue.title}</div>
                      <div className="text-xs text-slate-500">{issue.policy?.title ?? issue.audit?.title ?? issue.department?.name ?? "-"}</div>
                    </td>
                    <td className="py-3 pr-4 text-slate-600">{issue.assignedToUser ? `${issue.assignedToUser.firstName} ${issue.assignedToUser.lastName}` : "-"}</td>
                    <td className="py-3 pr-4">{issue.severity}</td>
                    <td className="py-3 pr-4">
                      <Badge className={issue.status === "RESOLVED" || issue.status === "CLOSED" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}>
                        {issue.status}
                      </Badge>
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="secondary" onClick={() => setEditingIssueId(issue.id)}>Edit</Button>
                        <Button size="sm" variant="destructive" onClick={() => governanceApi.deleteIssue(issue.id).then(async () => {
                          await queryClient.invalidateQueries({ queryKey: ["governance", "issues"] });
                        })}>
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{editingIssueId ? "Edit issue" : "Create issue"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={issueForm.handleSubmit((values) => issueMutation.mutate(values))}>
              <Field label="Title">
                <Input {...issueForm.register("title")} />
              </Field>
              <Field label="Description">
                <Textarea {...issueForm.register("description")} />
              </Field>
              <Field label="Policy">
                <Select {...issueForm.register("policyId")}>
                  <option value="">No policy</option>
                  {policies.map((policy) => (
                    <option key={policy.id} value={policy.id}>{policy.title}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Audit">
                <Select {...issueForm.register("auditId")}>
                  <option value="">No audit</option>
                  {audits.map((audit) => (
                    <option key={audit.id} value={audit.id}>{audit.title}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Department">
                <Select {...issueForm.register("departmentId")}>
                  <option value="">No department</option>
                  {departments.map((department) => (
                    <option key={department.id} value={department.id}>{department.name}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Assigned user">
                <Select {...issueForm.register("assignedToUserId")}>
                  <option value="">Unassigned</option>
                  {employees.filter((employee) => employee.user).map((employee) => (
                    <option key={employee.user!.id} value={employee.user!.id}>
                      {employee.firstName} {employee.lastName}
                    </option>
                  ))}
                </Select>
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Due date">
                  <Input type="date" {...issueForm.register("dueDate")} />
                </Field>
                <Field label="Severity">
                  <Select {...issueForm.register("severity")}>
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </Select>
                </Field>
              </div>
              <Field label="Status">
                <Select {...issueForm.register("status")}>
                  <option value="OPEN">Open</option>
                  <option value="IN_PROGRESS">In progress</option>
                  <option value="RESOLVED">Resolved</option>
                  <option value="CLOSED">Closed</option>
                  <option value="OVERDUE">Overdue</option>
                </Select>
              </Field>
              <Field label="Closure notes">
                <Textarea {...issueForm.register("closureNotes")} />
              </Field>
              <div className="flex gap-2">
                <Button type="submit" disabled={issueMutation.isPending}>{editingIssueId ? "Update" : "Create"}</Button>
                <Button type="button" variant="secondary" onClick={() => { setEditingIssueId(null); issueForm.reset(issueDefaults); }}>
                  Clear
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Policy acknowledgement</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            Selected policy: {selectedPolicyId ? policies.find((policy) => policy.id === selectedPolicyId)?.title ?? "Unknown" : "Choose a policy above"}
          </div>
          <form className="flex flex-col gap-4 md:flex-row md:items-end" onSubmit={acknowledgementForm.handleSubmit((values) => acknowledgementMutation.mutate(values))}>
            <div className="flex-1">
              <Field label="Employee">
                <Select {...acknowledgementForm.register("employeeId")}>
                  <option value="">Select employee</option>
                  {employees.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.employeeCode} - {employee.firstName} {employee.lastName}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            <Button type="submit" disabled={acknowledgementMutation.isPending}>Acknowledge</Button>
          </form>
        </CardContent>
      </Card>
    </Page>
  );
}
