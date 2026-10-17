// Talks to the Play & Learn API through this app's /api proxy. Session tokens live in httpOnly
// cookies, so this code never sees them.

export type AdminUser = { id: string; email: string; name: string; role: "user" | "admin"; isAdmin: boolean };
export type Game = { id: string; title: string; emoji: string };
export type Plan = { name: string; amount: number; currency: string; durationDays: number; premiumGameIds: string[]; active: boolean; updatedAt: string | null; updatedBy: string | null };
export type PlanInput = Pick<Plan, "name" | "amount" | "durationDays" | "premiumGameIds" | "active">;
export type PaymentRow = { id: string; email: string | null; provider: string; amount: number; currency: string; durationDays: number; status: "created" | "paid" | "failed"; createdAt: string; paidAt: string | null };
export type Overview = { activePremium: number; paidCount: number; revenue: { currency: string; amount: number }[]; payments: PaymentRow[]; provider: string | null };

export class ApiError extends Error {
  constructor(message: string, readonly status: number) { super(message); }
}

const OFFLINE = "Can't reach the API. Is the backend running?";
const NO_RETRY = new Set(["/auth/login", "/auth/refresh", "/auth/logout"]);
let refreshing: Promise<boolean> | null = null;

function refreshSession(): Promise<boolean> {
  refreshing ??= fetch("/api/auth/refresh", { method: "POST", credentials: "same-origin" }).then((response) => response.ok, () => false).finally(() => { refreshing = null; });
  return refreshing;
}

async function messageFrom(response: Response): Promise<string> {
  try {
    const message = ((await response.json()) as { message?: unknown }).message;
    if (Array.isArray(message)) return message.filter((item) => typeof item === "string").join(" ");
    if (typeof message === "string") return message;
  } catch { /* Not JSON. */ }
  return response.status === 429 ? "Too many tries. Please wait a minute." : "Something went wrong. Please try again.";
}

async function call<T>(path: string, init: RequestInit = {}, retry = true): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api${path}`, { ...init, credentials: "same-origin", headers: { Accept: "application/json", ...(init.body ? { "Content-Type": "application/json" } : {}), ...init.headers } });
  } catch {
    throw new ApiError(OFFLINE, 0);
  }
  if (response.status === 401 && retry && !NO_RETRY.has(path) && await refreshSession()) return call<T>(path, init, false);
  if (!response.ok) throw new ApiError(response.status >= 500 && !response.headers.get("content-type")?.includes("json") ? OFFLINE : await messageFrom(response), response.status);
  return response.status === 204 ? undefined as T : await response.json() as T;
}

/** The signed-in account, or null when signed out. */
export async function getMe(): Promise<AdminUser | null> {
  try { return (await call<{ user: AdminUser }>("/auth/me")).user; }
  catch (error) { if (error instanceof ApiError && error.status === 401) return null; throw error; }
}

export async function login(email: string, password: string): Promise<AdminUser> {
  return (await call<{ user: AdminUser }>("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) })).user;
}

export async function logout(): Promise<void> {
  await call<void>("/auth/logout", { method: "POST" });
}

export function getPlan(): Promise<{ plan: Plan; games: Game[]; provider: string | null }> {
  return call("/admin/plan");
}

export async function savePlan(input: PlanInput): Promise<Plan> {
  return (await call<{ plan: Plan }>("/admin/plan", { method: "PUT", body: JSON.stringify(input) })).plan;
}

export function getOverview(): Promise<Overview> {
  return call("/admin/payments");
}

export function formatMoney(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency, minimumFractionDigits: amount % 100 ? 2 : 0 }).format(amount / 100);
}

export function formatDate(iso: string, withTime = true): string {
  return new Date(iso).toLocaleString("en-IN", withTime ? { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" } : { day: "numeric", month: "short", year: "numeric" });
}

/** 30 → "1 month", 365 → "1 year", 45 → "45 days". */
export function durationText(days: number): string {
  if (days % 365 === 0) return `${days / 365} year${days === 365 ? "" : "s"}`;
  if (days % 30 === 0) return `${days / 30} month${days === 30 ? "" : "s"}`;
  return `${days} day${days === 1 ? "" : "s"}`;
}

export const paymentStatusLabels: Record<PaymentRow["status"], { label: string; tone: "success" | "warning" | "danger" }> = {
  paid: { label: "Paid", tone: "success" },
  created: { label: "Not finished", tone: "warning" },
  failed: { label: "Failed", tone: "danger" },
};
