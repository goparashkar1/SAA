import React from "react";
import LayoutModalShell from "./LayoutModalShell";
import { useDash } from "../../store/dashboard";

type SaveLayoutModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
};

export default function SaveLayoutModal({
  isOpen,
  onClose,
  onSaved,
}: SaveLayoutModalProps) {
  const listLayouts = useDash((state) => state.listLayouts);
  const saveLayoutAs = useDash((state) => state.saveLayoutAs);

  const [name, setName] = React.useState("");
  const [overwrite, setOverwrite] = React.useState(false);
  const [existingNames, setExistingNames] = React.useState<string[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    if (!isOpen) return;
    setName("");
    setOverwrite(false);
    setError(null);
    setLoading(false);
    (async () => {
      try {
        const layouts = await listLayouts();
        if (!cancelled) {
          setExistingNames(layouts.map((l) => l.name));
        }
      } catch (err) {
        console.warn("Failed to list layouts", err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isOpen, listLayouts]);

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Please enter a layout name.");
      return;
    }
    if (!overwrite && existingNames.includes(trimmed)) {
      setError("A layout with this name already exists. Enable overwrite to replace it.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await saveLayoutAs(trimmed, overwrite);
      onSaved?.();
      onClose();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to save layout.";
      setError(message === "DUPLICATE_NAME" ? "A layout with this name already exists." : message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <LayoutModalShell title="Save layout" onClose={onClose}>
      <div className="space-y-4">
        <label className="flex flex-col gap-1 text-sm text-white/80">
          Layout name
          <input
            type="text"
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              setError(null);
            }}
            className="rounded-md border border-white/15 bg-white/5 px-3 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none"
            placeholder="e.g. Morning brief"
          />
        </label>
        {existingNames.includes(name.trim()) && !overwrite && (
          <p className="text-xs text-yellow-300">
            A layout with this name exists. Enable overwrite to replace it.
          </p>
        )}
        <label className="flex items-center gap-2 text-xs text-white/70">
          <input
            type="checkbox"
            checked={overwrite}
            onChange={(event) => setOverwrite(event.target.checked)}
            className="h-4 w-4 rounded border-white/20 bg-transparent"
          />
          Overwrite existing layout with the same name
        </label>
        {error && <p className="text-xs text-red-400">{error}</p>}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white transition-colors hover:bg-white/10"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={loading}
            className="rounded-md bg-cyan-500 px-3 py-2 text-sm font-medium text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </LayoutModalShell>
  );
}

