import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Pencil, Plane, RotateCcw, Stamp, Trash2, Undo2, Wallet, X } from "lucide-react";
import type { Member } from "../types/member";

interface MemberCardProps {
  member: Member;
  isMostWanted: boolean;
  onAddMistake: (id: number) => void;
  onUndoMistake: (id: number) => void;
  onPayMistake: (id: number) => void;
  onUnpayMistake: (id: number) => void;
  onRename: (id: number, name: string) => void;
  onRequestDelete: (id: number) => void;
  readOnly?: boolean;
}

const AVATARS = ["🙂", "😄", "🧑‍💼", "👩‍🎓", "🧑‍🎨", "😊", "🤓", "👨‍🚀", "👩‍🚀", "🙃"];

function avatarFor(id: number) {
  return AVATARS[id % AVATARS.length];
}

export function MemberCard({
  member,
  isMostWanted,
  onAddMistake,
  onUndoMistake,
  onPayMistake,
  onUnpayMistake,
  onRename,
  onRequestDelete,
  readOnly = false,
}: MemberCardProps) {
  const [stampBurst, setStampBurst] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [draftName, setDraftName] = useState(member.name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  const handleClick = () => {
    onAddMistake(member.id);
    setStampBurst((n) => n + 1);
  };

  const startEditing = () => {
    setDraftName(member.name);
    setIsEditing(true);
  };

  const commitEdit = () => {
    const trimmed = draftName.trim();
    if (trimmed && trimmed !== member.name) {
      onRename(member.id, trimmed);
    }
    setIsEditing(false);
  };

  const cancelEdit = () => {
    setDraftName(member.name);
    setIsEditing(false);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 14, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.94, height: 0, marginBottom: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 24 }}
      className={`relative flex overflow-hidden rounded-2xl border bg-paper-card shadow-sm transition-colors dark:bg-stone-900 ${
        isMostWanted
          ? "border-stamp/60 ring-1 ring-stamp/40"
          : "border-border-line dark:border-stone-700"
      }`}
    >
      {/* Ink stamp burst on click */}
      <AnimatePresence>
        {stampBurst > 0 && (
          <motion.div
            key={stampBurst}
            initial={{ opacity: 0, scale: 2.2, rotate: -18 }}
            animate={{ opacity: [0, 1, 1, 0], scale: 1, rotate: -8 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, times: [0, 0.15, 0.75, 1] }}
            className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center"
          >
            <span className="stamp-mark bg-white/70 px-4 py-1.5 text-base font-bold uppercase dark:bg-stone-950/70">
              Caught!
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-1 flex-col gap-2 p-4 sm:p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand/10 text-xl dark:bg-brand/20">
            {avatarFor(member.id)}
          </div>
          <div className="min-w-0 flex-1">
            {isEditing ? (
              <div className="flex items-center gap-1.5">
                <input
                  ref={inputRef}
                  type="text"
                  value={draftName}
                  onChange={(e) => setDraftName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") commitEdit();
                    if (e.key === "Escape") cancelEdit();
                  }}
                  aria-label={`Rename ${member.name}`}
                  className="w-full min-w-0 rounded-lg border border-brand/50 bg-paper px-2 py-1 font-display text-base font-semibold text-ink outline-none focus:ring-2 focus:ring-brand/30 dark:bg-stone-950 dark:text-white"
                />
                <button
                  type="button"
                  onClick={commitEdit}
                  aria-label="Save name"
                  className="shrink-0 rounded-lg p-1.5 text-brand hover:bg-brand/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand"
                >
                  <Check size={16} />
                </button>
                <button
                  type="button"
                  onClick={cancelEdit}
                  aria-label="Cancel rename"
                  className="shrink-0 rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand dark:hover:bg-stone-800"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <p className="truncate font-display text-base font-semibold text-ink dark:text-white">
                {member.name}
              </p>
            )}
            <p className="text-xs text-stone-500 dark:text-stone-400">
              {member.paidMistakes} paid · {member.unpaidMistakes} unpaid
            </p>
          </div>
          <div className="text-right">
            <motion.p
              key={member.mistakes}
              initial={{ scale: 1.35 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.35 }}
              className="font-mono text-2xl font-bold leading-none tabular-nums text-ink dark:text-white"
            >
              {member.mistakes}
            </motion.p>
          </div>
        </div>

        {!isEditing && !readOnly && (
          <div className="flex items-center gap-1 pl-14">
            <button
              type="button"
              onClick={startEditing}
              className="flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium text-stone-500 transition hover:bg-stone-100 hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-white"
            >
              <Pencil size={12} />
              Rename
            </button>
            <button
              type="button"
              onClick={() => onUndoMistake(member.id)}
              disabled={member.mistakes === 0}
              className="flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium text-stone-500 transition hover:bg-stone-100 hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-white"
            >
              <Undo2 size={12} />
              Undo (misheard)
            </button>
            <button
              type="button"
              onClick={() => onPayMistake(member.id)}
              disabled={member.unpaidMistakes === 0}
              className="flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium text-stone-500 transition hover:bg-stone-100 hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-white"
            >
              <Wallet size={12} />
              Pay
            </button>
            <button
              type="button"
              onClick={() => onUnpayMistake(member.id)}
              disabled={member.paidMistakes === 0}
              aria-label={`Undo last payment for ${member.name}`}
              className="flex items-center gap-1 rounded-full p-1 text-[11px] font-medium text-stone-500 transition hover:bg-stone-100 hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-white"
            >
              <RotateCcw size={12} />
            </button>
            <button
              type="button"
              onClick={() => onRequestDelete(member.id)}
              aria-label={`Remove ${member.name}`}
              className="ml-auto flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium text-stone-500 transition hover:bg-stamp/10 hover:text-stamp focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand dark:text-stone-400 dark:hover:bg-stamp/20 dark:hover:text-orange-300"
            >
              <Trash2 size={12} />
              <span className="hidden sm:inline" aria-hidden="true">Remove</span>
            </button>
          </div>
        )}
      </div>

      {/* Perforated divider mimicking a boarding-pass stub */}
      <div className="relative flex w-[64px] shrink-0 flex-col items-center justify-center border-l border-dashed border-border-line py-3 dark:border-stone-600 sm:w-[76px]">
        <Plane size={16} className="mb-2 rotate-45 text-brand/70 dark:text-brand" />
        <button
          type="button"
          onClick={handleClick}
          disabled={readOnly}
          aria-label={`Record an English Day mistake for ${member.name}`}
          className="group flex flex-col items-center gap-0.5 rounded-xl px-1.5 py-1.5 text-brand transition hover:bg-brand/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent dark:text-orange-300"
        >
          <Stamp size={20} className="transition group-active:rotate-[-12deg]" />
          <span className="text-[10px] font-semibold uppercase tracking-wide">+1</span>
        </button>
      </div>
    </motion.div>
  );
}
