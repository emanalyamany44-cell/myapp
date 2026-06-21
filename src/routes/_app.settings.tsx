import { createFileRoute, useRouter } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useApp, applyTheme, BIO_KEY, type AppData } from "@/lib/store";
import { isBiometricSupported, hasBiometricEnrollment, enrollBiometric } from "@/lib/webauthn";
import { Fingerprint, Moon, Sun, Monitor, ShieldOff, Trash2, AlertTriangle } from "lucide-react";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/_app/settings")({
  head: () => ({ meta: [{ title: "Settings — DNS Lock" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const { data, update, log, reset, lock } = useApp();
  const router = useRouter();
  const [bioSupported, setBioSupported] = useState(false);
  const [bioEnrolled, setBioEnrolled] = useState(false);

  useEffect(() => {
    setBioSupported(isBiometricSupported());
    setBioEnrolled(hasBiometricEnrollment());
  }, []);

  async function toggleBio() {
    if (bioEnrolled) {
      localStorage.removeItem(BIO_KEY);
      setBioEnrolled(false);
      await update({ biometricEnabled: false });
      await log("settings", "info", "Biometric unlock disabled");
    } else {
      const ok = await enrollBiometric("DNS Lock user");
      if (ok) {
        setBioEnrolled(true);
        await update({ biometricEnabled: true });
        await log("settings", "success", "Biometric unlock enabled");
      } else {
        await log("settings", "failure", "Biometric enrollment failed");
      }
    }
  }

  async function changeTheme(theme: AppData["theme"]) {
    applyTheme(theme);
    await update({ theme });
  }

  return (
    <AppShell title="Settings">
      <Section title="Security">
        <Row
          icon={<Fingerprint className="h-5 w-5 text-accent" />}
          title="Biometric unlock"
          subtitle={bioSupported ? (bioEnrolled ? "Enabled on this device" : "Use fingerprint or face") : "Not supported on this device"}
        >
          <Switch checked={bioEnrolled} onChange={toggleBio} disabled={!bioSupported} />
        </Row>
      </Section>

      <Section title="Appearance">
        <div className="card-elevated grid grid-cols-3 gap-1 p-1">
          {([
            { v: "light", label: "Light", Icon: Sun },
            { v: "dark", label: "Dark", Icon: Moon },
            { v: "system", label: "System", Icon: Monitor },
          ] as const).map(({ v, label, Icon }) => {
            const active = data.theme === v;
            return (
              <button
                key={v}
                onClick={() => changeTheme(v)}
                className={`flex flex-col items-center gap-1 rounded-xl px-2 py-3 text-xs font-medium transition ${active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-surface-2"}`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            );
          })}
        </div>
      </Section>

      <Section title="Vault">
        <button
          onClick={() => { lock(); router.navigate({ to: "/login" }); }}
          className="flex w-full items-center gap-3 rounded-2xl border border-border bg-surface p-4 text-left transition hover:border-primary/40"
        >
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-muted text-muted-foreground">
            <ShieldOff className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold">Lock now</p>
            <p className="text-xs text-muted-foreground">Require master password to re-enter</p>
          </div>
        </button>

        <button
          onClick={() => { if (confirm("Erase the encrypted vault, biometric, and all logs?")) { reset(); router.navigate({ to: "/login" }); } }}
          className="mt-2 flex w-full items-center gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-left transition hover:bg-destructive/10"
        >
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-destructive/15 text-destructive">
            <Trash2 className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-destructive">Reset vault</p>
            <p className="text-xs text-destructive/80">Permanently deletes all data on this device</p>
          </div>
        </button>
      </Section>

      <div className="mt-6 flex items-start gap-2 rounded-xl border border-warning/30 bg-warning/10 p-3 text-xs text-warning-foreground">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
        <span>This is a web demo. DNS toggles affect app state only — they don't change your device's real DNS settings.</span>
      </div>
    </AppShell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-6 fade-up">
      <h2 className="mb-2 px-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">{title}</h2>
      {children}
    </section>
  );
}

function Row({ icon, title, subtitle, children }: { icon: React.ReactNode; title: string; subtitle: string; children?: React.ReactNode }) {
  return (
    <div className="card-elevated flex items-center gap-3 p-4">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-surface-2">{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{title}</p>
        <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}

function Switch({ checked, onChange, disabled }: { checked: boolean; onChange: () => void; disabled?: boolean }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={onChange}
      className={`relative h-7 w-12 shrink-0 rounded-full transition disabled:opacity-40 ${checked ? "bg-success" : "bg-muted"}`}
    >
      <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${checked ? "left-[22px]" : "left-0.5"}`} />
    </button>
  );
}
