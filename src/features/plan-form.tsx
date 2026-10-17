"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { Alert, Badge, Button, Card, inputClass, labelClass } from "@/components/ui";
import { ApiError, durationText, formatDate, formatMoney, savePlan, type Game, type Plan } from "@/lib/api";

const durationPresets = [30, 90, 180, 365];

/** "249" or "249.50" → paise; null when not a valid amount. */
function toPaise(rupees: string): number | null {
  if (!/^\d+(\.\d{1,2})?$/.test(rupees.trim())) return null;
  return Math.round(Number(rupees) * 100);
}

/** Roughly how the Premium card looks to parents in the app's parent area. */
function ParentPreview({ name, amount, currency, days, games, active }: { name: string; amount: number | null; currency: string; days: number; games: Game[]; active: boolean }) {
  const valid = amount !== null && amount >= 100 && Number.isInteger(days) && days >= 1;
  return <div className="rounded-2xl border border-line bg-cream p-4">
    <p className="text-xs font-bold uppercase tracking-wide text-muted-ink">What parents see</p>
    <div className="mt-3 rounded-2xl bg-surface p-4 shadow-[0_4px_0_rgba(42,91,145,0.12)]">
      <div className="rounded-xl bg-sky p-4">
        <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-muted-ink">{name.trim() || "Plan name"}</p>
        <p className="mt-1 text-2xl font-extrabold text-ink">{valid ? formatMoney(amount, currency) : "₹–"} <span className="text-sm font-semibold text-muted-ink">for {valid ? durationText(days) : "–"}</span></p>
        <p className="mt-1 text-xs text-muted-ink">One payment, no automatic renewal.</p>
        {games.length ? <ul className="mt-2 flex flex-wrap gap-1.5">{games.map((game) => <li key={game.id} className="inline-flex items-center gap-1 rounded-full bg-surface px-2.5 py-1 text-xs font-bold"><span aria-hidden="true">{game.emoji}</span>{game.title}</li>)}</ul> : null}
      </div>
      {active ? <div className="mt-3 rounded-full bg-[#ffd16a] py-2.5 text-center text-sm font-extrabold text-ink">Get Premium{valid ? ` · ${formatMoney(amount, currency)}` : ""}</div>
        : <p className="mt-3 rounded-xl bg-cream px-3 py-2.5 text-center text-xs font-semibold text-muted-ink">Premium isn&apos;t on sale right now.</p>}
    </div>
    <p className="mt-3 text-xs leading-5 text-muted-ink">Children see a ⭐ Premium badge on these games and an &ldquo;ask a grown-up&rdquo; screen until a parent buys.</p>
  </div>;
}

export function PlanForm({ plan, games, provider, onSaved }: { plan: Plan; games: Game[]; provider: string | null; onSaved: (plan: Plan) => void }) {
  const [name, setName] = useState(plan.name);
  const [price, setPrice] = useState(String(plan.amount / 100));
  const [durationDays, setDurationDays] = useState(String(plan.durationDays));
  const [premiumGameIds, setPremiumGameIds] = useState<string[]>(plan.premiumGameIds);
  const [active, setActive] = useState(plan.active);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ tone: "success" | "error"; message: string } | null>(null);

  const amount = toPaise(price);
  const days = Number(durationDays);
  const selectedGames = games.filter((game) => premiumGameIds.includes(game.id));
  const changed = name !== plan.name || amount !== plan.amount || days !== plan.durationDays || active !== plan.active || selectedGames.map((game) => game.id).join() !== games.filter((game) => plan.premiumGameIds.includes(game.id)).map((game) => game.id).join();

  function toggleGame(id: string) {
    setResult(null);
    setPremiumGameIds((current) => current.includes(id) ? current.filter((gameId) => gameId !== id) : [...current, id]);
  }

  function reset() {
    setName(plan.name); setPrice(String(plan.amount / 100)); setDurationDays(String(plan.durationDays)); setPremiumGameIds(plan.premiumGameIds); setActive(plan.active); setResult(null);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (amount === null || amount < 100) { setResult({ tone: "error", message: "Enter a price of at least ₹1, with up to 2 decimals." }); return; }
    if (!Number.isInteger(days) || days < 1 || days > 3650) { setResult({ tone: "error", message: "Enter a whole number of days between 1 and 3650." }); return; }
    setBusy(true);
    setResult(null);
    try {
      onSaved(await savePlan({ name, amount, durationDays: days, premiumGameIds: selectedGames.map((game) => game.id), active }));
      setResult({ tone: "success", message: "Saved. Parents see the new plan straight away; past payments keep what they paid for." });
    } catch (caught) {
      setResult({ tone: "error", message: caught instanceof ApiError ? caught.message : "Couldn't save." });
    } finally {
      setBusy(false);
    }
  }

  return <form onSubmit={submit} onChange={() => setResult(null)} className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
    <div className="grid gap-5">
      {!provider ? <Alert tone="warning">No payment gateway is set up (PAYMENT_PROVIDER in the API&apos;s .env), so parents can&apos;t buy even when the plan is on sale.</Alert> : null}

      <Card title="Availability">
        <label className="mt-4 flex cursor-pointer items-center justify-between gap-4 rounded-xl bg-cream px-4 py-3.5">
          <span><span className="flex items-center gap-2 text-sm font-bold">On sale <Badge tone={active ? "success" : "neutral"}>{active ? "On" : "Off"}</Badge></span><span className="mt-0.5 block text-xs leading-5 text-muted-ink">When off, parents can&apos;t buy. Premium that&apos;s already active keeps working until it ends.</span></span>
          <input type="checkbox" role="switch" checked={active} onChange={(event) => setActive(event.target.checked)} className="peer sr-only" />
          <span aria-hidden="true" className="relative h-6 w-11 shrink-0 rounded-full bg-ink/20 transition-colors after:absolute after:left-0.5 after:top-0.5 after:size-5 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:bg-success-ink peer-checked:after:translate-x-5 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ink" />
        </label>
      </Card>

      <Card title="Price and duration" description="One payment unlocks Premium for this many days. Buying again adds the time on top.">
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className={`${labelClass} sm:col-span-2`}>Plan name<input value={name} onChange={(event) => setName(event.target.value)} required maxLength={60} className={inputClass} /></label>
          <label className={labelClass}>Price
            <span className="relative block"><span aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 mt-0.75 -translate-y-1/2 text-sm font-bold text-muted-ink">₹</span><input inputMode="decimal" value={price} onChange={(event) => setPrice(event.target.value)} required aria-describedby="price-hint" className={`${inputClass} pl-8`} /></span>
            <span id="price-hint" className={`mt-1 block text-xs font-semibold ${amount !== null && amount >= 100 ? "text-muted-ink" : "text-danger-ink"}`}>{amount !== null && amount >= 100 ? `Parents pay ${formatMoney(amount, plan.currency)}` : "At least ₹1, up to 2 decimals"}</span>
          </label>
          <label className={labelClass}>Lasts (days)
            <input type="number" min={1} max={3650} step={1} value={durationDays} onChange={(event) => setDurationDays(event.target.value)} required className={inputClass} />
            <span className="mt-1.5 flex flex-wrap gap-1.5">{durationPresets.map((preset) => <button key={preset} type="button" onClick={() => setDurationDays(String(preset))} aria-pressed={days === preset} className={`rounded-full px-2.5 py-1 text-xs font-bold transition-colors ${days === preset ? "bg-ink text-white" : "bg-cream text-ink hover:bg-sky"}`}>{durationText(preset)}</button>)}</span>
          </label>
        </div>
      </Card>

      <Card title="Premium games" description="Locked for children until a parent buys Premium. Games you leave unticked stay free for everyone.">
        <div className="mt-4 grid gap-2 sm:grid-cols-3">{games.map((game) => {
          const selected = premiumGameIds.includes(game.id);
          return <label key={game.id} className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 p-3 transition-colors ${selected ? "border-sunshine bg-sunshine/15" : "border-line hover:bg-cream"}`}>
            <input type="checkbox" checked={selected} onChange={() => toggleGame(game.id)} className="size-4 accent-[#30465d]" />
            <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-xl bg-cream text-2xl">{game.emoji}</span>
            <span className="min-w-0"><span className="block truncate text-sm font-bold">{game.title}</span><span className="block text-xs font-semibold text-muted-ink">{selected ? "⭐ Premium" : "Free"}</span></span>
          </label>;
        })}</div>
      </Card>
    </div>

    <div className="grid gap-4 lg:sticky lg:top-24">
      <ParentPreview name={name} amount={amount} currency={plan.currency} days={days} games={selectedGames} active={active} />
      <div className="rounded-2xl border border-line bg-surface p-4">
        {result ? <div className="mb-3"><Alert tone={result.tone}>{result.message}</Alert></div> : null}
        <div className="flex gap-2"><Button type="submit" disabled={busy || !changed} className="flex-1">{busy ? "Saving…" : changed ? "Save changes" : "Saved"}</Button>{changed ? <Button type="button" variant="secondary" onClick={reset} disabled={busy}>Undo</Button> : null}</div>
        <p className="mt-3 text-xs leading-5 text-muted-ink">{changed ? "You have unsaved changes." : plan.updatedAt ? `Last saved ${formatDate(plan.updatedAt)} by ${plan.updatedBy}.` : "Not saved yet: these are the defaults."}</p>
      </div>
    </div>
  </form>;
}
