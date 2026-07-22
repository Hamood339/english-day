
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { RotateCcw } from "lucide-react";
import { Header } from "../components/Header";
import { MemberCard } from "../components/MemberCard";
import { Leaderboard } from "../components/Leaderboard";
import { AddMemberForm } from "../components/AddMemberForm";
import { PenaltyCard } from "../components/PenaltyCard";
import { PaymentHistory } from "../components/PaymentHistory";
import { LoginModal } from "../components/LoginModal";
import { ConfirmModal } from "../components/ConfirmModal";
import { StatsCard } from "../components/StatsCard";
import { Toast, type ToastMessage } from "../components/Toast";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { useSession } from "../hooks/useSession";
import { useAuth } from "../contexts/AuthContext";
import { api, type HistoryDay } from "../api/client";
import {
  formatDisplayDate,
  getMostDisciplined,
  getMostWanted,
  getTotalMistakes,
  sortByMistakes,
  todayKey,
} from "../utils/ranking";
import { playOopsSound } from "../utils/sound";

const DARK_MODE_KEY = "english-day-challenge:dark-mode";

const CAUGHT_LINES = [
  "got caught speaking another language! 😅",
  "slipped out of English again! 🫣",
  "just broke the English Day rule! 🚨",
  "was overheard in the wrong language! 👀",
];

export default function Home() {
  const { user, logout } = useAuth();
  const { session, setSession } = useSession();
  const [darkMode, setDarkMode] = useLocalStorage<boolean>(DARK_MODE_KEY, false);
  const [resetOpen, setResetOpen] = useState(false);
  const [newDayOpen, setNewDayOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [history, setHistory] = useState<HistoryDay[]>([]);
  const [loginOpen, setLoginOpen] = useState(false);

  const isAdmin = user?.role === "admin";

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  // If the shared day cursor is behind today, offer a fresh start (admin only).
  useEffect(() => {
    if (isAdmin && session && session.date !== todayKey()) {
      setNewDayOpen(true);
    }
  }, [isAdmin, session]);

  useEffect(() => {
    api.getHistory().then(setHistory).catch(() => {});
  }, [session?.date]);

  const members = useMemo(() => session?.members ?? [], [session]);
  const penaltyAmount = session?.penaltyAmount ?? 100;
  const topPenaltyAmount = session?.topPenaltyAmount ?? 1000;

  const rankedMembers = useMemo(() => sortByMistakes(members), [members]);
  const totalMistakes = useMemo(() => getTotalMistakes(members), [members]);
  const mostWanted = useMemo(() => getMostWanted(members), [members]);
  const mostDisciplined = useMemo(() => getMostDisciplined(members), [members]);
  const totalAmount =
    totalMistakes * penaltyAmount + (mostWanted.length > 0 ? mostWanted.length * topPenaltyAmount : 0);
  const memberPendingDelete = useMemo(
    () => members.find((m) => m.id === pendingDeleteId) ?? null,
    [members, pendingDeleteId]
  );

  const pushToast = (text: string) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, text }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2600);
  };

  const pushError = (err: unknown) => {
    pushToast(err instanceof Error ? err.message : "Something went wrong.");
  };

  const handleAddMistake = async (id: number) => {
    const member = members.find((m) => m.id === id);
    if (!member) return;
    try {
      setSession(await api.addMistake(id));
      if (session?.soundEnabled) playOopsSound();
      const line = CAUGHT_LINES[member.mistakes % CAUGHT_LINES.length];
      pushToast(`${member.name} ${line}`);
    } catch (err) {
      pushError(err);
    }
  };

  const handleUndoMistake = async (id: number) => {
    const member = members.find((m) => m.id === id);
    if (!member || member.mistakes === 0) return;
    try {
      setSession(await api.undoMistake(id));
      pushToast(`Rolled back one mistake for ${member.name}. Misheard, all good. 🙌`);
    } catch (err) {
      pushError(err);
    }
  };

  const handleRenameMember = async (id: number, name: string) => {
    try {
      setSession(await api.renameMember(id, name));
      pushToast(`Traveller renamed to ${name}.`);
    } catch (err) {
      pushError(err);
    }
  };

  const handleRequestDelete = (id: number) => setPendingDeleteId(id);

  const handleConfirmDelete = async () => {
    if (pendingDeleteId === null) return;
    const member = members.find((m) => m.id === pendingDeleteId);
    try {
      setSession(await api.deleteMember(pendingDeleteId));
      setPendingDeleteId(null);
      if (member) pushToast(`${member.name} was removed from today's challenge.`);
    } catch (err) {
      pushError(err);
    }
  };

  const handleAddMember = async (name: string) => {
    try {
      setSession(await api.addMember(name));
      pushToast(`${name} boarded the English Day challenge. ✈️`);
    } catch (err) {
      pushError(err);
    }
  };

  const handleReset = async () => {
    try {
      setSession(await api.resetDay());
      setResetOpen(false);
      pushToast("Fresh passport for everyone. Reset complete. 🧼");
      api.getHistory().then(setHistory).catch(() => {});
    } catch (err) {
      pushError(err);
    }
  };

  const handleStartNewDay = async () => {
    try {
      setSession(await api.startNewDay(false));
      setNewDayOpen(false);
      api.getHistory().then(setHistory).catch(() => {});
    } catch (err) {
      pushError(err);
    }
  };

  const handleKeepScores = async () => {
    try {
      setSession(await api.startNewDay(true));
      setNewDayOpen(false);
    } catch (err) {
      pushError(err);
    }
  };

  const toggleSound = async () => {
    if (!session) return;
    try {
      setSession(await api.toggleSound(!session.soundEnabled));
    } catch (err) {
      pushError(err);
    }
  };

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-stone-500 dark:text-stone-400">
        Loading today's scores…
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-16">
      <Header
        displayDate={formatDisplayDate(session.date)}
        totalMistakes={totalMistakes}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode((d) => !d)}
        soundEnabled={session.soundEnabled}
        onToggleSound={toggleSound}
        user={user}
        onLogout={logout}
        onLoginClick={() => setLoginOpen(true)}
      />

      <main className="mx-auto -mt-4 flex max-w-3xl flex-col gap-6 px-5 sm:-mt-5">
        <PenaltyCard
          mostWanted={mostWanted}
          hasMembers={members.length > 0}
          penaltyAmount={penaltyAmount}
          topPenaltyAmount={topPenaltyAmount}
        />

        <StatsCard
          totalMistakes={totalMistakes}
          mostDisciplined={mostDisciplined}
          mostWanted={mostWanted}
          totalAmount={totalAmount}
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
              {members.length} traveller
              {members.length === 1 ? "" : "s"}
            </span>
          </div>
          <div className="flex flex-col gap-3">
            <AnimatePresence initial={false}>
              {members.map((member) => (
                <MemberCard
                  key={member.id}
                  member={member}
                  isMostWanted={mostWanted.some((m) => m.id === member.id)}
                  onAddMistake={handleAddMistake}
                  onUndoMistake={handleUndoMistake}
                  onRename={handleRenameMember}
                  onRequestDelete={handleRequestDelete}
                  readOnly={!isAdmin}
                />
              ))}
            </AnimatePresence>
            {members.length === 0 && (
              <div className="rounded-2xl border border-dashed border-border-line p-6 text-center text-sm text-stone-500 dark:border-stone-700 dark:text-stone-400">
                No travellers yet — add the first one below to start the day.
              </div>
            )}
          </div>
        </section>

        {isAdmin && <AddMemberForm onAdd={handleAddMember} />}

        <Leaderboard
          rankedMembers={rankedMembers}
          penaltyAmount={penaltyAmount}
          topPenaltyAmount={topPenaltyAmount}
        />

        <PaymentHistory days={history} />

        {isAdmin && (
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
        )}
      </main>

      <Toast toasts={toasts} />

      <ConfirmModal
        open={resetOpen}
        title="Reset today's scores?"
        message="Are you sure you want to reset today's scores? Today's totals are archived to history first, then every mistake count clears back to zero."
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

      {loginOpen && <LoginModal onClose={() => setLoginOpen(false)} />}

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mx-auto mt-10 max-w-3xl px-5 text-center text-xs text-stone-400 dark:text-stone-500"
      >
        Scores are shared live from the team's database — everyone sees the same numbers.
      </motion.p>
    </div>
  );
}
