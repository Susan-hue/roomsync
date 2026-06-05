import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Plus, Trash2, Download } from "lucide-react";
import { RequireAuth, StatusBadge } from "@/components/AppLayout";
import { api, type Booking, type Room } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";

export const Route = createFileRoute("/admin")({ component: () => <RequireAuth admin><AdminPage /></RequireAuth> });

const AMENITIES = ["wifi", "projector", "whiteboard", "ac", "outlets"];

function AdminPage() {
  const [stats, setStats] = useState<any>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filters, setFilters] = useState<{ status?: string; room?: string; date?: string }>({});

  const load = () => {
    api.analytics().then(setStats).catch(() => {});
    api.rooms().then(setRooms).catch(() => {});
    api.allBookings(filters).then(setBookings).catch(() => {});
  };
  useEffect(() => { load(); }, [filters.status, filters.room, filters.date]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage rooms, monitor utilization, and review every booking.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Rooms" value={stats?.total_rooms ?? "—"} />
        <StatCard label="Bookings This Week" value={stats?.bookings_week ?? "—"} />
        <StatCard label="Bookings This Month" value={stats?.bookings_month ?? "—"} />
        <StatCard label="Most Popular Room" value={stats?.most_popular_room ?? "—"} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartCard title="Room Utilization">
          {stats && (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={stats.utilization}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                <YAxis tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid var(--border)", fontSize: 12 }} />
                <Bar dataKey="bookings" fill="var(--primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
        <ChartCard title="Peak Hours">
          {stats && (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={stats.peak_hours}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="hour" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                <YAxis tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid var(--border)", fontSize: 12 }} />
                <Line type="monotone" dataKey="bookings" stroke="var(--primary)" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-base font-semibold">All Bookings</h2>
          <div className="flex flex-wrap gap-2">
            <Select value={filters.status ?? "all"} onValueChange={(v) => setFilters({ ...filters, status: v === "all" ? undefined : v })}>
              <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filters.room ?? "all"} onValueChange={(v) => setFilters({ ...filters, room: v === "all" ? undefined : v })}>
              <SelectTrigger className="w-44"><SelectValue placeholder="Room" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All rooms</SelectItem>
                {rooms.map((r) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input type="date" className="w-40" value={filters.date ?? ""} onChange={(e) => setFilters({ ...filters, date: e.target.value || undefined })} />
            <Button variant="outline" size="sm" onClick={() => exportCsv(bookings)}>
              <Download className="mr-1.5 h-3.5 w-3.5" /> Export CSV
            </Button>
          </div>
        </div>
        <div className="overflow-hidden rounded-lg border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b bg-surface text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5 text-left font-medium">User</th>
                <th className="px-4 py-2.5 text-left font-medium">Room</th>
                <th className="px-4 py-2.5 text-left font-medium">Date</th>
                <th className="px-4 py-2.5 text-left font-medium">Time</th>
                <th className="px-4 py-2.5 text-left font-medium">Status</th>
                <th className="px-4 py-2.5 text-left font-medium">Purpose</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b, i) => (
                <tr key={b.id} className={i % 2 ? "bg-surface" : ""}>
                  <td className="px-4 py-3">{b.user_name} <span className="ml-1 text-xs capitalize text-muted-foreground">({b.user_role})</span></td>
                  <td className="px-4 py-3">{b.room_name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{b.date}</td>
                  <td className="px-4 py-3 text-muted-foreground">{b.start_time} – {b.end_time}</td>
                  <td className="px-4 py-3"><StatusBadge status={b.status} /></td>
                  <td className="px-4 py-3 text-muted-foreground">{b.purpose}</td>
                </tr>
              ))}
              {bookings.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No bookings match.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Manage Rooms</h2>
          <RoomFormDialog
            trigger={<Button size="sm"><Plus className="mr-1 h-3.5 w-3.5" /> Add New Room</Button>}
            onSave={async (data) => { await api.createRoom(data); toast.success("Room created"); load(); }}
          />
        </div>
        <div className="overflow-hidden rounded-lg border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b bg-surface text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5 text-left font-medium">Name</th>
                <th className="px-4 py-2.5 text-left font-medium">Type</th>
                <th className="px-4 py-2.5 text-left font-medium">Capacity</th>
                <th className="px-4 py-2.5 text-left font-medium">Location</th>
                <th className="px-4 py-2.5 text-left font-medium">Rate</th>
                <th className="px-4 py-2.5 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rooms.map((r, i) => (
                <tr key={r.id} className={i % 2 ? "bg-surface" : ""}>
                  <td className="px-4 py-3 font-medium">{r.name}</td>
                  <td className="px-4 py-3 capitalize text-muted-foreground">{r.room_type.replace("_", " ")}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.capacity}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.location}</td>
                  <td className="px-4 py-3 text-muted-foreground">₦{r.hourly_rate.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex gap-2">
                      <RoomFormDialog
                        trigger={<Button variant="outline" size="sm">Edit</Button>}
                        initial={r}
                        onSave={async (data) => { await api.updateRoom(r.id, data); toast.success("Room updated"); load(); }}
                      />
                      <Button variant="outline" size="sm" onClick={async () => { await api.deleteRoom(r.id); toast.success("Room deleted"); load(); }}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <RoomFormDialog
        trigger={
          <Button
            size="icon"
            className="fixed bottom-6 right-6 h-12 w-12 rounded-full shadow-lg z-40"
            title="Create room"
          >
            <Plus className="h-5 w-5" />
          </Button>
        }
        onSave={async (data) => { await api.createRoom(data); toast.success("Room created"); load(); }}
      />
    </div>
  );
}

function exportCsv(bookings: Booking[]) {
  const headers = ["User", "Role", "Room", "Date", "Start", "End", "Status", "Purpose"];
  const esc = (v: any) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const rows = bookings.map((b) => [b.user_name, b.user_role, b.room_name, b.date, b.start_time, b.end_time, b.status, b.purpose].map(esc).join(","));
  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `bookings-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function StatCard({ label, value }: { label: string; value: any }) {
  return (
    <div className="rounded-lg border bg-card p-5">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="mt-2 text-2xl font-semibold tracking-tight">{value}</div>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border bg-card p-5">
      <h3 className="text-sm font-semibold">{title}</h3>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function RoomFormDialog({ trigger, initial, onSave }: { trigger: React.ReactNode; initial?: Room; onSave: (d: Omit<Room, "id">) => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<Omit<Room, "id">>({
    name: initial?.name ?? "",
    room_type: initial?.room_type ?? "study_room",
    capacity: initial?.capacity ?? 4,
    location: initial?.location ?? "",
    amenities: initial?.amenities ?? [],
    hourly_rate: initial?.hourly_rate ?? 500,
    description: initial?.description ?? "",
  });

  const toggleAm = (a: string) => setData((d) => ({ ...d, amenities: d.amenities.includes(a) ? d.amenities.filter((x) => x !== a) : [...d.amenities, a] }));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>{initial ? "Edit Room" : "Add New Room"}</DialogTitle></DialogHeader>
        <div className="grid gap-4">
          <div className="space-y-1.5"><Label>Name</Label><Input value={data.name} onChange={(e) => setData({ ...data, name: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={data.room_type} onValueChange={(v: any) => setData({ ...data, room_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="study_room">Study Room</SelectItem>
                  <SelectItem value="lab">Lab</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Capacity</Label><Input type="number" value={data.capacity} onChange={(e) => setData({ ...data, capacity: +e.target.value })} /></div>
          </div>
          <div className="space-y-1.5"><Label>Location</Label><Input value={data.location} onChange={(e) => setData({ ...data, location: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>Hourly Rate (₦)</Label><Input type="number" value={data.hourly_rate} onChange={(e) => setData({ ...data, hourly_rate: +e.target.value })} /></div>
          <div className="space-y-2">
            <Label>Amenities</Label>
            <div className="grid grid-cols-3 gap-2">
              {AMENITIES.map((a) => (
                <label key={a} className="flex items-center gap-2 text-sm capitalize">
                  <Checkbox checked={data.amenities.includes(a)} onCheckedChange={() => toggleAm(a)} /> {a}
                </label>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={async () => { await onSave(data); setOpen(false); }}>{initial ? "Save changes" : "Create room"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
