import type { Member } from "../types/member";

interface StatsCardProps {
  totalMistakes: number;
  mostDisciplined: Member[];
  mostWanted: Member[];
  totalAmount: number;
}

export function StatsCard({
  totalMistakes,
  mostDisciplined,
  mostWanted,
  totalAmount,
}: StatsCardProps) {
  const disciplinedLabel =
    mostDisciplined.length === 0
      ? "—"
      : mostDisciplined.map((m) => m.name).join(" & ");
  const wantedLabel =
    mostWanted.length === 0 ? "—" : mostWanted.map((m) => m.name).join(" & ");

  return (
    <div className="rounded-2xl border border-border-line bg-paper-card p-5 shadow-sm dark:border-stone-700 dark:bg-stone-900">
      <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-ink dark:text-white">
        Today at a glance
      </h2>
      <dl className="mt-3 grid grid-cols-2 gap-3 text-center sm:grid-cols-4">
        <div>
          <dt className="text-[11px] text-stone-500 dark:text-stone-400">
            Total mistakes
          </dt>
          <dd className="mt-1 font-mono text-xl font-bold text-ink dark:text-white">
            {totalMistakes}
          </dd>
        </div>
        <div>
          <dt className="text-[11px] text-stone-500 dark:text-stone-400">
            Total collected
          </dt>
          <dd className="mt-1 font-mono text-xl font-bold text-brand dark:text-orange-300">
            {totalAmount.toLocaleString("en-US")}
          </dd>
        </div>
        <div>
          <dt className="text-[11px] text-stone-500 dark:text-stone-400">
            Most disciplined
          </dt>
          <dd className="mt-1 truncate font-display text-sm font-semibold text-brand dark:text-orange-300">
            {disciplinedLabel}
          </dd>
        </div>
        <div>
          <dt className="text-[11px] text-stone-500 dark:text-stone-400">
            Most wanted
          </dt>
          <dd className="mt-1 truncate font-display text-sm font-semibold text-stamp">
            {wantedLabel}
          </dd>
        </div>
      </dl>
    </div>
  );
}
