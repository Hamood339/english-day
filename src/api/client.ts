export interface ApiMember {
  id: number;
  name: string;
  mistakes: number;
}

export interface SessionPayload {
  date: string;
  soundEnabled: boolean;
  penaltyAmount: number;
  topPenaltyAmount: number;
  members: ApiMember[];
}

export interface SummaryPayload {
  date: string;
  penaltyAmount: number;
  topPenaltyAmount: number;
  totalMistakes: number;
  totalAmount: number;
  members: (ApiMember & { amountDue: number; isTopOffender: boolean })[];
}

export interface HistoryDay {
  date: string;
  totalMistakes: number;
  totalAmount: number;
  members: (ApiMember & { amountDue: number; isTopOffender: boolean })[];
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
  resetDay: () => request<SessionPayload>("/api/session-reset", { method: "POST" }),
  startNewDay: (keepScores: boolean) =>
    request<SessionPayload>("/api/session-new-day", {
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

  getSummary: () => request<SummaryPayload>("/api/summary"),
  getHistory: () => request<HistoryDay[]>("/api/history"),
};
