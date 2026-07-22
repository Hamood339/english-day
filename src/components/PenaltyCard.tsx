import { motion } from "framer-motion";
import type { Member } from "../types/member";

interface PenaltyCardProps {
  mostWanted: Member[];
  hasMembers: boolean;
  penaltyAmount: number;
}

export function PenaltyCard({ mostWanted, hasMembers, penaltyAmount }: PenaltyCardProps) {
  if (mostWanted.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border-line bg-paper-card p-6 text-center dark:border-stone-700 dark:bg-stone-900">
        <p className="text-sm text-stone-500 dark:text-stone-400">
          {hasMembers
            ? "No infractions yet — everyone's passport is clean. 🕊️"
            : "Add your travellers below to open the day."}
        </p>
      </div>
    );
  }

  const names = mostWanted.map((m) => m.name).join(" & ");
  const isTie = mostWanted.length > 1;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, rotate: -1 }}
      animate={{ opacity: 1, scale: 1, rotate: -1.5 }}
      transition={{ type: "spring", stiffness: 220, damping: 20 }}
      className="relative overflow-hidden rounded-2xl border-2 border-stamp bg-stamp/5 p-5 shadow-sm dark:bg-stamp/10 sm:p-6"
    >
      <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-stamp/10 dark:bg-stamp/20" />
      <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="stamp-mark inline-block bg-transparent px-2 py-0.5 text-[11px] font-bold uppercase">
            {isTie ? "Most wanted — tied" : "Most wanted"}
          </p>
          <p className="mt-2 font-display text-xl font-bold text-ink dark:text-white sm:text-2xl">
            {names}
          </p>
          <p className="mt-0.5 text-sm text-stone-600 dark:text-stone-300">
            {isTie
              ? "must split the fine of English Day."
              : "owes the fine of English Day."}
          </p>
        </div>
        <div className="shrink-0 rounded-xl bg-ink px-4 py-3 text-center dark:bg-black">
          <p className="text-[10px] font-mono uppercase tracking-widest text-white/60">
            Penalty due
          </p>
          <p className="font-mono text-2xl font-bold text-white">
            {(mostWanted[0].mistakes * penaltyAmount).toLocaleString("en-US")}
            <span className="ml-1 text-sm font-medium text-white/70">FCFA</span>
          </p>
        </div>
      </div>
    </motion.div>
  );
}
