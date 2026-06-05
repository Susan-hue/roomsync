import { useState } from "react";
import { useNavigate, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ApiError, type Role } from "@/services/api";

type RegisterRole = Exclude<Role, "admin">;

export function AuthForm({ initialTab = "login" }: { initialTab?: "login" | "register" }) {
  const { login, register, loading } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"login" | "register">(initialTab);

  const [li, setLi] = useState({ email: "", password: "" });
  const [liErrors, setLiErrors] = useState<Record<string, string>>({});

  const [reg, setReg] = useState({
    email: "", full_name: "", password: "",
    role: "student" as RegisterRole, student_id: "",
  });
  const [regErrors, setRegErrors] = useState<Record<string, string>>({});

  const handleApiError = (
    err: unknown,
    setErrors: (e: Record<string, string>) => void,
  ) => {
    if (err instanceof ApiError) {
      const fieldErrors = err.fieldErrors ?? {};
      if (Object.keys(fieldErrors).length > 0) {
        setErrors(fieldErrors);
        // Also surface a toast if there's a general (non-field) message
        const fieldVals = new Set(Object.values(fieldErrors));
        if (err.message && !fieldVals.has(err.message)) toast.error(err.message);
        return;
      }
      setErrors({});
      toast.error(err.message);
      return;
    }
    setErrors({});
    toast.error(err instanceof Error ? err.message : "Something went wrong. Please try again.");
  };

  const onLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLiErrors({});
    try {
      await login(li.email, li.password);
      navigate({ to: "/dashboard" });
    } catch (err) { handleApiError(err, setLiErrors); }
  };

  const validateRegister = () => {
    const errs: Record<string, string> = {};
    if (!reg.full_name.trim()) errs.full_name = "Please enter your full name.";
    if (!reg.email.trim()) errs.email = "Please enter your email.";
    if (reg.password.length < 8) errs.password = "Password must be at least 8 characters.";
    return errs;
  };

  const onRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validateRegister();
    if (Object.keys(errs).length) { setRegErrors(errs); return; }
    setRegErrors({});
    try {
      await register({
        email: reg.email, full_name: reg.full_name, password: reg.password,
        role: reg.role, student_id: reg.student_id || undefined,
      });
      navigate({ to: "/dashboard" });
    } catch (err) { handleApiError(err, setRegErrors); }
  };

  const inputCls = "h-11 rounded-lg border-border bg-background px-3.5 text-sm";
  const errCls = "h-11 rounded-lg border-destructive bg-background px-3.5 text-sm focus-visible:ring-destructive";
  const labelCls = "text-xs font-medium text-foreground/80";
  const errText = "text-xs text-destructive mt-1";

  return (
    <div className="min-h-screen w-full bg-background lg:grid lg:grid-cols-5">
      <aside
        className="relative hidden lg:col-span-3 lg:flex lg:flex-col lg:justify-between lg:p-12"
        style={{
          backgroundColor: "#F5F3F0",
          backgroundImage:
            "linear-gradient(to right, rgba(0,0,0,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.04) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      >
        <Link to="/" className="text-sm font-medium tracking-tight text-foreground/80 hover:text-foreground">
          ← Back to home
        </Link>
        <div>
          <h2 className="text-[28px] font-medium tracking-tight text-foreground">RoomSync</h2>
          <p className="mt-2 text-sm text-muted-foreground">Smart room booking for modern universities</p>
        </div>
        <div className="text-xs text-muted-foreground">© {new Date().getFullYear()} RoomSync</div>
      </aside>

      <main className="flex min-h-screen items-center justify-center px-6 py-12 lg:col-span-2 lg:px-10">
        <div className="w-full max-w-sm">
          {tab === "login" ? (
            <>
              <h1 className="text-2xl font-medium tracking-tight text-foreground">Welcome back</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Don't have an account?{" "}
                <button type="button" onClick={() => { setTab("register"); setLiErrors({}); }}
                  className="font-medium text-primary hover:underline">Sign up</button>
              </p>

              <form onSubmit={onLogin} className="mt-8 space-y-4" noValidate>
                <div className="space-y-1.5">
                  <Label htmlFor="li-email" className={labelCls}>Email</Label>
                  <Input id="li-email" type="email" required autoComplete="email"
                    className={liErrors.email ? errCls : inputCls}
                    value={li.email} onChange={(e) => setLi({ ...li, email: e.target.value })} />
                  {liErrors.email && <p className={errText}>{liErrors.email}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="li-pw" className={labelCls}>Password</Label>
                  <Input id="li-pw" type="password" required autoComplete="current-password"
                    className={liErrors.password ? errCls : inputCls}
                    value={li.password} onChange={(e) => setLi({ ...li, password: e.target.value })} />
                  {liErrors.password && <p className={errText}>{liErrors.password}</p>}
                </div>
                <Button type="submit" disabled={loading} className="h-11 w-full rounded-lg">
                  {loading ? "Signing in…" : "Sign in"}
                </Button>
              </form>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-medium tracking-tight text-foreground">Create an account</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Already have an account?{" "}
                <button type="button" onClick={() => { setTab("login"); setRegErrors({}); }}
                  className="font-medium text-primary hover:underline">Sign in</button>
              </p>

              <form onSubmit={onRegister} className="mt-8 space-y-4" noValidate>
                <div className="space-y-1.5">
                  <Label htmlFor="r-name" className={labelCls}>Full name</Label>
                  <Input id="r-name" required className={regErrors.full_name ? errCls : inputCls} value={reg.full_name}
                    onChange={(e) => setReg({ ...reg, full_name: e.target.value })} />
                  {regErrors.full_name && <p className={errText}>{regErrors.full_name}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="r-email" className={labelCls}>Email</Label>
                  <Input id="r-email" type="email" required className={regErrors.email ? errCls : inputCls} value={reg.email}
                    onChange={(e) => setReg({ ...reg, email: e.target.value })} />
                  {regErrors.email && <p className={errText}>{regErrors.email}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="r-pw" className={labelCls}>Password</Label>
                  <Input id="r-pw" type="password" required className={regErrors.password ? errCls : inputCls} value={reg.password}
                    onChange={(e) => setReg({ ...reg, password: e.target.value })} />
                  {regErrors.password
                    ? <p className={errText}>{regErrors.password}</p>
                    : <p className="text-xs text-muted-foreground mt-1">Minimum 8 characters</p>}
                </div>
                <div className="space-y-1.5">
                  <Label className={labelCls}>Role</Label>
                  <Select value={reg.role} onValueChange={(v) => setReg({ ...reg, role: v as RegisterRole })}>
                    <SelectTrigger className="h-11 rounded-lg"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="student">Student</SelectItem>
                      <SelectItem value="lecturer">Lecturer</SelectItem>
                    </SelectContent>
                  </Select>
                  {regErrors.role && <p className={errText}>{regErrors.role}</p>}
                </div>
                {reg.role === "student" && (
                  <div className="space-y-1.5">
                    <Label htmlFor="r-sid" className={labelCls}>
                      Student ID <span className="text-muted-foreground">(optional)</span>
                    </Label>
                    <Input id="r-sid" className={regErrors.student_id ? errCls : inputCls} value={reg.student_id}
                      onChange={(e) => setReg({ ...reg, student_id: e.target.value })} />
                    {regErrors.student_id && <p className={errText}>{regErrors.student_id}</p>}
                  </div>
                )}
                <Button type="submit" disabled={loading} className="h-11 w-full rounded-lg">
                  {loading ? "Creating…" : "Create account"}
                </Button>
              </form>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
