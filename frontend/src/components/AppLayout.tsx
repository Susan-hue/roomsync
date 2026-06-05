import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, DoorOpen, CalendarCheck, Bell, Shield, Settings,
  LogOut, Menu, X, Sun, Moon,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { api } from "@/services/api";

export function AppLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const { location } = useRouterState();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const fetchUnread = () => {
      api.notifications()
        .then((n) => { if (!cancelled) setUnread(n.filter((x) => !x.read).length); })
        .catch(() => {});
    };
    fetchUnread();
    const id = window.setInterval(fetchUnread, 60_000);
    return () => { cancelled = true; window.clearInterval(id); };
  }, []);

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const nav = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/rooms", label: "Browse Rooms", icon: DoorOpen },
    { to: "/bookings", label: "My Bookings", icon: CalendarCheck },
    { to: "/notifications", label: "Notifications", icon: Bell, badge: unread },
    { to: "/profile", label: "Settings", icon: Settings },
    ...(user?.role === "admin" ? [{ to: "/admin", label: "Admin", icon: Shield }] : []),
  ];

  const handleLogout = async () => { await logout(); navigate({ to: "/" }); };
  const initials = user?.full_name?.split(" ").map((p) => p[0]).slice(0, 2).join("") || "U";

  const SidebarInner = (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center px-5">
        <span className="text-[15px] font-medium tracking-tight text-foreground">RoomSync</span>
      </div>
      <nav className="flex-1 space-y-0.5 px-3 py-2">
        {nav.map((n) => {
          const active = location.pathname === n.to || (n.to !== "/dashboard" && location.pathname.startsWith(n.to));
          const Icon = n.icon;
          return (
            <Link
              key={n.to} to={n.to}
              className={
                "group flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm transition-colors " +
                (active
                  ? "bg-primary/15 text-primary font-medium"
                  : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground")
              }
            >
              <Icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
              <span className="flex-1 truncate">{n.label}</span>
              {"badge" in n && (n.badge ?? 0) > 0 && (
                <span className="ml-auto rounded bg-primary px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground">{n.badge}</span>
              )}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-sidebar-border p-3">
        <div className="flex items-center gap-2.5 rounded-md px-2 py-1.5">
          <div className="grid h-8 w-8 place-items-center rounded-full bg-primary/15 text-[11px] font-medium text-primary">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-xs font-medium text-foreground">{user?.full_name}</div>
            {user?.role && (
              <span className="mt-0.5 inline-flex rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium capitalize text-primary">
                {user.role}
              </span>
            )}
          </div>
          <button
            onClick={toggle} title="Toggle theme"
            className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
          >
            {theme === "dark" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
          </button>
          <button
            onClick={handleLogout} title="Sign out"
            className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 border-r border-sidebar-border bg-sidebar md:block">
        {SidebarInner}
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-20 flex h-12 items-center justify-between border-b border-border bg-background px-4 md:hidden">
        <span className="text-sm font-medium">RoomSync</span>
        <button
          onClick={() => setMobileOpen((v) => !v)}
          className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:bg-secondary"
        >
          {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <>
          <div className="fixed inset-0 z-30 bg-foreground/20 md:hidden" onClick={() => setMobileOpen(false)} />
          <aside className="fixed inset-y-0 left-0 z-40 w-60 border-r border-sidebar-border bg-sidebar md:hidden">
            {SidebarInner}
          </aside>
        </>
      )}

      <main className="md:pl-60">
        <div className="mx-auto max-w-6xl px-6 py-10">{children}</div>
      </main>
    </div>
  );
}

export function RequireAuth({ children, admin = false }: { children: ReactNode; admin?: boolean }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (!user) navigate({ to: "/unauthorized" });
    else if (admin && user.role !== "admin") navigate({ to: "/unauthorized" });
  }, [user, admin, navigate]);
  if (!user) return null;
  if (admin && user.role !== "admin") return null;
  return <AppLayout>{children}</AppLayout>;
}

export function StatusBadge({ status }: { status: "confirmed" | "pending" | "cancelled" }) {
  const map = {
    confirmed: "bg-success/10 text-success border-success/20",
    pending: "bg-warning/15 text-warning-foreground border-warning/30",
    cancelled: "bg-destructive/10 text-destructive border-destructive/20",
  } as const;
  return (
    <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium capitalize ${map[status]}`}>
      {status}
    </span>
  );
}
