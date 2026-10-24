import { Alert, Badge, Button, Card, Stat } from "@/components/ui";
import { durationText, formatMoney, type Game, type Overview, type Plan } from "@/lib/api";
import { RecentPayments } from "./payments";

const gatewayNames: Record<string, string> = { razorpay: "Razorpay", cashfree: "Cashfree", stripe: "Stripe", payu: "PayU", fake: "Test gateway" };

export function gatewayLabel(provider: string | null): string {
  return provider ? gatewayNames[provider] ?? provider : "Not set up";
}

export function OverviewPanel({ overview, plan, games, provider, onEditPlan, onShowPayments }: { overview: Overview; plan: Plan; games: Game[]; provider: string | null; onEditPlan: () => void; onShowPayments: () => void }) {
  const revenue = overview.revenue.length ? overview.revenue.map((item) => formatMoney(item.amount, item.currency)).join(" + ") : formatMoney(0, plan.currency);
  const premiumGames = games.filter((game) => plan.premiumGameIds.includes(game.id));
  const onSale = plan.active && provider !== null;

  return <div className="grid gap-5">
    {provider === "fake" ? <Alert tone="warning">Payments use the <strong>test gateway</strong>: no real money moves. Set PAYMENT_PROVIDER to payu, razorpay, cashfree or stripe in the API&apos;s .env before launch.</Alert>
      : !provider ? <Alert tone="warning">No payment gateway is set up, so parents can&apos;t buy Premium. Set PAYMENT_PROVIDER in the API&apos;s .env.</Alert> : null}

    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <Stat icon="⭐" tint="bg-sunshine/50" label="Active Premium" value={String(overview.activePremium)} hint="parents right now" />
      <Stat icon="✓" tint="bg-mint" label="Paid payments" value={String(overview.paidCount)} hint="all time" />
      <Stat icon="₹" tint="bg-sky" label="Revenue" value={revenue} hint="all time" />
      <Stat icon="⚡" tint="bg-lavender/70" label="Gateway" value={gatewayLabel(provider)} hint={provider === "fake" ? "no real money" : provider ? "live payments" : "payments off"} />
    </div>

    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
      <Card title="Premium plan" action={<Button variant="secondary" onClick={onEditPlan}>Edit plan</Button>}>
        <div className="mt-4 flex flex-wrap items-center gap-2"><Badge tone={onSale ? "success" : "neutral"}>{onSale ? "● On sale" : "○ Not on sale"}</Badge><span className="text-sm font-semibold text-muted-ink">{plan.name}</span></div>
        <p className="mt-3 text-3xl font-extrabold tabular-nums text-ink">{formatMoney(plan.amount, plan.currency)}<span className="ml-2 text-base font-semibold text-muted-ink">for {durationText(plan.durationDays)}</span></p>
        <p className="mt-4 text-xs font-bold uppercase tracking-wide text-muted-ink">Premium games</p>
        {premiumGames.length ? <ul className="mt-2 flex flex-wrap gap-2">{premiumGames.map((game) => <li key={game.id} className="inline-flex items-center gap-1.5 rounded-full bg-cream px-3 py-1 text-sm font-semibold"><span aria-hidden="true">{game.emoji}</span>{game.title}</li>)}</ul>
          : <p className="mt-1 text-sm text-muted-ink">None: every game is free.</p>}
      </Card>
      <RecentPayments payments={overview.payments} onShowAll={onShowPayments} />
    </div>
  </div>;
}
