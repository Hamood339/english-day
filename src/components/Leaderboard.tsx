import { motion } from "framer-motion";
import type { Member } from "../types/member";

interface LeaderboardProps {
  rankedMembers: Member[];
  penaltyAmount: number;
}

const RANK_STYLES = [
  "bg-gold text-white",
  "bg-stone-300 text-stone-700 dark:bg-stone-500 dark:text-white",
  "bg-amber-700/70 text-white",
];

export function Leaderboard({ rankedMembers, penaltyAmount }: LeaderboardProps) {
  if (rankedMembers.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border-line p-6 text-center text-sm text-stone-500 dark:border-stone-700 dark:text-stone-400">
        Add your first traveller to open the watchlist.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border-line bg-paper-card shadow-sm dark:border-stone-700 dark:bg-stone-900">
      <div className="flex items-center justify-between border-b border-border-line px-5 py-3.5 dark:border-stone-700">
        <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-ink dark:text-white">
          🏆 Most Wanted
        </h2>
        <span className="font-mono text-[11px] text-stone-500 dark:text-stone-400">
          ranked live
        </span>
      </div>
      <ul>
        {rankedMembers.map((member, index) => (
          <motion.li
            key={member.id}
            layout
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="flex items-center gap-3 border-b border-border-line/70 px-5 py-3 last:border-b-0 dark:border-stone-700/70"
          >
            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-mono text-xs font-bold ${
                RANK_STYLES[index] ?? "bg-stone-100 text-stone-500 dark:bg-stone-700 dark:text-stone-300"
              }`}
            >
              {index + 1}
            </span>
            <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink dark:text-white">
              {member.name}
            </span>
            <span className="font-mono text-sm font-semibold tabular-nums text-stone-600 dark:text-stone-300">
              {member.mistakes} {member.mistakes === 1 ? "mistake" : "mistakes"}
            </span>
            <span className="font-mono text-xs font-semibold tabular-nums text-stamp">
              {(member.mistakes * penaltyAmount).toLocaleString("en-US")} FCFA
            </span>
          </motion.li>
        ))}
      </ul>
    </div>
  );
}
