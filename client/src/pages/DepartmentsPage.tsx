import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { z } from "zod";
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
import { departmentsApi } from "@/api/departments";
import { employeesApi } from "@/api/employees";
import { queryClient } from "@/lib/queryClient";

const departmentSchema = z.object({
  code: z.string().min(2),
  name: z.string().min(2),
  description: z.string().optional(),
  managerEmployeeId: z.string().optional().nullable(),
  isActive: z.boolean().default(true)
});

type DepartmentForm = z.infer<typeof departmentSchema>;

export function DepartmentsPage() {
  const [editingId, setEditingId] = useState<string | null>(null);

  const departmentsQuery = useQuery({
    queryKey: ["departments"],
    queryFn: () => departmentsApi.list("?page=1&pageSize=50")
  });
  const employeesQuery = useQuery({
    queryKey: ["employees", "department-manager"],
    queryFn: () => employeesApi.list("?page=1&pageSize=100")
  });

  const rows = departmentsQuery.data?.data ?? [];
  const employees = employeesQuery.data?.data ?? [];

  const form = useForm<DepartmentForm>({
    resolver: zodResolver(departmentSchema),
    defaultValues: {
      code: "",
      name: "",
      description: "",
      managerEmployeeId: null,
      isActive: true
    }
  });

  useEffect(() => {
    const selected = rows.find((row) => row.id === editingId);
    if (selected) {
      form.reset({
        code: selected.code,
        name: selected.name,
        description: selected.description ?? "",
        managerEmployeeId: selected.managerEmployee?.id ?? null,
        isActive: selected.status === "ACTIVE"
      });
    }
  }, [editingId, rows, form]);

  const mutation = useMutation({
    mutationFn: async (values: DepartmentForm) => {
      if (editingId) {
        return departmentsApi.update(editingId, values);
      }
      return departmentsApi.create(values);
    },
    onSuccess: async () => {
      setEditingId(null);
      form.reset();
      await queryClient.invalidateQueries({ queryKey: ["departments"] });
    }
  });

  return (
    <Page
      title="Departments"
      description="Organize ESG ownership by department."
      actions={<Button variant="secondary" onClick={() => { setEditingId(null); form.reset(); }}>New Department</Button>}
    >
      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Department list</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
                <tr>
                  <th className="py-3 pr-4">Code</th>
                  <th className="py-3 pr-4">Name</th>
                  <th className="py-3 pr-4">Employees</th>
                  <th className="py-3 pr-4">Status</th>
                  <th className="py-3 pr-4"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-b border-slate-100">
                    <td className="py-3 pr-4 font-medium">{row.code}</td>
                    <td className="py-3 pr-4">
                      <div>{row.name}</div>
                      <div className="text-xs text-slate-500">{row.managerEmployee ? `Manager: ${row.managerEmployee.firstName} ${row.managerEmployee.lastName}` : "No manager assigned"}</div>
                    </td>
                    <td className="py-3 pr-4">{row._count.employees}</td>
                    <td className="py-3 pr-4">
                      <Badge className={row.status === "ACTIVE" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}>
                        {row.status}
                      </Badge>
                    </td>
                    <td className="py-3 pr-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="secondary" onClick={() => setEditingId(row.id)}>Edit</Button>
                        <Button size="sm" variant="destructive" onClick={() => departmentsApi.remove(row.id).then(() => queryClient.invalidateQueries({ queryKey: ["departments"] }))}>
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
            <CardTitle>{editingId ? "Edit department" : "Create department"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
              <Field label="Code" error={form.formState.errors.code?.message}>
                <Input {...form.register("code")} />
              </Field>
              <Field label="Name" error={form.formState.errors.name?.message}>
                <Input {...form.register("name")} />
              </Field>
              <Field label="Description">
                <Textarea {...form.register("description")} />
              </Field>
              <Field label="Department manager">
                <Select {...form.register("managerEmployeeId")}>
                  <option value="">Unassigned</option>
                  {employees.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.employeeCode} - {employee.firstName} {employee.lastName}
                    </option>
                  ))}
                </Select>
              </Field>
              <div className="flex items-center gap-3">
                <Checkbox {...form.register("isActive")} />
                <span className="text-sm text-slate-700">Active department</span>
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
