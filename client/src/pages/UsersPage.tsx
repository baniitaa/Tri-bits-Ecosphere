import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { Page } from "@/components/layout/Page";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table } from "@/components/ui/table";
import { Field } from "@/components/ui/field";
import { usersApi } from "@/api/users";
import { rolesApi } from "@/api/roles";
import { employeesApi } from "@/api/employees";
import { queryClient } from "@/lib/queryClient";
import type { UserFormInput } from "@shared/schemas";

const userSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  roleId: z.string().min(1),
  employeeId: z.string().optional().nullable(),
  password: z.string().min(8).optional(),
  isActive: z.boolean().default(true)
});

type UserForm = z.infer<typeof userSchema>;

export function UsersPage() {
  const [editingId, setEditingId] = useState<string | null>(null);

  const usersQuery = useQuery({
    queryKey: ["users"],
    queryFn: () => usersApi.list("?page=1&pageSize=50")
  });
  const rolesQuery = useQuery({
    queryKey: ["roles", "lookup"],
    queryFn: rolesApi.list
  });
  const employeesQuery = useQuery({
    queryKey: ["employees", "lookup"],
    queryFn: () => employeesApi.list("?page=1&pageSize=100")
  });

  const roles = rolesQuery.data?.data.roles ?? [];
  const employees = employeesQuery.data?.data ?? [];
  const rows = usersQuery.data?.data ?? [];

  const form = useForm<UserForm>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      email: "",
      firstName: "",
      lastName: "",
      roleId: "",
      employeeId: null,
      password: "",
      isActive: true
    }
  });

  useEffect(() => {
    const selected = rows.find((row) => row.id === editingId);
    if (selected) {
      form.reset({
        email: selected.email,
        firstName: selected.firstName,
        lastName: selected.lastName,
        roleId: selected.role.id,
        employeeId: selected.employee?.id ?? null,
        password: "",
        isActive: selected.status === "ACTIVE"
      });
    }
  }, [editingId, rows, form]);

  const mutation = useMutation({
    mutationFn: async (values: UserForm) => {
      const payload: UserFormInput & { password?: string } = {
        email: values.email,
        firstName: values.firstName,
        lastName: values.lastName,
        roleId: values.roleId,
        employeeId: values.employeeId ?? null,
        isActive: values.isActive
      };

      if (editingId) {
        if (values.password) payload.password = values.password;
        return usersApi.update(editingId, payload);
      }

      return usersApi.create({
        ...payload,
        password: values.password ?? ""
      } as UserFormInput & { password: string });
    },
    onSuccess: async () => {
      setEditingId(null);
      form.reset();
      await queryClient.invalidateQueries({ queryKey: ["users"] });
    }
  });

  const employeeOptions = useMemo(() => employees, [employees]);

  return (
    <Page
      title="Users"
      description="Manage login accounts and assign RBAC roles."
      actions={<Button variant="secondary" onClick={() => { setEditingId(null); form.reset(); }}>New User</Button>}
    >
      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Accounts</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
                <tr>
                  <th className="py-3 pr-4">User</th>
                  <th className="py-3 pr-4">Role</th>
                  <th className="py-3 pr-4">Employee</th>
                  <th className="py-3 pr-4">Status</th>
                  <th className="py-3 pr-4"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-b border-slate-100">
                    <td className="py-3 pr-4">
                      <div className="font-medium">{row.firstName} {row.lastName}</div>
                      <div className="text-xs text-slate-500">{row.email}</div>
                    </td>
                    <td className="py-3 pr-4">{row.role.name}</td>
                    <td className="py-3 pr-4 text-slate-600">{row.employee?.employeeCode ?? "-"}</td>
                    <td className="py-3 pr-4">
                      <Badge className={row.status === "ACTIVE" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}>
                        {row.status}
                      </Badge>
                    </td>
                    <td className="py-3 pr-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="secondary" onClick={() => setEditingId(row.id)}>Edit</Button>
                        <Button size="sm" variant="destructive" onClick={() => usersApi.remove(row.id).then(() => queryClient.invalidateQueries({ queryKey: ["users"] }))}>
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
            <CardTitle>{editingId ? "Edit user" : "Create user"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-4"
              onSubmit={form.handleSubmit((values) => {
                if (!editingId && !values.password) {
                  form.setError("password", { type: "manual", message: "Password is required" });
                  return;
                }

                mutation.mutate(values);
              })}
            >
              <Field label="Email" error={form.formState.errors.email?.message}>
                <Input {...form.register("email")} />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="First name" error={form.formState.errors.firstName?.message}>
                  <Input {...form.register("firstName")} />
                </Field>
                <Field label="Last name" error={form.formState.errors.lastName?.message}>
                  <Input {...form.register("lastName")} />
                </Field>
              </div>
              <Field label="Role" error={form.formState.errors.roleId?.message}>
                <Select {...form.register("roleId")}>
                  <option value="">Select role</option>
                  {roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}
                </Select>
              </Field>
              <Field label="Employee">
                <Select {...form.register("employeeId")}>
                  <option value="">Unassigned</option>
                  {employeeOptions.map((employee) => <option key={employee.id} value={employee.id}>{employee.employeeCode} - {employee.firstName} {employee.lastName}</option>)}
                </Select>
              </Field>
              <Field label={editingId ? "New password" : "Password"} error={form.formState.errors.password?.message}>
                <Input type="password" {...form.register("password")} />
              </Field>
              <div className="flex items-center gap-3">
                <Checkbox {...form.register("isActive")} />
                <Label className="mb-0">Active account</Label>
              </div>
              {mutation.error ? <p className="text-sm text-rose-600">{mutation.error.message}</p> : null}
              <div className="flex gap-2">
                <Button type="submit" disabled={mutation.isPending}>
                  {editingId ? "Update" : "Create"}
                </Button>
                <Button type="button" variant="secondary" onClick={() => { setEditingId(null); form.reset(); }}>
                  Clear
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </Page>
  );
}
