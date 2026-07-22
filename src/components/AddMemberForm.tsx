import { useState, type FormEvent } from "react";
import { UserPlus } from "lucide-react";

interface AddMemberFormProps {
  onAdd: (name: string) => void;
}

export function AddMemberForm({ onAdd }: AddMemberFormProps) {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Enter a name before adding a traveller.");
      return;
    }
    onAdd(trimmed);
    setName("");
    setError(null);
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-border-line bg-paper-card p-4 shadow-sm dark:border-stone-700 dark:bg-stone-900 sm:p-5">
      <label
        htmlFor="member-name"
        className="mb-2 block font-display text-sm font-semibold text-ink dark:text-white"
      >
        Add a traveller
      </label>
      <div className="flex gap-2">
        <input
          id="member-name"
          type="text"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (error) setError(null);
          }}
          placeholder="Member name"
          className="flex-1 rounded-xl border border-border-line bg-paper px-3.5 py-2.5 text-sm text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/25 dark:border-stone-600 dark:bg-stone-900 dark:text-white"
          aria-invalid={!!error}
          aria-describedby={error ? "member-name-error" : undefined}
        />
        <button
          type="submit"
          aria-label="Add member"
          className="flex shrink-0 items-center gap-1.5 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand active:scale-95"
        >
          <UserPlus size={16} />
          <span className="hidden sm:inline">Add member</span>
        </button>
      </div>
      {error && (
        <p id="member-name-error" className="mt-2 text-xs font-medium text-stamp">
          {error}
        </p>
      )}
    </form>
  );
}
