import { useState, type FormEvent } from "react";
import { useAuth } from "../contexts/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(username, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-4 dark:bg-stone-950">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-2xl border border-border-line bg-paper-card p-6 shadow-sm dark:border-stone-700 dark:bg-stone-900"
      >
        <h1 className="mb-1 font-display text-lg font-semibold text-ink dark:text-white">
          English Day Challenge
        </h1>
        <p className="mb-5 text-sm text-stone-500 dark:text-stone-400">
          Sign in to view or manage today's scores.
        </p>

        <label className="mb-3 block text-sm text-ink dark:text-white">
          Username
          <input
            className="mt-1 w-full rounded-xl border border-border-line bg-paper px-3 py-2.5 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/25 dark:border-stone-600 dark:bg-stone-950 dark:text-white"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoFocus
            autoComplete="username"
          />
        </label>

        <label className="mb-4 block text-sm text-ink dark:text-white">
          Password
          <input
            type="password"
            className="mt-1 w-full rounded-xl border border-border-line bg-paper px-3 py-2.5 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/25 dark:border-stone-600 dark:bg-stone-950 dark:text-white"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </label>

        {error && <p className="mb-4 text-sm font-medium text-stamp">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-full bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark disabled:opacity-60"
        >
          {submitting ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
