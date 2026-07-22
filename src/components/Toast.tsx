import { AnimatePresence, motion } from "framer-motion";
import { Stamp } from "lucide-react";

export interface ToastMessage {
  id: number;
  text: string;
}

interface ToastProps {
  toasts: ToastMessage[];
}

export function Toast({ toasts }: ToastProps) {
  return (
    <div
      className="fixed bottom-4 left-1/2 z-50 flex -transtone-x-1/2 flex-col items-center gap-2 px-4 sm:bottom-6"
      aria-live="polite"
    >
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 16, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 28 }}
            className="flex items-center gap-2 rounded-full border border-border-line bg-ink px-4 py-2.5 text-sm font-medium text-white shadow-lg dark:bg-white dark:text-ink"
            role="status"
          >
            <Stamp size={16} className="shrink-0 text-stamp" />
            <span>{toast.text}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
