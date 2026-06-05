import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Search, Users, Building2, DoorOpen } from "lucide-react";
import { RequireAuth } from "@/components/AppLayout";
import { api, type Room } from "@/services/api";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/rooms/")({ component: () => <RequireAuth><RoomsPage /></RequireAuth> });

function RoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [type, setType] = useState("all");
  const [capacity, setCapacity] = useState([0]);
  const [loc, setLoc] = useState("");
  const [q, setQ] = useState("");

  useEffect(() => { api.rooms().then(setRooms).catch(() => {}); }, []);

  const filtered = useMemo(() => {
    const list = rooms.filter((r) =>
      (type === "all" || r.room_type === type) &&
      r.capacity >= capacity[0] &&
      r.location.toLowerCase().includes(loc.toLowerCase()) &&
      r.name.toLowerCase().includes(q.toLowerCase())
    );
    // Available first
    return list.sort((a, b) => Number(b.is_available ?? true) - Number(a.is_available ?? true));
  }, [rooms, type, capacity, loc, q]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Browse Rooms</h1>
        <p className="mt-1 text-sm text-muted-foreground">Find a study room or lab that fits your needs.</p>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input className="pl-9" placeholder="Search rooms by name…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <div className="rounded-lg border bg-card p-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Room Type</label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="study_room">Study Room</SelectItem>
                <SelectItem value="lab">Lab</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Min Capacity: {capacity[0]}</label>
            <Slider value={capacity} onValueChange={setCapacity} min={0} max={30} step={1} />
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-xs font-medium text-muted-foreground">Location</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input className="pl-8" placeholder="Search location…" value={loc} onChange={(e) => setLoc(e.target.value)} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((r) => {
          const available = r.is_available ?? true;
          return (
            <div key={r.id} className="flex flex-col overflow-hidden rounded-lg border bg-card">
              <div className="grid h-32 place-items-center bg-secondary/60">
                <Building2 className="h-10 w-10 text-muted-foreground/50" strokeWidth={1.5} />
              </div>
              <div className="flex flex-1 flex-col p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-block h-2 w-2 rounded-full ${available ? "bg-success" : "bg-destructive"}`}
                      title={available ? "Available" : "Unavailable"}
                    />
                    <h3 className="text-sm font-semibold">{r.name}</h3>
                  </div>
                  <span className="rounded-md bg-secondary px-1.5 py-0.5 text-xs capitalize text-secondary-foreground">{r.room_type.replace("_", " ")}</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{r.location}</p>
                <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
                  <Users className="h-3.5 w-3.5" /> Capacity {r.capacity}
                </div>
                <div className="mt-2 text-sm font-medium">₦{r.hourly_rate.toLocaleString()}<span className="text-xs font-normal text-muted-foreground">/hr</span></div>
                <div className="mt-3 flex flex-wrap gap-1">
                  {r.amenities.map((a) => (
                    <span key={a} className="rounded-md border bg-surface px-1.5 py-0.5 text-[11px] capitalize text-muted-foreground">{a}</span>
                  ))}
                </div>
                <Link to="/rooms/$id" params={{ id: r.id }} className="mt-4">
                  <Button variant="outline" size="sm" className="w-full" disabled={!available}>
                    {available ? "View Availability" : "Unavailable"}
                  </Button>
                </Link>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="col-span-full rounded-lg border bg-card p-12 text-center">
            <DoorOpen className="mx-auto h-10 w-10 text-muted-foreground/50" strokeWidth={1.5} />
            <p className="mt-3 text-sm font-medium">No rooms available</p>
            <p className="mt-1 text-xs text-muted-foreground">Try adjusting your filters or search query.</p>
          </div>
        )}
      </div>
    </div>
  );
}
