import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Area, AreaChart, Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
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
import { environmentalApi } from "@/api/environmental";
import { departmentsApi } from "@/api/departments";
import { employeesApi } from "@/api/employees";
import { queryClient } from "@/lib/queryClient";
import type {
  CarbonTransactionFormInput,
  EmissionFactorFormInput,
  EnvironmentalGoalFormInput
} from "@shared/schemas";
import {
  carbonTransactionFormSchema,
  emissionFactorFormSchema,
  environmentalGoalFormSchema
} from "@shared/schemas";

const factorDefaultValues = {
  name: "",
  categoryId: "",
  scope: "SCOPE_2" as const,
  unit: "kWh",
  co2ePerUnit: 1,
  source: "",
  isActive: true
};

const transactionDefaultValues = {
  title: "",
  activityType: "",
  transactionDate: new Date().toISOString().slice(0, 10),
  departmentId: "",
  employeeId: "",
  productId: "",
  emissionFactorId: "",
  quantity: 1,
  manualEmissionsKg: undefined,
  notes: "",
  evidenceUrl: ""
};

const goalDefaultValues = {
  title: "",
  description: "",
  departmentId: "",
  baselineEmissionsKg: 0,
  targetEmissionsKg: 0,
  dueDate: new Date().toISOString().slice(0, 10),
  status: "ACTIVE" as const
};

const formatDate = (value?: string | Date | null) => {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleDateString();
};

export function EnvironmentalPage() {
  const [editingFactorId, setEditingFactorId] = useState<string | null>(null);
  const [editingTransactionId, setEditingTransactionId] = useState<string | null>(null);
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);

  const dashboardQuery = useQuery({
    queryKey: ["environmental", "dashboard"],
    queryFn: environmentalApi.dashboard
  });
  const factorsQuery = useQuery({
    queryKey: ["environmental", "factors"],
    queryFn: environmentalApi.factors
  });
  const transactionsQuery = useQuery({
    queryKey: ["environmental", "transactions"],
    queryFn: environmentalApi.transactions
  });
  const goalsQuery = useQuery({
    queryKey: ["environmental", "goals"],
    queryFn: environmentalApi.goals
  });
  const categoriesQuery = useQuery({
    queryKey: ["environmental", "categories"],
    queryFn: () => environmentalApi.categories("?group=ENVIRONMENTAL")
  });
  const productsQuery = useQuery({
    queryKey: ["environmental", "products"],
    queryFn: environmentalApi.products
  });
  const departmentsQuery = useQuery({
    queryKey: ["departments", "environmental"],
    queryFn: () => departmentsApi.list("?page=1&pageSize=100")
  });
  const employeesQuery = useQuery({
    queryKey: ["employees", "environmental"],
    queryFn: () => employeesApi.list("?page=1&pageSize=100")
  });

  const dashboard = dashboardQuery.data?.data;
  const factors = factorsQuery.data?.data ?? [];
  const transactions = transactionsQuery.data?.data ?? [];
  const goals = goalsQuery.data?.data ?? [];
  const categories = categoriesQuery.data?.data ?? [];
  const products = productsQuery.data?.data ?? [];
  const departments = departmentsQuery.data?.data ?? [];
  const employees = employeesQuery.data?.data ?? [];

  const factorForm = useForm<EmissionFactorFormInput>({
    resolver: zodResolver(emissionFactorFormSchema),
    defaultValues: factorDefaultValues
  });

  const transactionForm = useForm<CarbonTransactionFormInput>({
    resolver: zodResolver(carbonTransactionFormSchema),
    defaultValues: transactionDefaultValues
  });

  const goalForm = useForm<EnvironmentalGoalFormInput>({
    resolver: zodResolver(environmentalGoalFormSchema),
    defaultValues: goalDefaultValues
  });

  // Keep the forms simple and trust API validation for the heavy lifting.
  useEffect(() => {
    const selected = factors.find((factor) => factor.id === editingFactorId);
    if (selected) {
      factorForm.reset({
        name: selected.name,
        categoryId: selected.category?.id ?? "",
        scope: selected.scope as EmissionFactorFormInput["scope"],
        unit: selected.unit,
        co2ePerUnit: selected.co2ePerUnit,
        source: selected.source ?? "",
        isActive: selected.isActive
      });
    }
  }, [editingFactorId, factors, factorForm]);

  useEffect(() => {
    const selected = transactions.find((transaction) => transaction.id === editingTransactionId);
    if (selected) {
      transactionForm.reset({
        title: selected.title,
        activityType: selected.activityType,
        transactionDate: new Date(selected.transactionDate).toISOString().slice(0, 10),
        departmentId: selected.department.id,
        employeeId: selected.employee?.id ?? "",
        productId: selected.product?.id ?? "",
        emissionFactorId: selected.emissionFactor?.id ?? "",
        quantity: selected.quantity,
        manualEmissionsKg: selected.manualEmissionsKg ?? undefined,
        notes: selected.notes ?? "",
        evidenceUrl: selected.evidenceUrl ?? ""
      });
    }
  }, [editingTransactionId, transactions, transactionForm]);

  useEffect(() => {
    const selected = goals.find((goal) => goal.id === editingGoalId);
    if (selected) {
      goalForm.reset({
        title: selected.title,
        description: selected.description ?? "",
        departmentId: selected.department?.id ?? "",
        baselineEmissionsKg: selected.baselineEmissionsKg,
        targetEmissionsKg: selected.targetEmissionsKg,
        dueDate: new Date(selected.dueDate).toISOString().slice(0, 10),
        status: selected.status as EnvironmentalGoalFormInput["status"]
      });
    }
  }, [editingGoalId, goals, goalForm]);

  const factorMutation = useMutation({
    mutationFn: async (values: EmissionFactorFormInput) => {
      if (editingFactorId) {
        return environmentalApi.updateFactor(editingFactorId, values);
      }
      return environmentalApi.createFactor(values);
    },
    onSuccess: async () => {
      setEditingFactorId(null);
      factorForm.reset(factorDefaultValues);
      await queryClient.invalidateQueries({ queryKey: ["environmental", "factors"] });
      await queryClient.invalidateQueries({ queryKey: ["environmental", "dashboard"] });
    }
  });

  const transactionMutation = useMutation({
    mutationFn: async (values: CarbonTransactionFormInput) => {
      if (editingTransactionId) {
        return environmentalApi.updateTransaction(editingTransactionId, values);
      }
      return environmentalApi.createTransaction(values);
    },
    onSuccess: async () => {
      setEditingTransactionId(null);
      transactionForm.reset(transactionDefaultValues);
      await queryClient.invalidateQueries({ queryKey: ["environmental", "transactions"] });
      await queryClient.invalidateQueries({ queryKey: ["environmental", "dashboard"] });
      await queryClient.invalidateQueries({ queryKey: ["environmental", "goals"] });
    }
  });

  const goalMutation = useMutation({
    mutationFn: async (values: EnvironmentalGoalFormInput) => {
      if (editingGoalId) {
        return environmentalApi.updateGoal(editingGoalId, values);
      }
      return environmentalApi.createGoal(values);
    },
    onSuccess: async () => {
      setEditingGoalId(null);
      goalForm.reset(goalDefaultValues);
      await queryClient.invalidateQueries({ queryKey: ["environmental", "goals"] });
      await queryClient.invalidateQueries({ queryKey: ["environmental", "dashboard"] });
    }
  });

  const topCards = useMemo(
    () => [
      { label: "Total emissions", value: `${dashboard?.totalEmissionsKg?.toFixed(2) ?? "0.00"} kg`, hint: "All carbon transactions" },
      { label: "Active goals", value: dashboard?.activeGoals ?? 0, hint: "Targets still open" },
      { label: "Average goal progress", value: `${dashboard?.averageGoalProgress ?? 0}%`, hint: "Across all goals" },
      { label: "Active factors", value: dashboard?.activeFactors ?? 0, hint: "Emission factor catalog" }
    ],
    [dashboard]
  );

  return (
    <Page title="Environmental" description="Track emissions, factors, and reduction goals.">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {topCards.map((card) => (
          <Card key={card.label}>
            <CardContent>
              <p className="text-sm text-slate-500">{card.label}</p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">{card.value}</p>
              <p className="mt-1 text-xs text-slate-500">{card.hint}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
        <Card>
          <CardHeader>
            <CardTitle>Emissions trend</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dashboard?.trend ?? []}>
                <XAxis dataKey="label" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <Tooltip />
                <Area type="monotone" dataKey="emissions" stroke="#0f172a" fill="#cbd5e1" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Department ranking</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dashboard?.departmentRanking ?? []} layout="vertical">
                <XAxis type="number" tickLine={false} axisLine={false} />
                <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} width={100} />
                <Tooltip />
                <Bar dataKey="environmentalScore" fill="#0f172a" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_0.9fr]">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Emission factors</CardTitle>
            <Button variant="secondary" size="sm" onClick={() => { setEditingFactorId(null); factorForm.reset(factorDefaultValues); }}>
              New factor
            </Button>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
                <tr>
                  <th className="py-3 pr-4">Factor</th>
                  <th className="py-3 pr-4">Category</th>
                  <th className="py-3 pr-4">Rate</th>
                  <th className="py-3 pr-4">Status</th>
                  <th className="py-3 pr-4"></th>
                </tr>
              </thead>
              <tbody>
                {factors.map((factor) => (
                  <tr key={factor.id} className="border-b border-slate-100">
                    <td className="py-3 pr-4">
                      <div className="font-medium">{factor.name}</div>
                      <div className="text-xs text-slate-500">{factor.scope}</div>
                    </td>
                    <td className="py-3 pr-4 text-slate-600">{factor.category?.name ?? "-"}</td>
                    <td className="py-3 pr-4">{factor.co2ePerUnit} / {factor.unit}</td>
                    <td className="py-3 pr-4">
                      <Badge className={factor.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}>
                        {factor.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="py-3 pr-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="secondary" onClick={() => setEditingFactorId(factor.id)}>Edit</Button>
                        <Button size="sm" variant="destructive" onClick={() => environmentalApi.removeFactor(factor.id).then(() => queryClient.invalidateQueries({ queryKey: ["environmental", "factors"] }))}>
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
            <CardTitle>{editingFactorId ? "Edit factor" : "Create factor"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={factorForm.handleSubmit((values) => factorMutation.mutate(values))}>
              <Field label="Name" error={factorForm.formState.errors.name?.message}>
                <Input {...factorForm.register("name")} />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Category">
                  <Select {...factorForm.register("categoryId")}>
                    <option value="">Unassigned</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                  </Select>
                </Field>
                <Field label="Scope" error={factorForm.formState.errors.scope?.message}>
                  <Select {...factorForm.register("scope")}>
                    <option value="SCOPE_1">Scope 1</option>
                    <option value="SCOPE_2">Scope 2</option>
                    <option value="SCOPE_3">Scope 3</option>
                  </Select>
                </Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Unit" error={factorForm.formState.errors.unit?.message}>
                  <Input {...factorForm.register("unit")} />
                </Field>
                <Field label="CO2e per unit" error={factorForm.formState.errors.co2ePerUnit?.message}>
                  <Input type="number" step="0.001" {...factorForm.register("co2ePerUnit", { valueAsNumber: true })} />
                </Field>
              </div>
              <Field label="Source">
                <Input {...factorForm.register("source")} />
              </Field>
              <label className="flex items-center gap-3 text-sm text-slate-700">
                <Checkbox {...factorForm.register("isActive")} />
                Active factor
              </label>
              {factorMutation.error ? <p className="text-sm text-rose-600">{factorMutation.error.message}</p> : null}
              <div className="flex gap-2">
                <Button type="submit" disabled={factorMutation.isPending}>{editingFactorId ? "Update" : "Create"}</Button>
                <Button type="button" variant="secondary" onClick={() => { setEditingFactorId(null); factorForm.reset(factorDefaultValues); }}>
                  Clear
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_0.9fr]">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Carbon transactions</CardTitle>
            <Button variant="secondary" size="sm" onClick={() => { setEditingTransactionId(null); transactionForm.reset(transactionDefaultValues); }}>
              New transaction
            </Button>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
                <tr>
                  <th className="py-3 pr-4">Transaction</th>
                  <th className="py-3 pr-4">Department</th>
                  <th className="py-3 pr-4">Emissions</th>
                  <th className="py-3 pr-4">Date</th>
                  <th className="py-3 pr-4"></th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction) => (
                  <tr key={transaction.id} className="border-b border-slate-100">
                    <td className="py-3 pr-4">
                      <div className="font-medium">{transaction.title}</div>
                      <div className="text-xs text-slate-500">{transaction.activityType}</div>
                    </td>
                    <td className="py-3 pr-4 text-slate-600">{transaction.department.name}</td>
                    <td className="py-3 pr-4 font-medium">{transaction.calculatedEmissionsKg.toFixed(2)} kg</td>
                    <td className="py-3 pr-4 text-slate-600">{formatDate(transaction.transactionDate)}</td>
                    <td className="py-3 pr-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="secondary" onClick={() => setEditingTransactionId(transaction.id)}>Edit</Button>
                        <Button size="sm" variant="destructive" onClick={() => environmentalApi.removeTransaction(transaction.id).then(() => queryClient.invalidateQueries({ queryKey: ["environmental", "transactions"] }))}>
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
            <CardTitle>{editingTransactionId ? "Edit transaction" : "Create transaction"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={transactionForm.handleSubmit((values) => transactionMutation.mutate(values))}>
              <Field label="Title" error={transactionForm.formState.errors.title?.message}>
                <Input {...transactionForm.register("title")} />
              </Field>
              <Field label="Activity type" error={transactionForm.formState.errors.activityType?.message}>
                <Input {...transactionForm.register("activityType")} />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Transaction date" error={transactionForm.formState.errors.transactionDate?.message}>
                  <Input type="date" {...transactionForm.register("transactionDate")} />
                </Field>
                <Field label="Department" error={transactionForm.formState.errors.departmentId?.message}>
                  <Select {...transactionForm.register("departmentId")}>
                    <option value="">Select department</option>
                    {departments.map((department) => (
                      <option key={department.id} value={department.id}>{department.name}</option>
                    ))}
                  </Select>
                </Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Employee">
                  <Select {...transactionForm.register("employeeId")}>
                    <option value="">Optional</option>
                    {employees.map((employee) => (
                      <option key={employee.id} value={employee.id}>{employee.employeeCode} - {employee.firstName} {employee.lastName}</option>
                    ))}
                  </Select>
                </Field>
                <Field label="Product">
                  <Select {...transactionForm.register("productId")}>
                    <option value="">Optional</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>{product.sku} - {product.name}</option>
                    ))}
                  </Select>
                </Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Emission factor" error={transactionForm.formState.errors.emissionFactorId?.message}>
                  <Select {...transactionForm.register("emissionFactorId")}>
                    <option value="">Select factor</option>
                    {factors.map((factor) => (
                      <option key={factor.id} value={factor.id}>{factor.name}</option>
                    ))}
                  </Select>
                </Field>
                <Field label="Quantity" error={transactionForm.formState.errors.quantity?.message}>
                  <Input type="number" step="0.001" {...transactionForm.register("quantity", { valueAsNumber: true })} />
                </Field>
              </div>
              <Field label="Manual emissions Kg">
                <Input
                  type="number"
                  step="0.001"
                  {...transactionForm.register("manualEmissionsKg", {
                    setValueAs: (value) => (value === "" || value === null ? undefined : Number(value))
                  })}
                />
              </Field>
              <Field label="Notes">
                <Textarea {...transactionForm.register("notes")} />
              </Field>
              <Field label="Evidence URL">
                <Input {...transactionForm.register("evidenceUrl")} />
              </Field>
              {transactionMutation.error ? <p className="text-sm text-rose-600">{transactionMutation.error.message}</p> : null}
              <div className="flex gap-2">
                <Button type="submit" disabled={transactionMutation.isPending}>{editingTransactionId ? "Update" : "Create"}</Button>
                <Button type="button" variant="secondary" onClick={() => { setEditingTransactionId(null); transactionForm.reset(transactionDefaultValues); }}>
                  Clear
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_0.9fr]">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Environmental goals</CardTitle>
            <Button variant="secondary" size="sm" onClick={() => { setEditingGoalId(null); goalForm.reset(goalDefaultValues); }}>
              New goal
            </Button>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
                <tr>
                  <th className="py-3 pr-4">Goal</th>
                  <th className="py-3 pr-4">Progress</th>
                  <th className="py-3 pr-4">Due</th>
                  <th className="py-3 pr-4">Status</th>
                  <th className="py-3 pr-4"></th>
                </tr>
              </thead>
              <tbody>
                {goals.map((goal) => {
                  const progress =
                    goal.baselineEmissionsKg === goal.targetEmissionsKg
                      ? goal.currentEmissionsKg <= goal.targetEmissionsKg
                        ? 100
                        : 0
                      : Math.max(
                          0,
                          Math.min(
                            100,
                            ((goal.baselineEmissionsKg - goal.currentEmissionsKg) /
                              (goal.baselineEmissionsKg - goal.targetEmissionsKg)) *
                              100
                          )
                        );

                  return (
                    <tr key={goal.id} className="border-b border-slate-100">
                      <td className="py-3 pr-4">
                        <div className="font-medium">{goal.title}</div>
                        <div className="text-xs text-slate-500">{goal.department?.name ?? "Organization-wide"}</div>
                      </td>
                      <td className="py-3 pr-4">{progress.toFixed(0)}%</td>
                      <td className="py-3 pr-4 text-slate-600">{formatDate(goal.dueDate)}</td>
                      <td className="py-3 pr-4">
                        <Badge className={goal.status === "COMPLETED" ? "bg-emerald-100 text-emerald-700" : goal.status === "PAUSED" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"}>
                          {goal.status}
                        </Badge>
                      </td>
                      <td className="py-3 pr-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="secondary" onClick={() => setEditingGoalId(goal.id)}>Edit</Button>
                          <Button size="sm" variant="destructive" onClick={() => environmentalApi.removeGoal(goal.id).then(() => queryClient.invalidateQueries({ queryKey: ["environmental", "goals"] }))}>
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{editingGoalId ? "Edit goal" : "Create goal"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={goalForm.handleSubmit((values) => goalMutation.mutate(values))}>
              <Field label="Title" error={goalForm.formState.errors.title?.message}>
                <Input {...goalForm.register("title")} />
              </Field>
              <Field label="Description">
                <Textarea {...goalForm.register("description")} />
              </Field>
              <Field label="Department">
                <Select {...goalForm.register("departmentId")}>
                  <option value="">Organization-wide</option>
                  {departments.map((department) => (
                    <option key={department.id} value={department.id}>{department.name}</option>
                  ))}
                </Select>
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Baseline emissions Kg" error={goalForm.formState.errors.baselineEmissionsKg?.message}>
                  <Input type="number" step="0.001" {...goalForm.register("baselineEmissionsKg", { valueAsNumber: true })} />
                </Field>
                <Field label="Target emissions Kg" error={goalForm.formState.errors.targetEmissionsKg?.message}>
                  <Input type="number" step="0.001" {...goalForm.register("targetEmissionsKg", { valueAsNumber: true })} />
                </Field>
              </div>
              <Field label="Due date" error={goalForm.formState.errors.dueDate?.message}>
                <Input type="date" {...goalForm.register("dueDate")} />
              </Field>
              <Field label="Status">
                <Select {...goalForm.register("status")}>
                  <option value="ACTIVE">Active</option>
                  <option value="PAUSED">Paused</option>
                  <option value="COMPLETED">Completed</option>
                </Select>
              </Field>
              {goalMutation.error ? <p className="text-sm text-rose-600">{goalMutation.error.message}</p> : null}
              <div className="flex gap-2">
                <Button type="submit" disabled={goalMutation.isPending}>{editingGoalId ? "Update" : "Create"}</Button>
                <Button type="button" variant="secondary" onClick={() => { setEditingGoalId(null); goalForm.reset(goalDefaultValues); }}>
                  Clear
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent emissions</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
              <tr>
                <th className="py-3 pr-4">Transaction</th>
                <th className="py-3 pr-4">Department</th>
                <th className="py-3 pr-4">Factor</th>
                <th className="py-3 pr-4">Emissions</th>
                <th className="py-3 pr-4">Date</th>
              </tr>
            </thead>
            <tbody>
              {(dashboard?.recentTransactions ?? []).map((transaction) => (
                <tr key={transaction.id} className="border-b border-slate-100">
                  <td className="py-3 pr-4">
                    <div className="font-medium">{transaction.title}</div>
                    <div className="text-xs text-slate-500">{transaction.activityType}</div>
                  </td>
                  <td className="py-3 pr-4">{transaction.department.name}</td>
                  <td className="py-3 pr-4 text-slate-600">{transaction.emissionFactor?.name ?? "-"}</td>
                  <td className="py-3 pr-4 font-medium">{transaction.calculatedEmissionsKg.toFixed(2)} kg</td>
                  <td className="py-3 pr-4 text-slate-600">{formatDate(transaction.transactionDate)}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </CardContent>
      </Card>
    </Page>
  );
}
