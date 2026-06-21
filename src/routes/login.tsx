import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useApp } from "@/lib/store";
import { isBiometricSupported, hasBiometricEnrollment, verifyBiometric } from "@/lib/webauthn";
import { Shield, Fingerprint, Eye, EyeOff, KeyRound, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Unlock — DNS Lock" }] }),
  component: LoginPage,
});

function LoginPage() {
  const router = useRouter();
  const { ready, hasVault, unlocked, setup, unlock, reset } = useApp();
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [bioAvailable, setBioAvailable] = useState(false);

  useEffect(() => {
    setBioAvailable(isBiometricSupported() && hasBiometricEnrollment() && hasVault);
  }, [hasVault]);

  useEffect(() => {
    if (unlocked) router.navigate({ to: "/dashboard" });
  }, [unlocked, router]);

  if (!ready) return null;

  const isSetup = !hasVault;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (pw.length < 6) { setError("Password must be at least 6 characters."); return; }
    setBusy(true);
    try {
      if (isSetup) {
        if (pw !== pw2) { setError("Passwords do not match."); setBusy(false); return; }
        await setup(pw);
        router.navigate({ to: "/dashboard" });
      } else {
        const ok = await unlock(pw);
        if (!ok) setError("Incorrect master password.");
      }
    } finally { setBusy(false); }
  }

  async function bioUnlock() {
    setError(null);
    const ok = await verifyBiometric();
    if (!ok) { setError("Biometric verification failed."); return; }
    // Biometric proves possession of device, but we still need the password to decrypt.
    // For demo: stash a wrapped key. Here we prompt the user to enter password once after enrollment.
    setError("Biometric verified. Enter your master password to decrypt the vault.");
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col px-6 pb-8 pt-12">
      <div className="mb-10 flex flex-col items-center gap-4 fade-up">
        <div className="grid h-20 w-20 place-items-center rounded-3xl bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-glow">
          <Shield className="h-10 w-10" strokeWidth={2.2} />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold">{isSetup ? "Create your vault" : "Welcome back"}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isSetup ? "Choose a master password to protect your DNS controls." : "Enter your master password to continue."}
          </p>
        </div>
      </div>

      <form onSubmit={submit} className="card-elevated space-y-4 p-5 fade-up">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Master password</label>
          <div className="relative">
            <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type={show ? "text" : "password"}
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              autoFocus
              placeholder="••••••••"
              className="w-full rounded-xl border border-input bg-surface-2 px-10 py-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
            />
            <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {isSetup && (
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Confirm password</label>
            <input
              type={show ? "text" : "password"}
              value={pw2}
              onChange={(e) => setPw2(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl border border-input bg-surface-2 px-3 py-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
            />
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-glow transition hover:opacity-90 disabled:opacity-50"
        >
          {busy ? "Working…" : isSetup ? "Create vault" : "Unlock"}
        </button>

        {bioAvailable && !isSetup && (
          <button
            type="button"
            onClick={bioUnlock}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-surface-2 px-4 py-3 text-sm font-medium transition hover:bg-surface"
          >
            <Fingerprint className="h-5 w-5 text-accent" />
            Use biometric
          </button>
        )}
      </form>

      <div className="mt-auto pt-8 text-center text-xs text-muted-foreground">
        {isSetup ? (
          <p>Your password never leaves this device. Lose it, lose access.</p>
        ) : (
          <button onClick={() => { if (confirm("This will erase your vault and logs. Continue?")) reset(); }} className="text-muted-foreground underline-offset-2 hover:underline">
            Forgot password? Reset vault
          </button>
        )}
      </div>
    </div>
  );
}
