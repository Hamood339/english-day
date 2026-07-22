import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { RotateCcw } from "lucide-react";
import { Header } from "../components/Header";
import { MemberCard } from "../components/MemberCard";
import { Leaderboard } from "../components/Leaderboard";
import { AddMemberForm } from "../components/AddMemberForm";
import { PenaltyCard } from "../components/PenaltyCard";
import { ConfirmModal } from "../components/ConfirmModal";
import { StatsCard } from "../components/StatsCard";
import { Toast, type ToastMessage } from "../components/Toast";
import { useLocalStorage } from "../hooks/useLocalStorage";
import type { DaySession } from "../types/member";
import {
  formatDisplayDate,
  getMostDisciplined,
  getMostWanted,
  getTotalMistakes,
  sortByMistakes,
  todayKey,
} from "../utils/ranking";
import { playOopsSound } from "../utils/sound";

const STORAGE_KEY = "english-day-challenge:session";
const DARK_MODE_KEY = "english-day-challenge:dark-mode";

const CAUGHT_LINES = [
  "got caught speaking another language! 😅",
  "slipped out of English again! 🫣",
  "just broke the English Day rule! 🚨",
  "was overheard in the wrong language! 👀",
];

function createSession(): DaySession {
  return {
    date: todayKey(),
    members: [],
    soundEnabled: true,
  };
}

export default function Home() {
  const [session, setSession] = useLocalStorage<DaySession>(
    STORAGE_KEY,
    createSession()
  );
  const [darkMode, setDarkMode] = useLocalStorage<boolean>(DARK_MODE_KEY, false);
  const [resetOpen, setResetOpen] = useState(false);
  const [newDayOpen, setNewDayOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  // If the calendar day has changed since the last visit, offer a fresh start.
  useEffect(() => {
    if (session.date !== todayKey()) {
      setNewDayOpen(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rankedMembers = useMemo(
    () => sortByMistakes(session.members),
    [session.members]
  );
  const totalMistakes = useMemo(
    () => getTotalMistakes(session.members),
    [session.members]
  );
  const mostWanted = useMemo(
    () => getMostWanted(session.members),
    [session.members]
  );
  const mostDisciplined = useMemo(
    () => getMostDisciplined(session.members),
    [session.members]
  );
  const memberPendingDelete = useMemo(
    () => session.members.find((m) => m.id === pendingDeleteId) ?? null,
    [session.members, pendingDeleteId]
  );

  const pushToast = (text: string) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, text }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2600);
  };

  const handleAddMistake = (id: number) => {
    const member = session.members.find((m) => m.id === id);
    if (!member) return;

    setSession((prev) => ({
      ...prev,
      members: prev.members.map((m) =>
        m.id === id ? { ...m, mistakes: m.mistakes + 1 } : m
      ),
    }));

    if (session.soundEnabled) playOopsSound();
    const line = CAUGHT_LINES[member.mistakes % CAUGHT_LINES.length];
    pushToast(`${member.name} ${line}`);
  };

  const handleUndoMistake = (id: number) => {
    const member = session.members.find((m) => m.id === id);
    if (!member || member.mistakes === 0) return;

    setSession((prev) => ({
      ...prev,
      members: prev.members.map((m) =>
        m.id === id ? { ...m, mistakes: Math.max(0, m.mistakes - 1) } : m
      ),
    }));
    pushToast(`Rolled back one mistake for ${member.name}. Misheard, all good. 🙌`);
  };

  const handleRenameMember = (id: number, name: string) => {
    setSession((prev) => ({
      ...prev,
      members: prev.members.map((m) => (m.id === id ? { ...m, name } : m)),
    }));
    pushToast(`Traveller renamed to ${name}.`);
  };

  const handleRequestDelete = (id: number) => {
    setPendingDeleteId(id);
  };

  const handleConfirmDelete = () => {
    if (pendingDeleteId === null) return;
    const member = session.members.find((m) => m.id === pendingDeleteId);
    setSession((prev) => ({
      ...prev,
      members: prev.members.filter((m) => m.id !== pendingDeleteId),
    }));
    setPendingDeleteId(null);
    if (member) pushToast(`${member.name} was removed from today's challenge.`);
  };

  const handleAddMember = (name: string) => {
    setSession((prev) => {
      const nextId =
        prev.members.length > 0
          ? Math.max(...prev.members.map((m) => m.id)) + 1
          : 1;
      return {
        ...prev,
        members: [...prev.members, { id: nextId, name, mistakes: 0 }],
      };
    });
    pushToast(`${name} boarded the English Day challenge. ✈️`);
  };

  const handleReset = () => {
    setSession((prev) => ({
      ...prev,
      members: prev.members.map((m) => ({ ...m, mistakes: 0 })),
      date: todayKey(),
    }));
    setResetOpen(false);
    pushToast("Fresh passport for everyone. Reset complete. 🧼");
  };

  const handleStartNewDay = () => {
    setSession((prev) => ({
      ...prev,
      members: prev.members.map((m) => ({ ...m, mistakes: 0 })),
      date: todayKey(),
    }));
    setNewDayOpen(false);
  };

  const handleKeepScores = () => {
    setSession((prev) => ({ ...prev, date: todayKey() }));
    setNewDayOpen(false);
  };

  const toggleSound = () => {
    setSession((prev) => ({ ...prev, soundEnabled: !prev.soundEnabled }));
  };

  return (
    <div className="min-h-screen pb-16">
      <Header
        displayDate={formatDisplayDate(session.date)}
        totalMistakes={totalMistakes}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode((d) => !d)}
        soundEnabled={session.soundEnabled}
        onToggleSound={toggleSound}
      />

      <main className="mx-auto -mt-4 flex max-w-3xl flex-col gap-6 px-5 sm:-mt-5">
        <PenaltyCard mostWanted={mostWanted} hasMembers={session.members.length > 0} />

        <StatsCard
          totalMistakes={totalMistakes}
          mostDisciplined={mostDisciplined}
          mostWanted={mostWanted}
        />

        <section aria-labelledby="participants-heading">
          <div className="mb-3 flex items-center justify-between">
            <h2
              id="participants-heading"
              className="font-display text-sm font-semibold uppercase tracking-wide text-ink dark:text-white"
            >
              Participants
            </h2>
            <span className="font-mono text-[11px] text-stone-500 dark:text-stone-400">
              {session.members.length} traveller
              {session.members.length === 1 ? "" : "s"}
            </span>
          </div>
          <div className="flex flex-col gap-3">
            <AnimatePresence initial={false}>
              {session.members.map((member) => (
                <MemberCard
                  key={member.id}
                  member={member}
                  isMostWanted={mostWanted.some((m) => m.id === member.id)}
                  onAddMistake={handleAddMistake}
                  onUndoMistake={handleUndoMistake}
                  onRename={handleRenameMember}
                  onRequestDelete={handleRequestDelete}
                />
              ))}
            </AnimatePresence>
            {session.members.length === 0 && (
              <div className="rounded-2xl border border-dashed border-border-line p-6 text-center text-sm text-stone-500 dark:border-stone-700 dark:text-stone-400">
                No travellers yet — add the first one below to start the day.
              </div>
            )}
          </div>
        </section>

        <AddMemberForm onAdd={handleAddMember} />

        <Leaderboard rankedMembers={rankedMembers} />

        <div className="flex justify-center pt-2">
          <button
            type="button"
            onClick={() => setResetOpen(true)}
            className="flex items-center gap-2 rounded-full border border-border-line px-4 py-2 text-sm font-medium text-stone-600 transition hover:bg-stone-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800"
          >
            <RotateCcw size={15} />
            Reset English Day
          </button>
        </div>
      </main>

      <Toast toasts={toasts} />

      <ConfirmModal
        open={resetOpen}
        title="Reset today's scores?"
        message="Are you sure you want to reset today's scores? This clears every mistake count back to zero."
        confirmLabel="Reset"
        cancelLabel="Keep scores"
        onConfirm={handleReset}
        onCancel={() => setResetOpen(false)}
      />

      <ConfirmModal
        open={pendingDeleteId !== null}
        title="Remove this traveller?"
        message={
          memberPendingDelete
            ? `Remove ${memberPendingDelete.name} from today's English Day? Their mistake count will be deleted too.`
            : "Remove this traveller from today's English Day?"
        }
        confirmLabel="Remove"
        cancelLabel="Cancel"
        onConfirm={handleConfirmDelete}
        onCancel={() => setPendingDeleteId(null)}
      />

      <ConfirmModal
        open={newDayOpen}
        title="It's a new day"
        message="The date has changed since your last visit. Start a fresh English Day, or keep yesterday's scores going?"
        confirmLabel="Start new day"
        cancelLabel="Keep scores"
        onConfirm={handleStartNewDay}
        onCancel={handleKeepScores}
      />

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mx-auto mt-10 max-w-3xl px-5 text-center text-xs text-stone-400 dark:text-stone-500"
      >
        Scores are saved on this device only, in your browser's local storage.
      </motion.p>
    </div>
  );
}
