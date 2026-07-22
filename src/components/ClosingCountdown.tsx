import { useEffect, useState } from "react";

// Must match the Vercel Cron schedule in vercel.json ("30 16 * * *", which
// runs in UTC) so the countdown always points at the real auto-close moment.
const CUTOFF_HOUR_UTC = 16;
const CUTOFF_MINUTE_UTC = 30;

function getRemaining() {
  const now = new Date();
  const cutoff = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), CUTOFF_HOUR_UTC, CUTOFF_MINUTE_UTC, 0)
  );
  if (now.getTime() >= cutoff.getTime()) {
    cutoff.setUTCDate(cutoff.getUTCDate() + 1);
  }
  const totalMinutes = Math.max(0, Math.floor((cutoff.getTime() - now.getTime()) / 60000));
  return { hours: Math.floor(totalMinutes / 60), minutes: totalMinutes % 60 };
}

export function ClosingCountdown() {
  const [remaining, setRemaining] = useState(getRemaining);

  useEffect(() => {
    const id = window.setInterval(() => setRemaining(getRemaining()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="rounded-2xl border border-border-line bg-paper-card px-4 py-3 text-center shadow-sm dark:border-stone-700 dark:bg-stone-900">
      <p className="text-[11px] font-mono uppercase tracking-widest text-stone-500 dark:text-stone-400">
        Clôture du jeu à 16h30
      </p>
      <p className="font-display text-lg font-bold text-ink dark:text-white">
        {remaining.hours}h {String(remaining.minutes).padStart(2, "0")}min restantes
      </p>
    </div>
  );
}
