import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { Page } from "@/components/layout/Page";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table } from "@/components/ui/table";
import { Field } from "@/components/ui/field";
import { rolesApi, type Permission, type RoleRow } from "@/api/roles";
import { queryClient } from "@/lib/queryClient";

const roleSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
  permissionIds: z.array(z.string()).default([])
});

type RoleForm = z.infer<typeof roleSchema>;

export function RolesPage() {
  const [editingId, setEditingId] = useState<string | null>(null);

  const rolesQuery = useQuery({
    queryKey: ["roles"],
    queryFn: rolesApi.list
  });
  const permissionsQuery = useQuery({
    queryKey: ["role-permissions"],
    queryFn: rolesApi.permissions
  });

  const roles = rolesQuery.data?.data.roles ?? [];
  const permissions = permissionsQuery.data?.data.permissions ?? [];
  const groupedPermissions = permissionsQuery.data?.data.grouped ?? {};

  const form = useForm<RoleForm>({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      name: "",
      description: "",
      isActive: true,
      permissionIds: []
    }
  });

  useEffect(() => {
    const selected = roles.find((role) => role.id === editingId);
    if (selected) {
      form.reset({
        name: selected.name,
        description: selected.description ?? "",
        isActive: selected.isActive,
        permissionIds: selected.permissions.map((permission) => permission.id)
      });
    }
  }, [editingId, roles, form]);

  const mutation = useMutation({
    mutationFn: async (values: RoleForm) => {
      if (editingId) {
        return rolesApi.update(editingId, values);
      }
      return rolesApi.create(values);
    },
    onSuccess: async () => {
      setEditingId(null);
      form.reset();
      await queryClient.invalidateQueries({ queryKey: ["roles"] });
      await queryClient.invalidateQueries({ queryKey: ["role-permissions"] });
    }
  });

  const togglePermission = (permissionId: string) => {
    const current = new Set(form.getValues("permissionIds"));
    if (current.has(permissionId)) {
      current.delete(permissionId);
    } else {
      current.add(permissionId);
    }
    form.setValue("permissionIds", Array.from(current), { shouldDirty: true });
  };

  const permissionGroups = useMemo(() => Object.entries(groupedPermissions), [groupedPermissions]);

  return (
    <Page
      title="Roles"
      description="Create custom roles and assign granular permissions."
      actions={<Button variant="secondary" onClick={() => { setEditingId(null); form.reset(); }}>New Role</Button>}
    >
      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Role list</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
                <tr>
                  <th className="py-3 pr-4">Role</th>
                  <th className="py-3 pr-4">Permissions</th>
                  <th className="py-3 pr-4">System</th>
                  <th className="py-3 pr-4"></th>
                </tr>
              </thead>
              <tbody>
                {roles.map((role) => (
                  <tr key={role.id} className="border-b border-slate-100">
                    <td className="py-3 pr-4">
                      <div className="font-medium">{role.name}</div>
                      <div className="text-xs text-slate-500">{role.description ?? "No description"}</div>
                    </td>
                    <td className="py-3 pr-4">{role.permissions.length}</td>
                    <td className="py-3 pr-4">
                      <Badge className={role.isSystem ? "bg-sky-100 text-sky-700" : "bg-slate-100 text-slate-500"}>
                        {role.isSystem ? "System" : "Custom"}
                      </Badge>
                    </td>
                    <td className="py-3 pr-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="secondary" onClick={() => setEditingId(role.id)}>Edit</Button>
                        {!role.isSystem ? (
                          <Button size="sm" variant="destructive" onClick={() => rolesApi.remove(role.id).then(() => queryClient.invalidateQueries({ queryKey: ["roles"] }))}>
                            Delete
                          </Button>
                        ) : null}
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
            <CardTitle>{editingId ? "Edit role" : "Create role"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
              <Field label="Name" error={form.formState.errors.name?.message}>
                <Input {...form.register("name")} />
              </Field>
              <Field label="Description">
                <Textarea {...form.register("description")} />
              </Field>
              <div className="flex items-center gap-3">
                <Checkbox {...form.register("isActive")} />
                <span className="text-sm text-slate-700">Active role</span>
              </div>
              <div className="space-y-4">
                <p className="text-sm font-medium text-slate-700">Permissions</p>
                {permissionGroups.map(([module, modulePermissions]) => (
                  <div key={module} className="rounded-2xl border border-slate-200 p-4">
                    <p className="mb-3 text-sm font-semibold text-slate-900">{module}</p>
                    <div className="space-y-2">
                      {modulePermissions.map((permission) => (
                        <label key={permission.id} className="flex items-center gap-3 text-sm text-slate-600">
                          <Checkbox checked={form.watch("permissionIds").includes(permission.id)} onChange={() => togglePermission(permission.id)} />
                          <span>{permission.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
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
