import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { RequireAuth, StatusBadge } from "@/components/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { api, type Booking } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/bookings")({ component: () => <RequireAuth><BookingsPage /></RequireAuth> });

function formatDate(d: string) {
  const dt = new Date(d + "T00:00:00");
  return dt.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
}
function formatTime(t: string) {
  const [h, m] = t.split(":").map(Number);
  const dt = new Date();
  dt.setHours(h || 0, m || 0, 0, 0);
  return dt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}

const ROW_TINT: Record<Booking["status"], string> = {
  confirmed: "bg-success/5 hover:bg-success/10",
  pending: "bg-warning/5 hover:bg-warning/10",
  cancelled: "bg-destructive/5 hover:bg-destructive/10",
};

function BookingsPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [tab, setTab] = useState<string>("upcoming");

  const load = () => api.myBookings().then(setBookings).catch(() => {});
  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem("roomsync_just_rebooked")) {
      sessionStorage.removeItem("roomsync_just_rebooked");
      setStatusFilter("confirmed");
      setTab("upcoming");
      load();
    }
  }, []);

  const cancel = async (id: string) => {
    try { await api.cancelBooking(id); toast.success("Booking cancelled"); load(); }
    catch (e: any) { toast.error(e.message); }
  };

  const today = new Date().toISOString().slice(0, 10);
  const filteredAll = useMemo(
    () => statusFilter === "all" ? bookings : bookings.filter((b) => b.status === statusFilter),
    [bookings, statusFilter]
  );
  // Upcoming: only future, non-cancelled. Past: everything else (past dates + all cancelled).
  const upcoming = filteredAll.filter((b) => b.status !== "cancelled" && b.date >= today);
  const past = filteredAll.filter((b) => b.status === "cancelled" || b.date < today);

  const Table = ({ list, allowCancel }: { list: Booking[]; allowCancel: boolean }) => (
    <div className="overflow-hidden rounded-lg border bg-card">
      <table className="w-full text-sm">
        <thead className="border-b bg-surface text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-4 py-2.5 text-left font-medium">Room</th>
            <th className="px-4 py-2.5 text-left font-medium">Date</th>
            <th className="px-4 py-2.5 text-left font-medium">Time</th>
            <th className="px-4 py-2.5 text-left font-medium">Status</th>
            <th className="px-4 py-2.5 text-left font-medium">Purpose</th>
            <th className="px-4 py-2.5 text-right font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {list.map((b) => (
            <tr key={b.id} className={`transition-colors ${ROW_TINT[b.status]}`}>
              <td className="px-4 py-3">
                <div className="font-medium">{b.room_name}</div>
                {user?.role === "lecturer" && (
                  <span className="mt-0.5 inline-flex rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">Priority</span>
                )}
              </td>
              <td className="px-4 py-3 text-muted-foreground">{formatDate(b.date)}</td>
              <td className="px-4 py-3 text-muted-foreground">{formatTime(b.start_time)} – {formatTime(b.end_time)}</td>
              <td className="px-4 py-3"><StatusBadge status={b.status} /></td>
              <td className="px-4 py-3 text-muted-foreground">{b.purpose}</td>
              <td className="px-4 py-3 text-right">
                {b.status === "cancelled" && (
                  <Link to="/rooms/$id" params={{ id: b.room }} search={{ rebook: 1 }}>
                    <Button variant="outline" size="sm">Rebook</Button>
                  </Link>
                )}
                {allowCancel && b.status !== "cancelled" && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm">Cancel</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Cancel booking?</AlertDialogTitle>
                        <AlertDialogDescription>Are you sure you want to cancel this booking? This action cannot be undone.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Keep booking</AlertDialogCancel>
                        <AlertDialogAction onClick={() => cancel(b.id)}>Yes, cancel</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </td>
            </tr>
          ))}
          {list.length === 0 && (
            <tr><td colSpan={6} className="px-4 py-12 text-center text-sm text-muted-foreground">
              No bookings yet. <Link to="/rooms" className="text-primary hover:underline">Browse rooms</Link> to make your first booking.
            </td></tr>
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">My Bookings</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage your upcoming and past room bookings.</p>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming ({upcoming.length})</TabsTrigger>
          <TabsTrigger value="past">Past ({past.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="upcoming" className="mt-4"><Table list={upcoming} allowCancel /></TabsContent>
        <TabsContent value="past" className="mt-4"><Table list={past} allowCancel={false} /></TabsContent>
      </Tabs>
    </div>
  );
}
