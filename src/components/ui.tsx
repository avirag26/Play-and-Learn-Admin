import type { ButtonHTMLAttributes, ReactNode } from "react";

export function BrandMark({ size = "md" }: { size?: "md" | "lg" }) {
  return <span aria-hidden="true" className={`grid shrink-0 place-items-center bg-sunshine text-ink ${size === "lg" ? "size-12 rounded-2xl text-2xl" : "size-9 rounded-xl text-lg"}`}>✦</span>;
}

export function Card({ title, description, action, children, className = "" }: { title?: string; description?: ReactNode; action?: ReactNode; children: ReactNode; className?: string }) {
  return <section className={`rounded-2xl border border-line bg-surface p-5 sm:p-6 ${className}`}>
    {title || action ? <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">{title ? <h2 className="text-lg font-extrabold text-ink">{title}</h2> : null}{description ? <p className="mt-1 text-sm leading-6 text-muted-ink">{description}</p> : null}</div>
      {action}
    </div> : null}
    {children}
  </section>;
}

const buttonLooks = {
  primary: "bg-ink text-white hover:bg-ink-strong",
  secondary: "border border-line bg-surface text-ink hover:bg-cream",
  ghost: "text-ink hover:bg-sky",
};

export function Button({ variant = "primary", className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: keyof typeof buttonLooks }) {
  return <button className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ${buttonLooks[variant]} ${className}`} {...props} />;
}

const badgeLooks = {
  success: "bg-success text-success-ink",
  warning: "bg-warning text-warning-ink",
  danger: "bg-danger text-danger-ink",
  neutral: "bg-sky text-ink",
  premium: "bg-sunshine/60 text-ink",
};

export function Badge({ tone, children }: { tone: keyof typeof badgeLooks; children: ReactNode }) {
  return <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-bold ${badgeLooks[tone]}`}>{children}</span>;
}

export function Alert({ tone, children }: { tone: "success" | "error" | "warning"; children: ReactNode }) {
  const look = tone === "success" ? "border-mint bg-success text-success-ink" : tone === "warning" ? "border-sunshine/60 bg-warning text-warning-ink" : "border-coral/60 bg-danger text-danger-ink";
  return <p role={tone === "error" ? "alert" : "status"} className={`rounded-xl border px-4 py-3 text-sm font-semibold leading-6 ${look}`}>{children}</p>;
}

/** A number tile. `tint` is the soft background of its icon. */
export function Stat({ label, value, hint, icon, tint }: { label: string; value: string; hint?: string; icon: string; tint: string }) {
  return <div className="flex items-start gap-3 rounded-2xl border border-line bg-surface p-4">
    <span aria-hidden="true" className={`grid size-10 shrink-0 place-items-center rounded-xl text-lg ${tint}`}>{icon}</span>
    <div className="min-w-0"><p className="text-xs font-bold uppercase tracking-wide text-muted-ink">{label}</p><p className="mt-0.5 truncate text-2xl font-extrabold tabular-nums text-ink">{value}</p>{hint ? <p className="truncate text-xs text-muted-ink">{hint}</p> : null}</div>
  </div>;
}

export const inputClass = "mt-1.5 min-h-11 w-full rounded-xl border border-line bg-surface px-3.5 text-sm font-semibold text-ink outline-none transition placeholder:text-muted-ink/60 focus:border-ink/40 focus:ring-4 focus:ring-sky";
export const labelClass = "block text-sm font-bold text-ink";
