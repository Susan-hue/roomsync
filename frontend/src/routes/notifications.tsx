import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Bell, Clock, XCircle, CheckCheck } from "lucide-react";
import { RequireAuth } from "@/components/AppLayout";
import { api, type Notification } from "@/services/api";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/notifications")({ component: () => <RequireAuth><NotifPage /></RequireAuth> });

const iconFor = { confirmed: Bell, reminder: Clock, cancelled: XCircle };

function bucketFor(iso: string): "Today" | "Yesterday" | "Earlier" {
  const d = new Date(iso);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const yest = new Date(today); yest.setDate(yest.getDate() - 1);
  if (d >= today) return "Today";
  if (d >= yest) return "Yesterday";
  return "Earlier";
}

function NotifPage() {
  const [items, setItems] = useState<Notification[]>([]);
  const load = () => api.notifications().then(setItems).catch(() => {});

  useEffect(() => {
    load();
    const id = window.setInterval(load, 30_000);
    return () => window.clearInterval(id);
  }, []);

  const markRead = async (id: string) => { await api.markRead(id).catch(() => {}); load(); };
  const markAllRead = async () => {
    await Promise.all(items.filter((n) => !n.read).map((n) => api.markRead(n.id).catch(() => {})));
    load();
  };

  const groups = useMemo(() => {
    const g: Record<string, Notification[]> = { Today: [], Yesterday: [], Earlier: [] };
    for (const n of items) g[bucketFor(n.created_at)].push(n);
    return g;
  }, [items]);

  const hasUnread = items.some((n) => !n.read);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Notifications</h1>
          <p className="mt-1 text-sm text-muted-foreground">Booking confirmations, reminders, and cancellations.</p>
        </div>
        {hasUnread && (
          <Button variant="outline" size="sm" onClick={markAllRead}>
            <CheckCheck className="mr-1.5 h-3.5 w-3.5" /> Mark all as read
          </Button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="rounded-lg border bg-card p-12 text-center">
          <Bell className="mx-auto h-10 w-10 text-muted-foreground/50" strokeWidth={1.5} />
          <p className="mt-3 text-sm font-medium">No notifications yet</p>
          <p className="mt-1 text-xs text-muted-foreground">You'll see booking updates here.</p>
        </div>
      ) : (
        (["Today", "Yesterday", "Earlier"] as const).map((label) => groups[label].length > 0 && (
          <section key={label} className="space-y-2">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</h2>
            <div className="space-y-2">
              {groups[label].map((n) => {
                const Icon = iconFor[n.type];
                return (
                  <button key={n.id} onClick={() => markRead(n.id)}
                    className="flex w-full items-start gap-3 rounded-lg border bg-card p-4 text-left transition-colors hover:bg-surface">
                    <div className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-md bg-secondary">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-foreground">{n.message}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{new Date(n.created_at).toLocaleString()}</p>
                    </div>
                    {!n.read && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" />}
                  </button>
                );
              })}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
