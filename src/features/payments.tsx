"use client";

import { useMemo, useState } from "react";
import { Badge, Button, Card } from "@/components/ui";
import { formatDate, formatMoney, paymentStatusLabels, type PaymentRow } from "@/lib/api";

const filters = [{ id: "all", label: "All" }, { id: "paid", label: "Paid" }, { id: "created", label: "Not finished" }, { id: "failed", label: "Failed" }] as const;
type Filter = (typeof filters)[number]["id"];

function StatusBadge({ status }: { status: PaymentRow["status"] }) {
  const look = paymentStatusLabels[status];
  return <Badge tone={look.tone}>{look.label}</Badge>;
}

/** Compact list for the overview. */
export function RecentPayments({ payments, onShowAll }: { payments: PaymentRow[]; onShowAll: () => void }) {
  return <Card title="Latest payments" action={payments.length ? <Button variant="ghost" onClick={onShowAll}>View all →</Button> : undefined}>
    {payments.length === 0 ? <p className="mt-4 text-sm text-muted-ink">No payments yet. They appear here as soon as a parent opens the payment page.</p>
      : <ul className="mt-3 divide-y divide-line">{payments.slice(0, 5).map((payment) => <li key={payment.id} className="flex items-center justify-between gap-3 py-3">
        <div className="min-w-0"><p className="truncate text-sm font-bold text-ink">{payment.email ?? "Deleted account"}</p><p className="text-xs text-muted-ink">{formatDate(payment.createdAt)}</p></div>
        <div className="flex shrink-0 items-center gap-3"><span className="text-sm font-bold tabular-nums">{formatMoney(payment.amount, payment.currency)}</span><StatusBadge status={payment.status} /></div>
      </li>)}</ul>}
  </Card>;
}

export function PaymentsPanel({ payments, onRefresh, refreshing }: { payments: PaymentRow[]; onRefresh: () => void; refreshing: boolean }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const counts = useMemo(() => Object.fromEntries(filters.map((item) => [item.id, item.id === "all" ? payments.length : payments.filter((payment) => payment.status === item.id).length])) as Record<Filter, number>, [payments]);
  const visible = payments.filter((payment) => (filter === "all" || payment.status === filter) && (!query.trim() || (payment.email ?? "").toLowerCase().includes(query.trim().toLowerCase())));

  return <Card title="Payments" description="The latest 50 checkout attempts. “Not finished” means the parent left the payment page, or the bank is still confirming." action={<Button variant="secondary" onClick={onRefresh} disabled={refreshing}>{refreshing ? "Refreshing…" : "↻ Refresh"}</Button>}>
    <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div role="group" aria-label="Filter by status" className="flex flex-wrap gap-1.5">{filters.map((item) => <button key={item.id} type="button" onClick={() => setFilter(item.id)} aria-pressed={filter === item.id} className={`rounded-full px-3 py-1.5 text-sm font-bold transition-colors ${filter === item.id ? "bg-ink text-white" : "bg-cream text-ink hover:bg-sky"}`}>{item.label} <span className={filter === item.id ? "text-white/70" : "text-muted-ink"}>{counts[item.id]}</span></button>)}</div>
      <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by email" aria-label="Search by email" className="min-h-10 w-full rounded-xl border border-line bg-surface px-3.5 text-sm font-semibold outline-none focus:border-ink/40 focus:ring-4 focus:ring-sky sm:w-64" />
    </div>

    {visible.length === 0 ? <p className="mt-6 rounded-xl bg-cream px-4 py-6 text-center text-sm text-muted-ink">{payments.length ? "No payments match." : "No payments yet."}</p> : <>
      {/* Phones: one card per payment. */}
      <ul className="mt-4 grid gap-2 md:hidden">{visible.map((payment) => <li key={payment.id} className="rounded-xl border border-line p-3">
        <div className="flex items-center justify-between gap-2"><p className="min-w-0 truncate text-sm font-bold">{payment.email ?? "Deleted account"}</p><StatusBadge status={payment.status} /></div>
        <p className="mt-1 text-xs text-muted-ink">{formatDate(payment.createdAt)} · {payment.durationDays} days · <span className="capitalize">{payment.provider}</span></p>
        <p className="mt-1 text-base font-extrabold tabular-nums">{formatMoney(payment.amount, payment.currency)}</p>
      </li>)}</ul>
      {/* Larger screens: a table. */}
      <div className="mt-4 hidden overflow-x-auto md:block">
        <table className="w-full text-left text-sm">
          <thead><tr className="border-b border-line text-xs uppercase tracking-wide text-muted-ink"><th className="py-2.5 pr-4 font-bold">Date</th><th className="py-2.5 pr-4 font-bold">Parent</th><th className="py-2.5 pr-4 text-right font-bold">Amount</th><th className="py-2.5 pr-4 text-right font-bold">Days</th><th className="py-2.5 pr-4 font-bold">Gateway</th><th className="py-2.5 font-bold">Status</th></tr></thead>
          <tbody>{visible.map((payment) => <tr key={payment.id} className="border-b border-line last:border-0 hover:bg-cream/60">
            <td className="whitespace-nowrap py-3 pr-4 text-muted-ink">{formatDate(payment.createdAt)}</td>
            <td className="py-3 pr-4 font-semibold">{payment.email ?? <span className="text-muted-ink">Deleted account</span>}</td>
            <td className="py-3 pr-4 text-right font-bold tabular-nums">{formatMoney(payment.amount, payment.currency)}</td>
            <td className="py-3 pr-4 text-right tabular-nums">{payment.durationDays}</td>
            <td className="py-3 pr-4 capitalize">{payment.provider}</td>
            <td className="py-3"><StatusBadge status={payment.status} />{payment.paidAt ? <span className="ml-2 text-xs text-muted-ink">{formatDate(payment.paidAt)}</span> : null}</td>
          </tr>)}</tbody>
        </table>
      </div>
    </>}
  </Card>;
}
