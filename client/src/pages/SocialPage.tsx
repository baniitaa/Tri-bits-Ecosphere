import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Page } from "@/components/layout/Page";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table } from "@/components/ui/table";
import { Field } from "@/components/ui/field";
import { socialApi } from "@/api/social";
import { departmentsApi } from "@/api/departments";
import { employeesApi } from "@/api/employees";
import { queryClient } from "@/lib/queryClient";
import {
  csrActivityFormSchema,
  csrParticipationFormSchema,
  trainingParticipationFormSchema,
  trainingSessionFormSchema,
  type CsrActivityFormInput,
  type CsrParticipationFormInput,
  type TrainingParticipationFormInput,
  type TrainingSessionFormInput
} from "@shared/schemas";

const today = new Date().toISOString().slice(0, 10);

const defaultActivityValues: CsrActivityFormInput = {
  title: "",
  description: "",
  departmentId: "",
  budgetAmount: undefined,
  startDate: today,
  endDate: "",
  requiresEvidence: true,
  status: "PENDING_APPROVAL"
};

const defaultParticipationValues: CsrParticipationFormInput = {
  employeeId: "",
  participationDate: today,
  volunteerHours: undefined,
  notes: "",
  evidenceUrl: "",
  status: "ATTENDED"
};

const defaultTrainingValues: TrainingSessionFormInput = {
  title: "",
  description: "",
  departmentId: "",
  trainingDate: today,
  dueDate: "",
  trainerName: "",
  status: "PLANNED",
  isMandatory: false
};

const defaultTrainingParticipationValues: TrainingParticipationFormInput = {
  employeeId: "",
  participationStatus: "ENROLLED",
  completedAt: "",
  score: undefined,
  evidenceUrl: "",
  notes: ""
};

const formatDate = (value?: string | Date | null) => {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleDateString();
};

export function SocialPage() {
  const [editingActivityId, setEditingActivityId] = useState<string | null>(null);
  const [editingTrainingId, setEditingTrainingId] = useState<string | null>(null);
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null);
  const [selectedTrainingId, setSelectedTrainingId] = useState<string | null>(null);

  const dashboardQuery = useQuery({
    queryKey: ["social", "dashboard"],
    queryFn: socialApi.dashboard
  });
  const activitiesQuery = useQuery({
    queryKey: ["social", "activities"],
    queryFn: socialApi.activities
  });
  const trainingsQuery = useQuery({
    queryKey: ["social", "trainings"],
    queryFn: socialApi.trainings
  });
  const departmentsQuery = useQuery({
    queryKey: ["departments", "social"],
    queryFn: () => departmentsApi.list("?page=1&pageSize=100")
  });
  const employeesQuery = useQuery({
    queryKey: ["employees", "social"],
    queryFn: () => employeesApi.list("?page=1&pageSize=100")
  });

  const dashboard = dashboardQuery.data?.data;
  const activities = activitiesQuery.data?.data ?? [];
  const trainings = trainingsQuery.data?.data ?? [];
  const departments = departmentsQuery.data?.data ?? [];
  const employees = employeesQuery.data?.data ?? [];

  const activityForm = useForm<CsrActivityFormInput>({
    resolver: zodResolver(csrActivityFormSchema),
    defaultValues: defaultActivityValues
  });

  const participationForm = useForm<CsrParticipationFormInput>({
    resolver: zodResolver(csrParticipationFormSchema),
    defaultValues: defaultParticipationValues
  });

  const trainingForm = useForm<TrainingSessionFormInput>({
    resolver: zodResolver(trainingSessionFormSchema),
    defaultValues: defaultTrainingValues
  });

  const trainingParticipationForm = useForm<TrainingParticipationFormInput>({
    resolver: zodResolver(trainingParticipationFormSchema),
    defaultValues: defaultTrainingParticipationValues
  });

  useEffect(() => {
    const selected = activities.find((activity) => activity.id === editingActivityId);
    if (selected) {
      activityForm.reset({
        title: selected.title,
        description: selected.description ?? "",
        departmentId: selected.department?.id ?? "",
        budgetAmount: selected.budgetAmount ?? undefined,
        startDate: new Date(selected.startDate).toISOString().slice(0, 10),
        endDate: selected.endDate ? new Date(selected.endDate).toISOString().slice(0, 10) : "",
        requiresEvidence: selected.requiresEvidence,
        status: selected.status as CsrActivityFormInput["status"]
      });
    }
  }, [editingActivityId, activities, activityForm]);

  useEffect(() => {
    const selected = trainings.find((training) => training.id === editingTrainingId);
    if (selected) {
      trainingForm.reset({
        title: selected.title,
        description: selected.description ?? "",
        departmentId: selected.department?.id ?? "",
        trainingDate: new Date(selected.trainingDate).toISOString().slice(0, 10),
        dueDate: selected.dueDate ? new Date(selected.dueDate).toISOString().slice(0, 10) : "",
        trainerName: selected.trainerName ?? "",
        status: selected.status as TrainingSessionFormInput["status"],
        isMandatory: selected.isMandatory
      });
    }
  }, [editingTrainingId, trainings, trainingForm]);

  const activityMutation = useMutation({
    mutationFn: async (values: CsrActivityFormInput) => {
      if (editingActivityId) {
        return socialApi.updateActivity(editingActivityId, values);
      }
      return socialApi.createActivity(values);
    },
    onSuccess: async () => {
      setEditingActivityId(null);
      activityForm.reset(defaultActivityValues);
      await queryClient.invalidateQueries({ queryKey: ["social", "activities"] });
      await queryClient.invalidateQueries({ queryKey: ["social", "dashboard"] });
    }
  });

  const participationMutation = useMutation({
    mutationFn: async (values: CsrParticipationFormInput) => {
      if (!selectedActivityId) {
        throw new Error("Select a CSR activity first");
      }
      return socialApi.addCsrParticipation(selectedActivityId, values);
    },
    onSuccess: async () => {
      participationForm.reset(defaultParticipationValues);
      await queryClient.invalidateQueries({ queryKey: ["social", "activities"] });
      await queryClient.invalidateQueries({ queryKey: ["social", "dashboard"] });
    }
  });

  const trainingMutation = useMutation({
    mutationFn: async (values: TrainingSessionFormInput) => {
      if (editingTrainingId) {
        return socialApi.updateTraining(editingTrainingId, values);
      }
      return socialApi.createTraining(values);
    },
    onSuccess: async () => {
      setEditingTrainingId(null);
      trainingForm.reset(defaultTrainingValues);
      await queryClient.invalidateQueries({ queryKey: ["social", "trainings"] });
      await queryClient.invalidateQueries({ queryKey: ["social", "dashboard"] });
    }
  });

  const trainingParticipationMutation = useMutation({
    mutationFn: async (values: TrainingParticipationFormInput) => {
      if (!selectedTrainingId) {
        throw new Error("Select a training session first");
      }
      return socialApi.addTrainingParticipation(selectedTrainingId, values);
    },
    onSuccess: async () => {
      trainingParticipationForm.reset(defaultTrainingParticipationValues);
      await queryClient.invalidateQueries({ queryKey: ["social", "trainings"] });
      await queryClient.invalidateQueries({ queryKey: ["social", "dashboard"] });
    }
  });

  const topCards = useMemo(
    () => [
      { label: "CSR activities", value: dashboard?.activityCount ?? 0 },
      { label: "Pending approvals", value: dashboard?.pendingActivities ?? 0 },
      { label: "CSR participations", value: dashboard?.csrParticipationCount ?? 0 },
      { label: "Training completion", value: `${dashboard?.trainingCompletionRate ?? 0}%` }
    ],
    [dashboard]
  );

  const genderChart = Object.entries(dashboard?.genderCounts ?? {}).map(([name, value]) => ({ name, value }));
  const participationChart = dashboard?.participationTrend ?? [];
  const employmentChart = Object.entries(dashboard?.employmentCounts ?? {}).map(([name, value]) => ({ name, value }));

  return (
    <Page title="Social" description="Manage CSR activities, employee participation, and training tracking.">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {topCards.map((card) => (
          <Card key={card.label}>
            <CardContent>
              <p className="text-sm text-slate-500">{card.label}</p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">{card.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Gender mix</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={genderChart}>
                <XAxis dataKey="name" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <Tooltip />
                <Bar dataKey="value" fill="#0f172a" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Participation volume</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={participationChart}>
                <XAxis dataKey="label" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <Tooltip />
                <Bar dataKey="value" fill="#334155" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Employment type mix</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={employmentChart}>
                <XAxis dataKey="name" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <Tooltip />
                <Bar dataKey="value" fill="#475569" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>CSR activities</CardTitle>
            <Button variant="secondary" size="sm" onClick={() => { setEditingActivityId(null); activityForm.reset(defaultActivityValues); }}>
              New activity
            </Button>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
                <tr>
                  <th className="py-3 pr-4">Activity</th>
                  <th className="py-3 pr-4">Department</th>
                  <th className="py-3 pr-4">Participants</th>
                  <th className="py-3 pr-4">Status</th>
                  <th className="py-3 pr-4"></th>
                </tr>
              </thead>
              <tbody>
                {activities.map((activity) => (
                  <tr key={activity.id} className="border-b border-slate-100">
                    <td className="py-3 pr-4">
                      <div className="font-medium">{activity.title}</div>
                      <div className="text-xs text-slate-500">{formatDate(activity.startDate)} to {formatDate(activity.endDate)}</div>
                    </td>
                    <td className="py-3 pr-4 text-slate-600">{activity.department?.name ?? "Organization-wide"}</td>
                    <td className="py-3 pr-4">{activity._count.participations}</td>
                    <td className="py-3 pr-4">
                      <Badge
                        className={
                          activity.status === "APPROVED"
                            ? "bg-emerald-100 text-emerald-700"
                            : activity.status === "PENDING_APPROVAL"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-slate-100 text-slate-600"
                        }
                      >
                        {activity.status}
                      </Badge>
                    </td>
                    <td className="py-3 pr-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="secondary" onClick={() => setSelectedActivityId(activity.id)}>Select</Button>
                        {activity.status !== "APPROVED" ? (
                          <Button size="sm" onClick={() => socialApi.approveActivity(activity.id).then(() => queryClient.invalidateQueries({ queryKey: ["social", "activities"] }))}>
                            Approve
                          </Button>
                        ) : null}
                        <Button size="sm" variant="secondary" onClick={() => setEditingActivityId(activity.id)}>Edit</Button>
                        <Button size="sm" variant="destructive" onClick={() => socialApi.removeActivity(activity.id).then(() => queryClient.invalidateQueries({ queryKey: ["social", "activities"] }))}>
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
            <CardTitle>{editingActivityId ? "Edit CSR activity" : "Create CSR activity"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={activityForm.handleSubmit((values) => activityMutation.mutate(values))}>
              <Field label="Title" error={activityForm.formState.errors.title?.message}>
                <Input {...activityForm.register("title")} />
              </Field>
              <Field label="Description">
                <Textarea {...activityForm.register("description")} />
              </Field>
              <Field label="Department">
                <Select {...activityForm.register("departmentId")}>
                  <option value="">Organization-wide</option>
                  {departments.map((department) => (
                    <option key={department.id} value={department.id}>{department.name}</option>
                  ))}
                </Select>
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Start date" error={activityForm.formState.errors.startDate?.message}>
                  <Input type="date" {...activityForm.register("startDate")} />
                </Field>
                <Field label="End date">
                  <Input type="date" {...activityForm.register("endDate")} />
                </Field>
              </div>
              <Field label="Budget amount">
                <Input
                  type="number"
                  step="0.01"
                  {...activityForm.register("budgetAmount", {
                    setValueAs: (value) => (value === "" || value === null ? undefined : Number(value))
                  })}
                />
              </Field>
              <Field label="Status">
                <Select {...activityForm.register("status")}>
                  <option value="DRAFT">Draft</option>
                  <option value="PENDING_APPROVAL">Pending approval</option>
                  <option value="APPROVED">Approved</option>
                  <option value="REJECTED">Rejected</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                </Select>
              </Field>
              <label className="flex items-center gap-3 text-sm text-slate-700">
                <Checkbox {...activityForm.register("requiresEvidence")} />
                Evidence required
              </label>
              {activityMutation.error ? <p className="text-sm text-rose-600">{activityMutation.error.message}</p> : null}
              <div className="flex gap-2">
                <Button type="submit" disabled={activityMutation.isPending}>{editingActivityId ? "Update" : "Create"}</Button>
                <Button type="button" variant="secondary" onClick={() => { setEditingActivityId(null); activityForm.reset(defaultActivityValues); }}>
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
            <CardTitle>Training sessions</CardTitle>
            <Button variant="secondary" size="sm" onClick={() => { setEditingTrainingId(null); trainingForm.reset(defaultTrainingValues); }}>
              New training
            </Button>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
                <tr>
                  <th className="py-3 pr-4">Training</th>
                  <th className="py-3 pr-4">Department</th>
                  <th className="py-3 pr-4">Participants</th>
                  <th className="py-3 pr-4">Status</th>
                  <th className="py-3 pr-4"></th>
                </tr>
              </thead>
              <tbody>
                {trainings.map((training) => (
                  <tr key={training.id} className="border-b border-slate-100">
                    <td className="py-3 pr-4">
                      <div className="font-medium">{training.title}</div>
                      <div className="text-xs text-slate-500">{formatDate(training.trainingDate)}</div>
                    </td>
                    <td className="py-3 pr-4 text-slate-600">{training.department?.name ?? "-"}</td>
                    <td className="py-3 pr-4">{training._count.participations}</td>
                    <td className="py-3 pr-4">
                      <Badge className={training.status === "COMPLETED" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}>
                        {training.status}
                      </Badge>
                    </td>
                    <td className="py-3 pr-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="secondary" onClick={() => setSelectedTrainingId(training.id)}>Select</Button>
                        <Button size="sm" variant="secondary" onClick={() => setEditingTrainingId(training.id)}>Edit</Button>
                        <Button size="sm" variant="destructive" onClick={() => socialApi.removeTraining(training.id).then(() => queryClient.invalidateQueries({ queryKey: ["social", "trainings"] }))}>
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
            <CardTitle>{editingTrainingId ? "Edit training" : "Create training"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={trainingForm.handleSubmit((values) => trainingMutation.mutate(values))}>
              <Field label="Title" error={trainingForm.formState.errors.title?.message}>
                <Input {...trainingForm.register("title")} />
              </Field>
              <Field label="Description">
                <Textarea {...trainingForm.register("description")} />
              </Field>
              <Field label="Department">
                <Select {...trainingForm.register("departmentId")}>
                  <option value="">Organization-wide</option>
                  {departments.map((department) => (
                    <option key={department.id} value={department.id}>{department.name}</option>
                  ))}
                </Select>
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Training date" error={trainingForm.formState.errors.trainingDate?.message}>
                  <Input type="date" {...trainingForm.register("trainingDate")} />
                </Field>
                <Field label="Due date">
                  <Input type="date" {...trainingForm.register("dueDate")} />
                </Field>
              </div>
              <Field label="Trainer name">
                <Input {...trainingForm.register("trainerName")} />
              </Field>
              <Field label="Status">
                <Select {...trainingForm.register("status")}>
                  <option value="PLANNED">Planned</option>
                  <option value="ONGOING">Ongoing</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                </Select>
              </Field>
              <label className="flex items-center gap-3 text-sm text-slate-700">
                <Checkbox {...trainingForm.register("isMandatory")} />
                Mandatory training
              </label>
              {trainingMutation.error ? <p className="text-sm text-rose-600">{trainingMutation.error.message}</p> : null}
              <div className="flex gap-2">
                <Button type="submit" disabled={trainingMutation.isPending}>{editingTrainingId ? "Update" : "Create"}</Button>
                <Button type="button" variant="secondary" onClick={() => { setEditingTrainingId(null); trainingForm.reset(defaultTrainingValues); }}>
                  Clear
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Record CSR participation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              Selected activity: {selectedActivityId ? activities.find((activity) => activity.id === selectedActivityId)?.title ?? "Unknown" : "Choose an activity above"}
            </div>
            <form className="space-y-4" onSubmit={participationForm.handleSubmit((values) => participationMutation.mutate(values))}>
              <Field label="Employee" error={participationForm.formState.errors.employeeId?.message}>
                <Select {...participationForm.register("employeeId")}>
                  <option value="">Select employee</option>
                  {employees.map((employee) => (
                    <option key={employee.id} value={employee.id}>{employee.employeeCode} - {employee.firstName} {employee.lastName}</option>
                  ))}
                </Select>
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Participation date">
                  <Input type="date" {...participationForm.register("participationDate")} />
                </Field>
                <Field label="Volunteer hours">
                  <Input
                    type="number"
                    step="0.5"
                    {...participationForm.register("volunteerHours", {
                      setValueAs: (value) => (value === "" || value === null ? undefined : Number(value))
                    })}
                  />
                </Field>
              </div>
              <Field label="Notes">
                <Textarea {...participationForm.register("notes")} />
              </Field>
              <Field label="Evidence URL">
                <Input {...participationForm.register("evidenceUrl")} />
              </Field>
              {participationMutation.error ? <p className="text-sm text-rose-600">{participationMutation.error.message}</p> : null}
              <Button type="submit" disabled={participationMutation.isPending}>Record participation</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Record training completion</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              Selected training: {selectedTrainingId ? trainings.find((training) => training.id === selectedTrainingId)?.title ?? "Unknown" : "Choose a training above"}
            </div>
            <form className="space-y-4" onSubmit={trainingParticipationForm.handleSubmit((values) => trainingParticipationMutation.mutate(values))}>
              <Field label="Employee" error={trainingParticipationForm.formState.errors.employeeId?.message}>
                <Select {...trainingParticipationForm.register("employeeId")}>
                  <option value="">Select employee</option>
                  {employees.map((employee) => (
                    <option key={employee.id} value={employee.id}>{employee.employeeCode} - {employee.firstName} {employee.lastName}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Participation status">
                <Select {...trainingParticipationForm.register("participationStatus")}>
                  <option value="ENROLLED">Enrolled</option>
                  <option value="ATTENDED">Attended</option>
                  <option value="COMPLETED">Completed</option>
                </Select>
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Completed at">
                  <Input type="date" {...trainingParticipationForm.register("completedAt")} />
                </Field>
                <Field label="Score">
                  <Input
                    type="number"
                    step="0.1"
                    {...trainingParticipationForm.register("score", {
                      setValueAs: (value) => (value === "" || value === null ? undefined : Number(value))
                    })}
                  />
                </Field>
              </div>
              <Field label="Evidence URL">
                <Input {...trainingParticipationForm.register("evidenceUrl")} />
              </Field>
              <Field label="Notes">
                <Textarea {...trainingParticipationForm.register("notes")} />
              </Field>
              {trainingParticipationMutation.error ? <p className="text-sm text-rose-600">{trainingParticipationMutation.error.message}</p> : null}
              <Button type="submit" disabled={trainingParticipationMutation.isPending}>Record completion</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </Page>
  );
}
