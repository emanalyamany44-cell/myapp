import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useApp, PROVIDERS, providerById } from "@/lib/store";
import { Check, Globe, Power } from "lucide-react";

export const Route = createFileRoute("/_app/dns")({
  head: () => ({ meta: [{ title: "DNS Management — DNS Lock" }] }),
  component: DnsPage,
});

function DnsPage() {
  const { data, update, log } = useApp();
  const current = providerById(data.providerId);

  async function pick(id: string) {
    if (id === data.providerId) return;
    const p = providerById(id);
    await update({ providerId: id, lastModified: Date.now() });
    await log("provider", "info", `Provider switched to ${p.name} (${p.primary})`);
  }

  async function toggle() {
    const next = !data.dnsEnabled;
    await update({ dnsEnabled: next, lastModified: Date.now() });
    await log("dns", "success", next ? `DNS enabled via ${current.name}` : "DNS disabled");
  }

  return (
    <AppShell title="DNS Management">
      <section className="card-elevated p-5 fade-up">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary">
            <Power className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold">DNS protection</p>
            <p className="text-xs text-muted-foreground">{data.dnsEnabled ? "Currently active" : "Currently disabled"}</p>
          </div>
          <button
            onClick={toggle}
            role="switch"
            aria-checked={data.dnsEnabled}
            className={`relative h-7 w-12 shrink-0 rounded-full transition ${data.dnsEnabled ? "bg-success" : "bg-muted"}`}
          >
            <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${data.dnsEnabled ? "left-[22px]" : "left-0.5"}`} />
          </button>
        </div>
      </section>

      <h2 className="mb-2 mt-6 px-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">Providers</h2>
      <div className="space-y-2 fade-up">
        {PROVIDERS.map((p) => {
          const selected = p.id === data.providerId;
          return (
            <button
              key={p.id}
              onClick={() => pick(p.id)}
              className={`flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition ${selected ? "border-primary bg-primary/5 shadow-glow" : "border-border bg-surface hover:border-primary/40"}`}
            >
              <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${selected ? "bg-primary text-primary-foreground" : "bg-surface-2 text-muted-foreground"}`}>
                <Globe className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-semibold">{p.name}</p>
                  {selected && <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">Active</span>}
                </div>
                <p className="truncate text-xs text-muted-foreground">{p.description}</p>
                <p className="mt-1 font-mono text-[11px] text-muted-foreground">{p.primary} · {p.secondary}</p>
              </div>
              {selected && <Check className="h-5 w-5 shrink-0 text-primary" />}
            </button>
          );
        })}
      </div>
    </AppShell>
  );
}
