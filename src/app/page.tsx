"use client";

import { useCallback, useEffect, useState } from "react";
import { Alert, BrandMark, Button } from "@/components/ui";
import { LoginForm } from "@/features/login-form";
import { OverviewPanel } from "@/features/overview";
import { PaymentsPanel } from "@/features/payments";
import { PlanForm } from "@/features/plan-form";
import { ApiError, getMe, getOverview, getPlan, logout, type AdminUser, type Game, type Overview, type Plan } from "@/lib/api";

type Session = { status: "loading" } | { status: "signed-out" } | { status: "signed-in"; user: AdminUser } | { status: "error"; message: string };
type Data = { plan: Plan; games: Game[]; provider: string | null; overview: Overview };
type Tab = "overview" | "plan" | "payments";
const tabs: readonly { id: Tab; label: string }[] = [{ id: "overview", label: "Overview" }, { id: "plan", label: "Premium plan" }, { id: "payments", label: "Payments" }];

function CenteredMessage({ title, children }: { title: string; children: React.ReactNode }) {
  return <main className="grid flex-1 place-items-center bg-sky/60 px-4 py-12">
    <section className="w-full max-w-sm rounded-2xl border border-line bg-surface p-6 text-center shadow-[0_12px_40px_rgba(48,70,93,0.08)]"><div className="flex justify-center"><BrandMark size="lg" /></div><h1 className="mt-4 text-lg font-extrabold">{title}</h1><div className="mt-2 text-sm leading-6 text-muted-ink">{children}</div></section>
  </main>;
}

export default function AdminPage() {
  const [session, setSession] = useState<Session>({ status: "loading" });
  const [data, setData] = useState<Data | null>(null);
  const [dataError, setDataError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<Tab>("overview");

  const loadSession = useCallback(async () => {
    try {
      const user = await getMe();
      setSession(user ? { status: "signed-in", user } : { status: "signed-out" });
    } catch (error) {
      setSession({ status: "error", message: error instanceof ApiError ? error.message : "Couldn't reach the API." });
    }
  }, []);

  const loadData = useCallback(async () => {
    setDataError("");
    setRefreshing(true);
    try {
      const [planData, overview] = await Promise.all([getPlan(), getOverview()]);
      setData({ ...planData, overview });
    } catch (error) {
      setDataError(error instanceof ApiError ? error.message : "Couldn't load the admin data.");
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { const timer = window.setTimeout(() => void loadSession(), 0); return () => window.clearTimeout(timer); }, [loadSession]);
  const isAdmin = session.status === "signed-in" && session.user.isAdmin;
  useEffect(() => { if (!isAdmin) return; const timer = window.setTimeout(() => void loadData(), 0); return () => window.clearTimeout(timer); }, [isAdmin, loadData]);

  async function signOut() {
    await logout().catch(() => undefined);
    setData(null);
    setTab("overview");
    setSession({ status: "signed-out" });
  }

  if (session.status === "loading") return <main className="grid flex-1 place-items-center bg-sky/60"><BrandMark size="lg" /></main>;
  if (session.status === "error") return <CenteredMessage title="Can't reach the API">{session.message}<div className="mt-4"><Button onClick={() => void loadSession()}>Try again</Button></div></CenteredMessage>;
  if (session.status === "signed-out") return <LoginForm onSignedIn={(user) => setSession({ status: "signed-in", user })} />;
  if (!session.user.isAdmin) return <CenteredMessage title="Not an admin"><p><strong className="text-ink">{session.user.email}</strong> doesn&apos;t have the admin role. On the API server run:</p><code className="mt-2 block rounded-lg bg-cream px-2 py-1.5 font-mono text-xs text-ink">npm run admin -- promote {session.user.email}</code><div className="mt-4"><Button variant="secondary" onClick={() => void signOut()}>Sign out</Button></div></CenteredMessage>;

  const user = session.user;
  return <div className="flex flex-1 flex-col">
    <header className="sticky top-0 z-30 border-b border-line bg-surface/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 pt-3 sm:px-6">
        <div className="flex items-center gap-2.5"><BrandMark /><p className="text-base font-extrabold leading-tight">Play &amp; Learn <span className="ml-1 rounded-md bg-sky px-1.5 py-0.5 text-xs font-bold text-muted-ink">Admin</span></p></div>
        <div className="flex min-w-0 items-center gap-2">
          <span aria-hidden="true" className="hidden size-8 shrink-0 place-items-center rounded-full bg-lavender text-sm font-extrabold sm:grid">{user.name.slice(0, 1).toUpperCase()}</span>
          <span className="hidden min-w-0 truncate text-sm font-semibold text-muted-ink sm:block">{user.email}</span>
          <Button variant="ghost" onClick={() => void signOut()}>Sign out</Button>
        </div>
      </div>
      <nav aria-label="Admin sections" className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 sm:px-6">
        {tabs.map((item) => <button key={item.id} type="button" onClick={() => setTab(item.id)} aria-current={tab === item.id ? "page" : undefined} className={`relative whitespace-nowrap px-3 py-3 text-sm font-bold transition-colors ${tab === item.id ? "text-ink after:absolute after:inset-x-3 after:bottom-0 after:h-[3px] after:rounded-full after:bg-sunshine" : "text-muted-ink hover:text-ink"}`}>{item.label}</button>)}
      </nav>
    </header>

    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
      <h1 className="sr-only">{tabs.find((item) => item.id === tab)?.label}</h1>
      {dataError ? <div className="mb-5 grid gap-3"><Alert tone="error">{dataError}</Alert><div><Button onClick={() => void loadData()}>Try again</Button></div></div> : null}
      {!data ? (dataError ? null : <p className="text-sm font-semibold text-muted-ink">Loading…</p>)
        : tab === "overview" ? <OverviewPanel overview={data.overview} plan={data.plan} games={data.games} provider={data.provider} onEditPlan={() => setTab("plan")} onShowPayments={() => setTab("payments")} />
        : tab === "plan" ? <PlanForm key={data.plan.updatedAt ?? "default"} plan={data.plan} games={data.games} provider={data.provider} onSaved={(plan) => setData((current) => current && { ...current, plan })} />
        : <PaymentsPanel payments={data.overview.payments} onRefresh={() => void loadData()} refreshing={refreshing} />}
    </main>
  </div>;
}
