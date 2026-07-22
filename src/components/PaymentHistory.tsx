import type { HistoryDay } from "../api/client";

interface PaymentHistoryProps {
  days: HistoryDay[];
  isAdmin: boolean;
  onToggleExtraPaid: (date: string) => void;
}

export function PaymentHistory({ days, isAdmin, onToggleExtraPaid }: PaymentHistoryProps) {
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
            <p className="mb-2 text-[11px] text-stone-500 dark:text-stone-400">
              {day.totalPaid.toLocaleString("en-US")} paid · {day.totalUnpaid.toLocaleString("en-US")} unpaid
            </p>
            <ul className="flex flex-col gap-1.5">
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
                        <button
                          type="button"
                          disabled={!isAdmin}
                          onClick={() => onToggleExtraPaid(day.date)}
                          className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase transition ${
                            m.extraPenaltyPaid
                              ? "bg-green-500/15 text-green-600 dark:text-green-400"
                              : "bg-stamp/15 text-stamp"
                          } ${isAdmin ? "cursor-pointer hover:opacity-80" : "cursor-default"}`}
                        >
                          top offender {m.extraPenaltyPaid ? "· paid" : "· unpaid"}
                        </button>
                      )}
                    </span>
                    <span className="font-mono">
                      {m.paidMistakes} paid, {m.unpaidMistakes} unpaid → {m.amountDue.toLocaleString("en-US")} FCFA
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
