import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useApp, formatTime, type LogKind } from "@/lib/store";
import { Trash2, KeyRound, Globe, Settings as SettingsIcon, Power, CheckCircle2, XCircle, Info } from "lucide-react";

export const Route = createFileRoute("/_app/logs")({
  head: () => ({ meta: [{ title: "Security Logs — DNS Lock" }] }),
  component: LogsPage,
});

const KIND_ICON: Record<LogKind, React.ComponentType<{ className?: string }>> = {
  auth: KeyRound,
  dns: Power,
  provider: Globe,
  settings: SettingsIcon,
};

function LogsPage() {
  const { data, clearLogs } = useApp();

  return (
    <AppShell
      title="Security Logs"
      action={
        data.logs.length > 0 ? (
          <button
            onClick={() => { if (confirm("Clear all logs?")) clearLogs(); }}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-border bg-surface text-muted-foreground transition hover:text-destructive"
            aria-label="Clear logs"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        ) : null
      }
    >
      {data.logs.length === 0 ? (
        <div className="card-elevated flex flex-col items-center gap-3 p-10 text-center fade-up">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-muted text-muted-foreground">
            <Info className="h-6 w-6" />
          </div>
          <div>
            <p className="font-semibold">No events yet</p>
            <p className="mt-1 text-sm text-muted-foreground">Authentication and DNS changes will appear here.</p>
          </div>
        </div>
      ) : (
        <ul className="space-y-2 fade-up">
          {data.logs.map((l) => {
            const Icon = KIND_ICON[l.kind];
            const StatusIcon = l.status === "success" ? CheckCircle2 : l.status === "failure" ? XCircle : Info;
            const statusCls = l.status === "success" ? "text-success" : l.status === "failure" ? "text-destructive" : "text-muted-foreground";
            return (
              <li key={l.id} className="card-elevated flex items-start gap-3 p-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-surface-2 text-muted-foreground">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium">{l.message}</p>
                    <StatusIcon className={`h-3.5 w-3.5 shrink-0 ${statusCls}`} />
                  </div>
                  <p className="mt-0.5 text-[11px] uppercase tracking-wider text-muted-foreground">
                    {l.kind} • {formatTime(l.at)}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </AppShell>
  );
}
