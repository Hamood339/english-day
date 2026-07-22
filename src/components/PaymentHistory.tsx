import type { HistoryDay } from "../api/client";

interface PaymentHistoryProps {
  days: HistoryDay[];
}

export function PaymentHistory({ days }: PaymentHistoryProps) {
  if (days.length === 0) return null;

  return (
    <section aria-labelledby="history-heading" className="flex flex-col gap-3">
      <h2
        id="history-heading"
        className="font-display text-sm font-semibold uppercase tracking-wide text-ink dark:text-white"
      >
        Past days collected
      </h2>
      <div className="flex flex-col gap-3">
        {days.map((day) => (
          <div
            key={day.date}
            className="rounded-2xl border border-border-line bg-paper-card p-4 shadow-sm dark:border-stone-700 dark:bg-stone-900"
          >
            <div className="mb-2 flex items-center justify-between">
              <p className="font-display text-sm font-semibold text-ink dark:text-white">
                {day.date}
              </p>
              <p className="font-mono text-sm font-bold text-brand dark:text-orange-300">
                {day.totalAmount.toLocaleString("en-US")} FCFA
              </p>
            </div>
            <ul className="flex flex-col gap-1">
              {day.members
                .filter((m) => m.mistakes > 0)
                .map((m) => (
                  <li
                    key={m.id}
                    className="flex items-center justify-between text-xs text-stone-600 dark:text-stone-300"
                  >
                    <span className="flex items-center gap-1.5">
                      {m.name}
                      {m.isTopOffender && (
                        <span className="rounded-full bg-stamp/15 px-1.5 py-0.5 text-[9px] font-bold uppercase text-stamp">
                          top offender
                        </span>
                      )}
                    </span>
                    <span className="font-mono">
                      {m.mistakes} × → {m.amountDue.toLocaleString("en-US")} FCFA
                    </span>
                  </li>
                ))}
              {day.members.every((m) => m.mistakes === 0) && (
                <li className="text-xs text-stone-400">No infractions that day.</li>
              )}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
