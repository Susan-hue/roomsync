import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Calendar, Clock, RefreshCw, GraduationCap, Briefcase, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  component: Landing,
  head: () => ({
    meta: [
      { title: "RoomSync — Book study rooms and labs" },
      { name: "description", content: "RoomSync helps students and lecturers find and reserve study rooms and labs with fair scheduling built in." },
    ],
  }),
});

function Landing() {
  return (
    <div className="min-h-screen bg-white text-[#1A1A1A] antialiased dark:bg-[#1A1A2E] dark:text-[#E2E8F0]">
      {/* Nav */}
      <header className="sticky top-0 z-30 border-b border-black/[0.06] bg-white/80 backdrop-blur dark:border-[#2A2A4A] dark:bg-[#141425]/90">
        <nav className="mx-auto flex h-14 max-w-[1100px] items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-2 text-[18px] font-semibold tracking-tight text-[#1A1A1A] dark:text-[#E2E8F0]">
            <span className="h-2 w-2 rounded-full bg-[#6366F1]" aria-hidden />
            RoomSync
          </Link>
          <div className="flex items-center gap-6">
            <a href="#how" className="hidden text-[13px] font-medium text-[#6B7280] hover:text-[#1A1A1A] dark:text-[#94A3B8] dark:hover:text-[#E2E8F0] sm:inline">Features</a>
            <a href="#how" className="hidden text-[13px] font-medium text-[#6B7280] hover:text-[#1A1A1A] dark:text-[#94A3B8] dark:hover:text-[#E2E8F0] sm:inline">How it works</a>
            <Link to="/login" className="text-[13px] font-medium text-[#6B7280] hover:text-[#1A1A1A] dark:text-[#94A3B8] dark:hover:text-[#E2E8F0]">Sign in</Link>
            <Link to="/register">
              <Button size="sm" className="h-8 rounded-md bg-[#6366F1] px-3 text-[13px] font-medium text-white hover:bg-[#5457e0]">
                Get Started
              </Button>
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section
        className="px-6 pb-10 pt-[60px] bg-[linear-gradient(180deg,#FAFAF8_0%,#F0EEED_100%)] dark:bg-[linear-gradient(180deg,#1A1A2E_0%,#141425_100%)]"
      >
        <div className="mx-auto max-w-[1100px] text-center">
          <h1 className="mx-auto max-w-[760px] text-[36px] font-medium leading-[1.15] tracking-[-0.02em] text-[#1A1A1A] dark:text-[#E2E8F0] sm:text-[44px]">
            Book study rooms and labs, <span className="text-[#6366F1]">effortlessly.</span>
          </h1>
          <p className="mx-auto mt-3 max-w-[560px] text-[15px] leading-[1.6] text-[#6B7280] dark:text-[#94A3B8]">
            RoomSync helps students and lecturers find and reserve spaces with fair scheduling built in.
          </p>
          <div className="mt-7 flex items-center justify-center gap-3">
            <Link to="/register">
              <Button size="sm" className="h-9 rounded-md bg-[#6366F1] px-4 text-[13px] font-medium text-white hover:bg-[#5457e0]">
                Get Started
              </Button>
            </Link>
            <a href="#how">
              <Button size="sm" variant="ghost" className="h-9 rounded-md px-4 text-[13px] font-medium text-[#1A1A1A] hover:bg-black/[0.04] dark:text-[#E2E8F0] dark:hover:bg-white/[0.04]">
                Learn more →
              </Button>
            </a>
          </div>

          {/* Browser mockup */}
          <div className="mx-auto mt-12 max-w-[920px] overflow-hidden rounded-xl border border-black/[0.08] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-12px_rgba(0,0,0,0.12)] dark:border-[#2A2A4A] dark:bg-[#16213E]">
            <div className="flex items-center gap-1.5 border-b border-black/[0.06] bg-[#FAFAFA] px-4 py-2.5 dark:border-[#2A2A4A] dark:bg-[#141425]">
              <span className="h-2.5 w-2.5 rounded-full bg-[#FF5F57]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#FEBC2E]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#28C840]" />
              <span className="ml-3 rounded-md bg-white px-2 py-0.5 text-[11px] text-[#9CA3AF] dark:bg-[#1A1A2E] dark:text-[#94A3B8]">roomsync.app/rooms</span>
            </div>
            <BookingPreview />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="bg-[#F8F7F6] px-6 py-20 dark:bg-[#141425]">
        <div className="mx-auto max-w-[1100px]">
          <p className="text-center text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6366F1]">How it works</p>
          <h2 className="mx-auto mt-3 max-w-2xl text-center text-[28px] font-medium leading-tight tracking-[-0.015em] text-[#1A1A1A] dark:text-[#E2E8F0]">
            Three steps to your perfect study space
          </h2>
          <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-3">
            {[
              { n: "01", Icon: Calendar, title: "Browse rooms", desc: "See real-time availability for study rooms and labs across campus." },
              { n: "02", Icon: Clock, title: "Book instantly", desc: "Select your time slot and confirm. No paperwork, no waiting." },
              { n: "03", Icon: RefreshCw, title: "Fair for everyone", desc: "Round-robin scheduling ensures equal access for all students." },
            ].map(({ n, Icon, title, desc }) => (
              <div key={n} className="rounded-xl border border-black/[0.06] bg-white p-6 dark:border-[#2A2A4A] dark:bg-[#16213E]">
                <div className="text-[48px] font-light leading-none text-[#E5E4E2] dark:text-[#2A2A4A]">{n}</div>
                <Icon className="mt-4 h-6 w-6 text-[#6366F1]" strokeWidth={1.75} />
                <h3 className="mt-4 text-[15px] font-semibold text-[#1A1A1A] dark:text-[#E2E8F0]">{title}</h3>
                <p className="mt-2 text-[15px] leading-[1.6] text-[#6B7280] dark:text-[#94A3B8]">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-t border-black/[0.06] bg-white px-6 py-20 dark:border-[#2A2A4A] dark:bg-[#1A1A2E]">
        <div className="mx-auto grid max-w-[1100px] grid-cols-2 gap-10 text-center md:grid-cols-4">
          <Stat value={500} suffix="+" label="Rooms available" />
          <Stat value={10000} suffix="+" label="Bookings made" />
          <Stat value={98} suffix="%" label="Satisfaction rate" />
          <Stat value={3} suffix="" label="Campuses" />
        </div>
      </section>

      {/* Roles */}
      <section className="bg-[#F8F7F6] px-6 py-20 dark:bg-[#141425]">
        <div className="mx-auto max-w-[1100px]">
          <p className="text-center text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6366F1]">Built for everyone</p>
          <h2 className="mx-auto mt-3 max-w-2xl text-center text-[28px] font-medium leading-tight tracking-[-0.015em] text-[#1A1A1A] dark:text-[#E2E8F0]">
            Whether you're a student, lecturer, or admin
          </h2>
          <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-3">
            {[
              { color: "#6366F1", Icon: GraduationCap, title: "Students", desc: "Find quiet study spaces between classes. Fair scheduling means everyone gets a turn." },
              { color: "#10B981", Icon: Briefcase, title: "Lecturers", desc: "Reserve labs and meeting rooms with priority access. Prepare without the hassle." },
              { color: "#F59E0B", Icon: Shield, title: "Admins", desc: "Manage rooms, monitor usage analytics, and ensure optimal space utilization." },
            ].map(({ color, Icon, title, desc }) => (
              <div key={title} className="overflow-hidden rounded-xl border border-black/[0.06] bg-white dark:border-[#2A2A4A] dark:bg-[#16213E]">
                <div className="h-[3px] w-full" style={{ backgroundColor: color }} />
                <div className="p-6">
                  <Icon className="h-6 w-6" style={{ color }} strokeWidth={1.75} />
                  <h3 className="mt-4 text-[15px] font-semibold text-[#1A1A1A] dark:text-[#E2E8F0]">{title}</h3>
                  <p className="mt-2 text-[15px] leading-[1.6] text-[#6B7280] dark:text-[#94A3B8]">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-white px-6 py-[60px] dark:bg-[#1A1A2E]">
        <div className="mx-auto max-w-[700px] text-center">
          <h2 className="text-[28px] font-medium tracking-[-0.015em] text-[#1A1A1A] dark:text-[#E2E8F0]">Ready to book your first room?</h2>
          <p className="mx-auto mt-3 max-w-md text-[15px] leading-[1.6] text-[#6B7280] dark:text-[#94A3B8]">
            Join hundreds of students already using RoomSync.
          </p>
          <div className="mt-7">
            <Link to="/register">
              <Button className="h-10 rounded-md bg-[#6366F1] px-5 text-[14px] font-medium text-white hover:bg-[#5457e0]">
                Get Started — it's free
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-black/[0.06] bg-[#F8F7F6] dark:border-[#2A2A4A] dark:bg-[#141425]">
        <div className="mx-auto flex h-14 max-w-[1100px] flex-col items-center justify-between gap-2 px-6 text-[13px] text-[#6B7280] dark:text-[#94A3B8] sm:flex-row">
          <div className="flex items-center gap-2 font-medium text-[#1A1A1A] dark:text-[#E2E8F0]">
            <span className="h-2 w-2 rounded-full bg-[#6366F1]" aria-hidden />
            RoomSync
          </div>
          <div>Built with fairness in mind</div>
          <div>© 2026 RoomSync</div>
        </div>
      </footer>
    </div>
  );
}

function BookingPreview() {
  const slots = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00"];
  const rooms = [
    { name: "Study Room A", booked: [1, 2] },
    { name: "Lab Alpha", booked: [0, 4] },
    { name: "Seminar Room", booked: [3] },
    { name: "Quiet Pod 3", booked: [2, 5] },
  ];
  return (
    <div className="p-5 text-left">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="text-[13px] font-semibold text-[#1A1A1A] dark:text-[#E2E8F0]">Today's availability</div>
          <div className="text-[11px] text-[#9CA3AF] dark:text-[#94A3B8]">Tuesday, June 4</div>
        </div>
        <div className="rounded-md border border-black/[0.08] px-2 py-1 text-[11px] text-[#6B7280] dark:border-[#2A2A4A] dark:text-[#94A3B8]">Week view</div>
      </div>
      <div className="overflow-hidden rounded-lg border border-black/[0.06] dark:border-[#2A2A4A]">
        <div className="grid grid-cols-[120px_repeat(6,1fr)] border-b border-black/[0.06] bg-[#FAFAFA] text-[10px] text-[#9CA3AF] dark:border-[#2A2A4A] dark:bg-[#141425] dark:text-[#94A3B8]">
          <div className="px-3 py-2 font-medium">Room</div>
          {slots.map((s) => (<div key={s} className="px-2 py-2 text-center">{s}</div>))}
        </div>
        {rooms.map((r) => (
          <div key={r.name} className="grid grid-cols-[120px_repeat(6,1fr)] border-b border-black/[0.04] last:border-0 dark:border-[#2A2A4A]/60">
            <div className="px-3 py-2.5 text-[11px] font-medium text-[#1A1A1A] dark:text-[#E2E8F0]">{r.name}</div>
            {slots.map((_, i) => (
              <div key={i} className="border-l border-black/[0.04] p-1 dark:border-[#2A2A4A]/60">
                <div
                  className={
                    "h-6 rounded " +
                    (r.booked.includes(i) ? "bg-[#6366F1]" : "bg-[#F3F4F6] dark:bg-[#1A1A2E]")
                  }
                />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function Stat({ value, suffix, label }: { value: number; suffix: string; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [n, setN] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          const start = performance.now();
          const dur = 1200;
          const step = (t: number) => {
            const p = Math.min(1, (t - start) / dur);
            const eased = 1 - Math.pow(1 - p, 3);
            setN(Math.floor(eased * value));
            if (p < 1) requestAnimationFrame(step);
            else setN(value);
          };
          requestAnimationFrame(step);
          io.disconnect();
        }
      });
    }, { threshold: 0.4 });
    io.observe(el);
    return () => io.disconnect();
  }, [value]);
  return (
    <div ref={ref}>
      <div className="text-[40px] font-semibold tracking-[-0.02em] text-[#1A1A1A] dark:text-white">
        {n.toLocaleString()}{suffix}
      </div>
      <div className="mt-1 text-[14px] text-[#6B7280] dark:text-[#94A3B8]">{label}</div>
    </div>
  );
}
