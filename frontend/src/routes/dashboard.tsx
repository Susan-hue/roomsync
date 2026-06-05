import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CalendarDays, Clock, DoorOpen } from "lucide-react";
import { RequireAuth, StatusBadge } from "@/components/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { api, type Booking, type Room } from "@/services/api";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/dashboard")({ component: () => <RequireAuth><Dashboard /></RequireAuth> });

function Stat({ label, value, icon: Icon }: { label: string; value: number | string; icon: any }) {
  return (
    <div className="rounded-lg border bg-card p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="mt-2 text-2xl font-semibold tracking-tight">{value}</div>
    </div>
  );
}

function Dashboard() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);

  useEffect(() => {
    api.myBookings().then(setBookings).catch(() => {});
    api.rooms().then(setRooms).catch(() => {});
  }, []);

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = bookings.filter((b) => b.status !== "cancelled" && b.date >= today).sort((a, b) => (a.date + a.start_time).localeCompare(b.date + b.start_time));
  const todays = bookings.filter((b) => b.date === today && b.status !== "cancelled");
  const popular = rooms.slice(0, 3);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Welcome back, {user?.full_name?.split(" ")[0]}</h1>
        <p className="mt-1 text-sm text-muted-foreground">Here's a quick look at your bookings and rooms.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Stat label="Upcoming Bookings" value={upcoming.length} icon={CalendarDays} />
        <Stat label="Bookings Today" value={todays.length} icon={Clock} />
        <Stat label="Rooms Available" value={rooms.length} icon={DoorOpen} />
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold">Upcoming Bookings</h2>
          <Link to="/bookings" className="text-sm text-primary hover:underline">View all</Link>
        </div>
        <div className="overflow-hidden rounded-lg border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b bg-surface text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5 text-left font-medium">Room</th>
                <th className="px-4 py-2.5 text-left font-medium">Date</th>
                <th className="px-4 py-2.5 text-left font-medium">Time</th>
                <th className="px-4 py-2.5 text-left font-medium">Status</th>
                <th className="px-4 py-2.5 text-left font-medium">Purpose</th>
              </tr>
            </thead>
            <tbody>
              {upcoming.slice(0, 5).map((b, i) => (
                <tr key={b.id} className={i % 2 ? "bg-surface" : ""}>
                  <td className="px-4 py-3 font-medium">{b.room_name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{b.date}</td>
                  <td className="px-4 py-3 text-muted-foreground">{b.start_time} – {b.end_time}</td>
                  <td className="px-4 py-3"><StatusBadge status={b.status} /></td>
                  <td className="px-4 py-3 text-muted-foreground">{b.purpose}</td>
                </tr>
              ))}
              {upcoming.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-muted-foreground">No upcoming bookings.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-base font-semibold">Quick Book</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {popular.map((r) => (
            <div key={r.id} className="rounded-lg border bg-card p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm font-semibold">{r.name}</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">{r.location}</div>
                </div>
                <span className="rounded-md bg-secondary px-1.5 py-0.5 text-xs capitalize text-secondary-foreground">{r.room_type.replace("_", " ")}</span>
              </div>
              <div className="mt-3 text-xs text-muted-foreground">Capacity {r.capacity} · ₦{r.hourly_rate}/hr</div>
              <Link to="/rooms/$id" params={{ id: r.id }} className="mt-4 block">
                <Button size="sm" className="w-full">Book Now</Button>
              </Link>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
