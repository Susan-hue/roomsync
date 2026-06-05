import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { ArrowLeft, Users, MapPin, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { RequireAuth } from "@/components/AppLayout";
import { api, ApiError, type Room } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

export const Route = createFileRoute("/rooms/$id")({
  component: () => <RequireAuth><RoomDetail /></RequireAuth>,
  validateSearch: z.object({ rebook: z.coerce.number().optional() }),
});

// Format a JS Date as YYYY-MM-DD using LOCAL timezone (avoid UTC off-by-one).
function ymd(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatNaira(amount: number) {
  if (!amount || amount <= 0) return "Free";
  return new Intl.NumberFormat("en-NG", {
    style: "currency", currency: "NGN", minimumFractionDigits: 2,
  }).format(amount);
}

// "HH:MM" -> minutes since midnight
function toMinutes(t: string) {
  const [h, m] = t.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

function RoomDetail() {
  const { id } = Route.useParams();
  const { rebook } = useSearch({ from: "/rooms/$id" });
  const isRebook = !!rebook;
  const navigate = useNavigate();
  const [room, setRoom] = useState<Room | null>(null);
  const [date, setDate] = useState<Date>(new Date());
  const [slots, setSlots] = useState<{ slot: string; available: boolean }[]>([]);
  const [slotsLoaded, setSlotsLoaded] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [manualStart, setManualStart] = useState("09:00");
  const [manualEnd, setManualEnd] = useState("10:00");
  const [purpose, setPurpose] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => { api.room(id).then(setRoom).catch((e) => toast.error(e.message)); }, [id]);

  useEffect(() => {
    setSlotsLoaded(false);
    setSelected(null);
    setFormError(null);
    setFieldErrors({});
    api.availability(id, ymd(date))
      .then((s) => { setSlots(s); setSlotsLoaded(true); })
      .catch(() => { setSlots([]); setSlotsLoaded(true); });
  }, [id, date]);

  const useManual = slotsLoaded && slots.length === 0;

  const { start_time, end_time } = useMemo(() => {
    if (useManual) return { start_time: manualStart, end_time: manualEnd };
    if (selected) {
      const [s, e] = selected.split("-");
      return { start_time: s, end_time: e };
    }
    return { start_time: "", end_time: "" };
  }, [useManual, manualStart, manualEnd, selected]);

  const totalCost = useMemo(() => {
    if (!room || !start_time || !end_time) return 0;
    const mins = toMinutes(end_time) - toMinutes(start_time);
    if (mins <= 0) return 0;
    return (mins / 60) * (room.hourly_rate || 0);
  }, [start_time, end_time, room]);

  const canSubmit = !!room && !!start_time && !!end_time && toMinutes(end_time) > toMinutes(start_time);

  const submit = async () => {
    if (!room) return;
    setFormError(null);
    setFieldErrors({});
    if (!start_time || !end_time) { setFormError("Please choose a time."); return; }
    if (toMinutes(end_time) <= toMinutes(start_time)) {
      setFormError("End time must be after start time."); return;
    }
    if (!purpose.trim()) { setFieldErrors({ purpose: "Please describe the purpose of your booking." }); return; }

    setSubmitting(true);
    try {
      await api.createBooking({
        room: room.id,
        date: ymd(date),
        start_time,
        end_time,
        purpose: purpose.trim(),
      });
      toast.success(isRebook ? "Room rebooked successfully" : "Booking confirmed");
      if (isRebook && typeof window !== "undefined") {
        sessionStorage.setItem("roomsync_just_rebooked", "1");
      }
      navigate({ to: "/bookings" });
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.fieldErrors && Object.keys(err.fieldErrors).length) {
          setFieldErrors(err.fieldErrors);
        }
        setFormError(err.message);
      } else {
        setFormError(err instanceof Error ? err.message : "Booking failed. Please try again.");
      }
    } finally { setSubmitting(false); }
  };

  if (!room) return <div className="text-sm text-muted-foreground">Loading…</div>;

  return (
    <div className="space-y-6">
      <button onClick={() => navigate({ to: "/rooms" })} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to rooms
      </button>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="space-y-6 lg:col-span-3">
          <div className="rounded-lg border bg-card p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">{room.name}</h1>
                <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {room.location}</span>
                  <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {room.capacity}</span>
                </div>
              </div>
              <span className="rounded-md bg-secondary px-2 py-0.5 text-xs capitalize text-secondary-foreground">{room.room_type.replace("_", " ")}</span>
            </div>
            {room.description && <p className="mt-4 text-sm text-muted-foreground">{room.description}</p>}
            <div className="mt-6 grid grid-cols-2 gap-4 border-t pt-4">
              <div>
                <div className="text-xs uppercase tracking-wide text-muted-foreground">Hourly Rate</div>
                <div className="mt-1 text-lg font-semibold">{formatNaira(room.hourly_rate)}</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide text-muted-foreground">Amenities</div>
                <div className="mt-1 flex flex-wrap gap-1">
                  {room.amenities.map((a) => (
                    <span key={a} className="rounded-md border bg-surface px-1.5 py-0.5 text-[11px] capitalize text-muted-foreground">{a}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="rounded-lg border bg-card p-6">
            <h2 className="text-base font-semibold">Book this room</h2>
            <div className="mt-4 space-y-4">
              <div className="space-y-1.5">
                <Label>Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal")}>
                      {format(date, "PPP")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={date} onSelect={(d) => d && setDate(d)} disabled={(d) => { const t = new Date(); t.setHours(0,0,0,0); return d < t; }} className="p-3 pointer-events-auto" />
                  </PopoverContent>
                </Popover>
                {fieldErrors.date && <p className="text-xs text-destructive">{fieldErrors.date}</p>}
              </div>

              {!slotsLoaded ? (
                <div className="text-sm text-muted-foreground">Loading available times…</div>
              ) : useManual ? (
                <div className="space-y-3">
                  <Label>Choose a time</Label>
                  <p className="text-xs text-muted-foreground">No preset slots are configured for this room — pick a start and end time.</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="start" className="text-xs">Start</Label>
                      <Input id="start" type="time" value={manualStart} onChange={(e) => setManualStart(e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="end" className="text-xs">End</Label>
                      <Input id="end" type="time" value={manualEnd} onChange={(e) => setManualEnd(e.target.value)} />
                    </div>
                  </div>
                  {(fieldErrors.start_time || fieldErrors.end_time) && (
                    <p className="text-xs text-destructive">{fieldErrors.start_time || fieldErrors.end_time}</p>
                  )}
                </div>
              ) : (
                <div className="space-y-1.5">
                  <Label>Available time slots</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {slots.map((s) => (
                      <button
                        key={s.slot}
                        type="button"
                        disabled={!s.available}
                        onClick={() => setSelected(s.slot)}
                        className={cn(
                          "rounded-md border px-3 py-2 text-sm transition-colors",
                          !s.available && "cursor-not-allowed bg-secondary text-muted-foreground line-through",
                          s.available && selected === s.slot && "border-primary bg-primary text-primary-foreground",
                          s.available && selected !== s.slot && "bg-card hover:border-primary hover:text-primary",
                        )}
                      >
                        {s.slot.replace("-", " – ")}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="purpose">Purpose</Label>
                <Input id="purpose" value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="e.g. Group project" />
                {fieldErrors.purpose && <p className="text-xs text-destructive">{fieldErrors.purpose}</p>}
              </div>

              <div className="flex items-center justify-between border-t pt-3 text-sm">
                <span className="text-muted-foreground">Total</span>
                <span className="text-base font-semibold">{formatNaira(totalCost)}</span>
              </div>

              {formError && (
                <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <Button className="w-full" disabled={!canSubmit || submitting} onClick={submit}>
                {submitting ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Booking…</>) : "Confirm Booking"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
