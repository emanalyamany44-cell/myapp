import { createFileRoute, redirect } from "@tanstack/react-router";
import { Shield } from "lucide-react";
import { useEffect } from "react";
import { useRouter } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "DNS Lock — Secure DNS Manager" },
      { name: "description", content: "Password-protected DNS management with biometric unlock, encrypted logs, and Material 3 design." },
      { property: "og:title", content: "DNS Lock" },
      { property: "og:description", content: "Secure your DNS. Password + biometric protected." },
      { name: "theme-color", content: "#0b1220" },
    ],
  }),
  component: Splash,
});

function Splash() {
  const router = useRouter();

  useEffect(() => {
    const t = setTimeout(() => {
      const hasVault = typeof window !== "undefined" && !!localStorage.getItem("dnslock.vault.v1");
      router.navigate({ to: hasVault ? "/login" : "/login" });
    }, 1400);
    return () => clearTimeout(t);
  }, [router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 px-6">
      <div className="relative">
        <div className="absolute inset-0 rounded-[2rem] bg-primary/30 blur-3xl" />
        <div className="pulse-ring relative grid h-28 w-28 place-items-center rounded-[2rem] bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-glow">
          <Shield className="h-14 w-14" strokeWidth={2.2} />
        </div>
      </div>
      <div className="text-center fade-up">
        <h1 className="text-3xl font-bold tracking-tight">DNS Lock</h1>
        <p className="mt-2 text-sm text-muted-foreground">Your DNS, sealed shut.</p>
      </div>
      <div className="absolute bottom-10 flex items-center gap-2 text-xs text-muted-foreground">
        <div className="h-1 w-1 animate-pulse rounded-full bg-primary" />
        <span>Initializing secure vault</span>
      </div>
    </div>
  );
}
