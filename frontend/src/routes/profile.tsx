import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { RequireAuth } from "@/components/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/services/api";
import { authStore } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/profile")({ component: () => <RequireAuth><ProfilePage /></RequireAuth> });

function ProfilePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState(user?.full_name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const updated = await api.updateProfile({ full_name: fullName, email });
      authStore.set({ access: authStore.access!, refresh: authStore.refresh! }, updated);
      toast.success("Profile updated");
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  const remove = async () => {
    try {
      await api.deleteProfile();
      authStore.set(null, null);
      toast.success("Account deleted");
      navigate({ to: "/" });
    } catch (e: any) { toast.error(e.message); }
  };

  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : "—";

  return (
    <div className="max-w-xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Profile Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Update your account details.</p>
      </div>

      <div className="space-y-4 rounded-lg border bg-card p-6">
        <div className="space-y-1.5">
          <Label htmlFor="full_name">Full name</Label>
          <Input id="full_name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Role</Label>
            <Input value={user?.role ?? ""} readOnly className="capitalize bg-muted/40" />
          </div>
          <div className="space-y-1.5">
            <Label>Student ID</Label>
            <Input value={user?.student_id ?? "—"} readOnly className="bg-muted/40" />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Member since</Label>
          <Input value={memberSince} readOnly className="bg-muted/40" />
        </div>
        <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save changes"}</Button>
      </div>

      <div className="space-y-3 rounded-lg border border-destructive/30 bg-card p-6">
        <h2 className="text-sm font-semibold text-destructive">Danger zone</h2>
        <p className="text-sm text-muted-foreground">Permanently delete your account and all associated data.</p>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm">Delete account</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete account?</AlertDialogTitle>
              <AlertDialogDescription>This action cannot be undone. All your bookings and data will be permanently removed.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={remove}>Delete forever</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
