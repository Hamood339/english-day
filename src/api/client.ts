export interface ApiMember {
  id: number;
  name: string;
  mistakes: number;
  paidMistakes: number;
  unpaidMistakes: number;
}

export interface SessionPayload {
  date: string;
  soundEnabled: boolean;
  penaltyAmount: number;
  topPenaltyAmount: number;
  members: ApiMember[];
}

export interface CloseDayResult extends SessionPayload {
  drawnWinner: ApiMember | null;
}

export interface SummaryPayload {
  date: string;
  penaltyAmount: number;
  topPenaltyAmount: number;
  totalMistakes: number;
  totalAmount: number;
  totalPaid: number;
  totalUnpaid: number;
  members: (ApiMember & { amountDue: number; amountPaid: number; amountUnpaid: number; isTopOffender: boolean })[];
}

export interface HistoryDay {
  date: string;
  totalMistakes: number;
  totalAmount: number;
  totalPaid: number;
  totalUnpaid: number;
  members: (ApiMember & {
    amountDue: number;
    amountPaid: number;
    amountUnpaid: number;
    isTopOffender: boolean;
    extraPenaltyPaid: boolean;
  })[];
}

export interface LedgerEntry {
  id: number;
  dayDate: string;
  paid: boolean;
  paidAt: string | null;
  createdAt: string;
}

export type Role = "admin" | "viewer";

export interface AuthUser {
  username: string;
  role: Role;
}

const API_BASE = import.meta.env.VITE_API_URL ?? "";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(options.headers ?? {}) },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  login: (username: string, password: string) =>
    request<AuthUser>("/api/auth-login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),
  logout: () => request<{ ok: true }>("/api/auth-logout", { method: "POST" }),
  me: () => request<AuthUser>("/api/auth-me"),

  getSession: () => request<SessionPayload>("/api/session"),
  toggleSound: (enabled: boolean) =>
    request<SessionPayload>("/api/session-sound", {
      method: "POST",
      body: JSON.stringify({ enabled }),
    }),
  resetDay: () => request<CloseDayResult>("/api/session-reset", { method: "POST" }),
  startNewDay: (keepScores: boolean) =>
    request<CloseDayResult>("/api/session-new-day", {
      method: "POST",
      body: JSON.stringify({ keepScores }),
    }),

  addMember: (name: string) =>
    request<SessionPayload>("/api/members", {
      method: "POST",
      body: JSON.stringify({ name }),
    }),
  renameMember: (id: number, name: string) =>
    request<SessionPayload>(`/api/member?id=${id}`, {
      method: "PATCH",
      body: JSON.stringify({ name }),
    }),
  deleteMember: (id: number) =>
    request<SessionPayload>(`/api/member?id=${id}`, { method: "DELETE" }),
  addMistake: (id: number) =>
    request<SessionPayload>(`/api/member-mistake?id=${id}`, { method: "POST" }),
  undoMistake: (id: number) =>
    request<SessionPayload>(`/api/member-undo?id=${id}`, { method: "POST" }),
  payMistake: (id: number) =>
    request<SessionPayload>(`/api/member-pay?id=${id}`, { method: "POST" }),
  unpayMistake: (id: number) =>
    request<SessionPayload>(`/api/member-unpay?id=${id}`, { method: "POST" }),
  getMemberLedger: (id: number) =>
    request<LedgerEntry[]>(`/api/member-ledger?id=${id}`),

  getSummary: () => request<SummaryPayload>("/api/summary"),
  getHistory: () => request<HistoryDay[]>("/api/history"),
  toggleHistoryPay: (date: string) =>
    request<{ ok: true }>(`/api/history-pay?date=${date}`, { method: "POST" }),
};
