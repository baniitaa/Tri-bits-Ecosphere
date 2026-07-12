import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { Page } from "@/components/layout/Page";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table } from "@/components/ui/table";
import { Field } from "@/components/ui/field";
import { Checkbox } from "@/components/ui/checkbox";
import { employeesApi } from "@/api/employees";
import { departmentsApi } from "@/api/departments";
import { usersApi } from "@/api/users";
import { queryClient } from "@/lib/queryClient";

const employeeSchema = z.object({
  employeeCode: z.string().min(2),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  jobTitle: z.string().optional(),
  departmentId: z.string().min(1),
  userId: z.string().optional().nullable(),
  gender: z.enum(["Male", "Female", "Other"]).optional().nullable(),
  employmentType: z.enum(["FULL_TIME", "PART_TIME", "CONTRACT", "INTERN"]).optional().nullable(),
  dateOfJoining: z.string().optional().nullable(),
  isActive: z.boolean().default(true)
});

type EmployeeForm = z.infer<typeof employeeSchema>;

export function EmployeesPage() {
  const [editingId, setEditingId] = useState<string | null>(null);

  const employeesQuery = useQuery({
    queryKey: ["employees"],
    queryFn: () => employeesApi.list("?page=1&pageSize=50")
  });
  const departmentsQuery = useQuery({
    queryKey: ["departments", "lookup"],
    queryFn: () => departmentsApi.list("?page=1&pageSize=100")
  });
  const usersQuery = useQuery({
    queryKey: ["users", "lookup"],
    queryFn: () => usersApi.list("?page=1&pageSize=100")
  });

  const rows = employeesQuery.data?.data ?? [];
  const departments = departmentsQuery.data?.data ?? [];
  const users = usersQuery.data?.data ?? [];

  const form = useForm<EmployeeForm>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      employeeCode: "",
      firstName: "",
      lastName: "",
      email: "",
      jobTitle: "",
      departmentId: "",
      userId: null,
      gender: null,
      employmentType: null,
      dateOfJoining: "",
      isActive: true
    }
  });

  useEffect(() => {
    const selected = rows.find((row) => row.id === editingId);
    if (selected) {
      form.reset({
        employeeCode: selected.employeeCode,
        firstName: selected.firstName,
        lastName: selected.lastName,
        email: selected.email,
        jobTitle: selected.jobTitle ?? "",
        departmentId: selected.department.id,
        userId: selected.user?.id ?? null,
        gender: selected.gender as EmployeeForm["gender"],
        employmentType: selected.employmentType as EmployeeForm["employmentType"],
        dateOfJoining: selected.dateOfJoining ?? "",
        isActive: selected.isActive
      });
    }
  }, [editingId, rows, form]);

  const mutation = useMutation({
    mutationFn: async (values: EmployeeForm) => {
      if (editingId) {
        return employeesApi.update(editingId, values);
      }
      return employeesApi.create(values);
    },
    onSuccess: async () => {
      setEditingId(null);
      form.reset();
      await queryClient.invalidateQueries({ queryKey: ["employees"] });
    }
  });

  return (
    <Page
      title="Employees"
      description="Maintain employee profiles linked to departments and user accounts."
      actions={<Button variant="secondary" onClick={() => { setEditingId(null); form.reset(); }}>New Employee</Button>}
    >
      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Employee list</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
                <tr>
                  <th className="py-3 pr-4">Employee</th>
                  <th className="py-3 pr-4">Department</th>
                  <th className="py-3 pr-4">User</th>
                  <th className="py-3 pr-4">Status</th>
                  <th className="py-3 pr-4"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-b border-slate-100">
                    <td className="py-3 pr-4">
                      <div className="font-medium">{row.employeeCode}</div>
                      <div className="text-xs text-slate-500">{row.firstName} {row.lastName}</div>
                    </td>
                    <td className="py-3 pr-4">{row.department.name}</td>
                    <td className="py-3 pr-4 text-slate-600">{row.user?.email ?? "-"}</td>
                    <td className="py-3 pr-4">
                      <Badge className={row.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}>
                        {row.isActive ? "ACTIVE" : "INACTIVE"}
                      </Badge>
                    </td>
                    <td className="py-3 pr-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="secondary" onClick={() => setEditingId(row.id)}>Edit</Button>
                        <Button size="sm" variant="destructive" onClick={() => employeesApi.remove(row.id).then(() => queryClient.invalidateQueries({ queryKey: ["employees"] }))}>
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
            <CardTitle>{editingId ? "Edit employee" : "Create employee"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Employee code" error={form.formState.errors.employeeCode?.message}>
                  <Input {...form.register("employeeCode")} />
                </Field>
                <Field label="Job title">
                  <Input {...form.register("jobTitle")} />
                </Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="First name" error={form.formState.errors.firstName?.message}>
                  <Input {...form.register("firstName")} />
                </Field>
                <Field label="Last name" error={form.formState.errors.lastName?.message}>
                  <Input {...form.register("lastName")} />
                </Field>
              </div>
              <Field label="Email" error={form.formState.errors.email?.message}>
                <Input type="email" {...form.register("email")} />
              </Field>
              <Field label="Department" error={form.formState.errors.departmentId?.message}>
                <Select {...form.register("departmentId")}>
                  <option value="">Select department</option>
                  {departments.map((department) => (
                    <option key={department.id} value={department.id}>{department.name}</option>
                  ))}
                </Select>
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="User account">
                  <Select {...form.register("userId")}>
                    <option value="">No user account</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>{user.email}</option>
                    ))}
                  </Select>
                </Field>
                <Field label="Date of joining">
                  <Input type="date" {...form.register("dateOfJoining")} />
                </Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Gender">
                  <Select {...form.register("gender")}>
                    <option value="">Not specified</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </Select>
                </Field>
              <Field label="Employment type">
                <Select {...form.register("employmentType")}>
                  <option value="">Not specified</option>
                    <option value="FULL_TIME">Full Time</option>
                    <option value="PART_TIME">Part Time</option>
                    <option value="CONTRACT">Contract</option>
                    <option value="INTERN">Intern</option>
                  </Select>
                </Field>
              </div>
              <div className="flex items-center gap-3">
                <Checkbox {...form.register("isActive")} />
                <span className="text-sm text-slate-700">Active employee</span>
              </div>
              {mutation.error ? <p className="text-sm text-rose-600">{mutation.error.message}</p> : null}
              <div className="flex gap-2">
                <Button type="submit" disabled={mutation.isPending}>{editingId ? "Update" : "Create"}</Button>
                <Button type="button" variant="secondary" onClick={() => { setEditingId(null); form.reset(); }}>Clear</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </Page>
  );
}
