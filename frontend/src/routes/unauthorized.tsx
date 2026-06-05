import { createFileRoute, Link } from "@tanstack/react-router";
import { Lock } from "lucide-react";

export const Route = createFileRoute("/unauthorized")({
  component: UnauthorizedPage,
});

function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="text-center">
        <Lock className="mx-auto h-12 w-12 text-muted-foreground" strokeWidth={1.5} />
        <h1 className="mt-6 text-xl font-medium" style={{ color: "#1A1A1A" }}>Access denied</h1>
        <p className="mt-2 text-sm text-muted-foreground">You need to sign in to access this page.</p>
        <div className="mt-8">
          <Link
            to="/login"
            className="inline-flex items-center rounded-lg bg-[#6366F1] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#5558E0] transition-colors"
          >
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
