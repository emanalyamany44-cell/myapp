import { Link, useRouter } from "@tanstack/react-router";
import { useApp } from "@/lib/store";
import { Shield, Settings, Activity, Globe, Lock } from "lucide-react";
import type { ReactNode } from "react";

const NAV = [
  { to: "/dashboard", label: "Home", icon: Shield },
  { to: "/dns", label: "DNS", icon: Globe },
  { to: "/logs", label: "Logs", icon: Activity },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function AppShell({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  const { lock } = useApp();
  const router = useRouter();

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col">
      <header className="sticky top-0 z-20 glass">
        <div className="flex items-center gap-3 px-5 py-4">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground">
            <Shield className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-medium uppercase tracking-[0.15em] text-muted-foreground">DNS Lock</p>
            <h1 className="truncate text-lg font-bold leading-tight">{title}</h1>
          </div>
          {action}
          <button
            onClick={() => { lock(); router.navigate({ to: "/login" }); }}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-border bg-surface text-muted-foreground transition hover:text-foreground"
            aria-label="Lock app"
          >
            <Lock className="h-4 w-4" />
          </button>
        </div>
      </header>

      <main className="flex-1 px-5 pb-28 pt-4">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-md px-4 pb-4">
        <div className="glass grid grid-cols-4 gap-1 rounded-2xl p-1.5 shadow-card">
          {NAV.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className="group flex flex-col items-center gap-1 rounded-xl px-2 py-2 text-xs font-medium text-muted-foreground transition data-[status=active]:bg-primary data-[status=active]:text-primary-foreground"
              activeOptions={{ exact: false }}
            >
              <Icon className="h-5 w-5" />
              <span>{label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
