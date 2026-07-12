import { useMutation, useQuery } from "@tanstack/react-query";
import { Bell, CheckCheck } from "lucide-react";
import { notificationsApi } from "@/api/notifications";
import { Page } from "@/components/layout/Page";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { queryClient } from "@/lib/queryClient";

const formatDate = (value: string) => new Date(value).toLocaleString();

export function NotificationsPage() {
  const notificationsQuery = useQuery({
    queryKey: ["notifications"],
    queryFn: notificationsApi.list
  });

  const unreadQuery = useQuery({
    queryKey: ["notifications", "unread"],
    queryFn: notificationsApi.unreadCount
  });

  const markAllMutation = useMutation({
    mutationFn: notificationsApi.markAllRead,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["notifications"] });
      await queryClient.invalidateQueries({ queryKey: ["notifications", "unread"] });
    }
  });

  const notifications = notificationsQuery.data?.data ?? [];
  const unreadCount = unreadQuery.data?.data.unreadCount ?? 0;

  return (
    <Page title="Notifications" description="In-app notifications from governance, gamification, and approvals.">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent>
            <p className="text-sm text-slate-500">Unread</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">{unreadCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-sm text-slate-500">Total</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">{notifications.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3">
            <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Event feed</p>
              <p className="font-medium text-slate-900">Live in-app alerts</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3">
            <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700">
              <CheckCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Actions</p>
              <Button size="sm" onClick={() => markAllMutation.mutate()} disabled={markAllMutation.isPending}>
                Mark all read
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Inbox</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {notifications.map((notification) => (
            <div key={notification.id} className={`rounded-2xl border p-4 ${notification.isRead ? "border-slate-200 bg-white" : "border-slate-300 bg-slate-50"}`}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-slate-900">{notification.title}</p>
                    <Badge className={notification.isRead ? "bg-slate-100 text-slate-600" : "bg-emerald-100 text-emerald-700"}>
                      {notification.type}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-slate-600">{notification.message}</p>
                  <p className="mt-2 text-xs text-slate-500">{formatDate(notification.createdAt)}</p>
                </div>
                {!notification.isRead ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() =>
                      notificationsApi.markRead(notification.id).then(async () => {
                        await queryClient.invalidateQueries({ queryKey: ["notifications"] });
                        await queryClient.invalidateQueries({ queryKey: ["notifications", "unread"] });
                      })
                    }
                  >
                    Mark read
                  </Button>
                ) : null}
              </div>
            </div>
          ))}

          {!notifications.length ? <p className="py-8 text-center text-sm text-slate-500">No notifications yet.</p> : null}
        </CardContent>
      </Card>
    </Page>
  );
}
