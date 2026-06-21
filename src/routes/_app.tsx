import { createFileRoute, Outlet, useRouter } from "@tanstack/react-router";
import { useEffect } from "react";
import { useApp } from "@/lib/store";

export const Route = createFileRoute("/_app")({
  component: ProtectedLayout,
});

function ProtectedLayout() {
  const { ready, unlocked } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (ready && !unlocked) router.navigate({ to: "/login" });
  }, [ready, unlocked, router]);

  if (!ready || !unlocked) return null;
  return <Outlet />;
}
