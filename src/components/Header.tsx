import { motion } from "framer-motion";
import { LogOut, Volume2, VolumeX } from "lucide-react";
import type { Role } from "../api/client";

interface HeaderProps {
  displayDate: string;
  totalMistakes: number;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  username: string;
  role: Role;
  onLogout: () => void;
}

export function Header({
  displayDate,
  totalMistakes,
  soundEnabled,
  onToggleSound,
  username,
  role,
  onLogout,
}: HeaderProps) {
  return (
    <header className="perforated-edge relative overflow-hidden bg-gradient-to-br from-brand to-brand-dark pb-8 pt-6 text-white sm:pb-10 sm:pt-8">
      <div className="mx-auto flex max-w-3xl flex-col gap-6 px-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-white/85">
            <span className="font-medium">{username}</span>
            <span className="rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
              {role}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onToggleSound}
              aria-pressed={soundEnabled}
              aria-label={soundEnabled ? "Mute sound effects" : "Enable sound effects"}
              className="rounded-full p-2 text-white/85 transition hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </button>
            <button
              type="button"
              onClick={onLogout}
              aria-label="Sign out"
              className="rounded-full p-2 text-white/85 transition hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>

        <div>
          <motion.h1
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="font-display text-3xl font-bold leading-tight tracking-tight sm:text-4xl"
          >
             English Day Challenge
          </motion.h1>
          <p className="mt-1.5 max-w-md text-sm text-white/85 sm:text-base">
            Speak English only.
          </p>
        </div>

        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>

            <p className="font-display text-sm font-medium text-white sm:text-base">
              {displayDate}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[11px] font-mono uppercase tracking-widest text-white/60">
              Total mistakes
            </p>
            <p className="font-mono text-3xl font-bold leading-none tabular-nums sm:text-4xl">
              {totalMistakes}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
