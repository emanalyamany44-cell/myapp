import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { encryptJSON, decryptJSON, hashPassword } from "./crypto";

export type DnsProvider = {
  id: string;
  name: string;
  primary: string;
  secondary: string;
  description: string;
};

export const PROVIDERS: DnsProvider[] = [
  { id: "cloudflare", name: "Cloudflare", primary: "1.1.1.1", secondary: "1.0.0.1", description: "Privacy-focused, fastest globally" },
  { id: "google", name: "Google", primary: "8.8.8.8", secondary: "8.8.4.4", description: "Reliable & widely used" },
  { id: "quad9", name: "Quad9", primary: "9.9.9.9", secondary: "149.112.112.112", description: "Blocks malicious domains" },
  { id: "opendns", name: "OpenDNS", primary: "208.67.222.222", secondary: "208.67.220.220", description: "Family-safe filtering" },
  { id: "adguard", name: "AdGuard", primary: "94.140.14.14", secondary: "94.140.15.15", description: "Blocks ads & trackers" },
];

export type LogKind = "auth" | "dns" | "provider" | "settings";
export type LogStatus = "success" | "failure" | "info";

export type LogEntry = {
  id: string;
  at: number;
  kind: LogKind;
  status: LogStatus;
  message: string;
};

export type AppData = {
  dnsEnabled: boolean;
  providerId: string;
  lastModified: number;
  logs: LogEntry[];
  biometricEnabled: boolean;
  theme: "light" | "dark" | "system";
};

const DEFAULT_DATA: AppData = {
  dnsEnabled: false,
  providerId: "cloudflare",
  lastModified: Date.now(),
  logs: [],
  biometricEnabled: false,
  theme: "system",
};

const VAULT_KEY = "dnslock.vault.v1";
const HASH_KEY = "dnslock.hash.v1";
export const BIO_KEY = "dnslock.bio.credId";

type Ctx = {
  ready: boolean;
  hasVault: boolean;
  unlocked: boolean;
  data: AppData;
  setup: (password: string) => Promise<void>;
  unlock: (password: string) => Promise<boolean>;
  lock: () => void;
  reset: () => void;
  update: (partial: Partial<AppData>) => Promise<void>;
  log: (kind: LogKind, status: LogStatus, message: string) => Promise<void>;
  clearLogs: () => Promise<void>;
};

const AppCtx = createContext<Ctx | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [hasVault, setHasVault] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [password, setPassword] = useState<string | null>(null);
  const [data, setData] = useState<AppData>(DEFAULT_DATA);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setHasVault(!!localStorage.getItem(VAULT_KEY));
    setReady(true);

    // apply theme
    const t = localStorage.getItem("dnslock.theme") ?? "system";
    applyTheme(t as AppData["theme"]);
  }, []);

  const persist = useCallback(async (pw: string, next: AppData) => {
    const blob = await encryptJSON(pw, next);
    localStorage.setItem(VAULT_KEY, blob);
  }, []);

  const setup = useCallback(async (pw: string) => {
    const hash = await hashPassword(pw);
    const initial = { ...DEFAULT_DATA, lastModified: Date.now() };
    await persist(pw, initial);
    localStorage.setItem(HASH_KEY, hash);
    setHasVault(true);
    setUnlocked(true);
    setPassword(pw);
    setData(initial);
  }, [persist]);

  const unlock = useCallback(async (pw: string): Promise<boolean> => {
    const blob = localStorage.getItem(VAULT_KEY);
    if (!blob) return false;
    try {
      const next = await decryptJSON<AppData>(pw, blob);
      const entry: LogEntry = {
        id: crypto.randomUUID(), at: Date.now(),
        kind: "auth", status: "success", message: "Master password unlock",
      };
      const merged = { ...next, logs: [entry, ...next.logs].slice(0, 200) };
      await persist(pw, merged);
      setData(merged);
      setPassword(pw);
      setUnlocked(true);
      return true;
    } catch {
      return false;
    }
  }, [persist]);

  const lock = useCallback(() => {
    setUnlocked(false);
    setPassword(null);
  }, []);

  const reset = useCallback(() => {
    localStorage.removeItem(VAULT_KEY);
    localStorage.removeItem(HASH_KEY);
    localStorage.removeItem(BIO_KEY);
    setHasVault(false);
    setUnlocked(false);
    setPassword(null);
    setData(DEFAULT_DATA);
  }, []);

  const update = useCallback(async (partial: Partial<AppData>) => {
    if (!password) return;
    const next = { ...data, ...partial };
    await persist(password, next);
    setData(next);
  }, [password, data, persist]);

  const log = useCallback(async (kind: LogKind, status: LogStatus, message: string) => {
    if (!password) return;
    const entry: LogEntry = { id: crypto.randomUUID(), at: Date.now(), kind, status, message };
    const next = { ...data, logs: [entry, ...data.logs].slice(0, 200) };
    await persist(password, next);
    setData(next);
  }, [password, data, persist]);

  const clearLogs = useCallback(async () => {
    await update({ logs: [] });
  }, [update]);

  return (
    <AppCtx.Provider value={{ ready, hasVault, unlocked, data, setup, unlock, lock, reset, update, log, clearLogs }}>
      {children}
    </AppCtx.Provider>
  );
}

export function useApp(): Ctx {
  const ctx = useContext(AppCtx);
  if (!ctx) throw new Error("useApp outside AppProvider");
  return ctx;
}

export function applyTheme(theme: AppData["theme"]) {
  if (typeof window === "undefined") return;
  const root = document.documentElement;
  const isDark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  root.classList.toggle("dark", isDark);
  localStorage.setItem("dnslock.theme", theme);
}

export function formatTime(ts: number): string {
  return new Date(ts).toLocaleString(undefined, {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

export function formatRelative(ts: number): string {
  const diff = Date.now() - ts;
  const min = Math.floor(diff / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(ts).toLocaleDateString();
}

export function providerById(id: string): DnsProvider {
  return PROVIDERS.find((p) => p.id === id) ?? PROVIDERS[0];
}
