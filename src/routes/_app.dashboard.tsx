import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useApp, providerById, formatRelative } from "@/lib/store";
import { Shield, ShieldCheck, ShieldAlert, Globe, Clock, ChevronRight, Activity } from "lucide-react";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — DNS Lock" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { data, update, log } = useApp();
  const provider = providerById(data.providerId);
  const enabled = data.dnsEnabled;

  async function toggle() {
    const next = !enabled;
    await update({ dnsEnabled: next, lastModified: Date.now() });
    await log("dns", "success", next ? `DNS enabled via ${provider.name}` : "DNS disabled");
  }

  return (
    <AppShell title="Dashboard">
      <section className="card-elevated relative overflow-hidden p-6 fade-up">
        <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full opacity-30 blur-3xl"
          style={{ background: enabled ? "var(--success)" : "var(--muted-foreground)" }} />
        <div className="relative space-y-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">DNS Status</span>
            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${enabled ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${enabled ? "bg-success" : "bg-muted-foreground"}`} />
              {enabled ? "Active" : "Inactive"}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className={`grid h-16 w-16 place-items-center rounded-2xl ${enabled ? "bg-success/15 text-success pulse-ring" : "bg-muted text-muted-foreground"}`}>
              {enabled ? <ShieldCheck className="h-8 w-8" /> : <Shield className="h-8 w-8" />}
            </div>
            <div className="min-w-0">
              <p className="truncate text-2xl font-bold">{enabled ? "Protected" : "Unprotected"}</p>
              <p className="truncate text-sm text-muted-foreground">{provider.name} • {provider.primary}</p>
            </div>
          </div>

          <button
            onClick={toggle}
            className={`w-full rounded-xl px-4 py-3 text-sm font-semibold transition ${enabled ? "border border-border bg-surface-2 hover:bg-surface" : "bg-primary text-primary-foreground shadow-glow hover:opacity-90"}`}
          >
            {enabled ? "Disable DNS" : "Enable DNS"}
          </button>
        </div>
      </section>

      <section className="mt-4 grid grid-cols-2 gap-3 fade-up">
        <Stat icon={Globe} label="Provider" value={provider.name} sub={provider.primary} />
        <Stat
          icon={enabled ? ShieldCheck : ShieldAlert}
          label="Security"
          value={enabled ? "Secured" : "At risk"}
          sub={enabled ? "Encrypted DNS" : "Default DNS"}
          tone={enabled ? "success" : "warning"}
        />
        <Stat icon={Clock} label="Modified" value={formatRelative(data.lastModified)} sub="last change" className="col-span-2" />
      </section>

      <section className="mt-4 fade-up">
        <Link to="/dns" className="card-elevated flex items-center justify-between p-4 transition hover:border-primary/50">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
              <Globe className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold">Manage DNS</p>
              <p className="text-xs text-muted-foreground">Switch provider or fine-tune</p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </Link>
        <Link to="/logs" className="card-elevated mt-3 flex items-center justify-between p-4 transition hover:border-primary/50">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-accent/15 text-accent">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold">Security logs</p>
              <p className="text-xs text-muted-foreground">{data.logs.length} recorded events</p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </Link>
      </section>
    </AppShell>
  );
}

function Stat({ icon: Icon, label, value, sub, tone, className = "" }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; sub: string; tone?: "success" | "warning"; className?: string }) {
  const toneCls = tone === "success" ? "text-success" : tone === "warning" ? "text-warning" : "text-foreground";
  return (
    <div className={`card-elevated p-4 ${className}`}>
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
      </div>
      <p className={`mt-2 truncate text-lg font-bold ${toneCls}`}>{value}</p>
      <p className="truncate text-xs text-muted-foreground">{sub}</p>
    </div>
  );
}
