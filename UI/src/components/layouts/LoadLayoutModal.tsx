import React from "react";
import LayoutModalShell from "./LayoutModalShell";
import { useDash } from "../../store/dashboard";
import type { LayoutMeta } from "../../lib/layouts/types";

type LoadLayoutModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function LoadLayoutModal({ isOpen, onClose }: LoadLayoutModalProps) {
  const listLayouts = useDash((state) => state.listLayouts);
  const loadLayout = useDash((state) => state.loadLayout);

  const [layouts, setLayouts] = React.useState<LayoutMeta[]>([]);
  const [selected, setSelected] = React.useState<string>("");
  const [mode, setMode] = React.useState<"replace" | "append">("replace");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    if (!isOpen) return;
    setLoading(true);
    setError(null);
    setSelected("");
    setMode("replace");
    (async () => {
      try {
        const data = await listLayouts();
        if (!cancelled) {
          setLayouts(data);
          if (data.length > 0) setSelected(data[0].name);
        }
      } catch (err) {
        if (!cancelled) {
          setError("Unable to load saved layouts.");
          console.warn(err);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isOpen, listLayouts]);

  const handleLoad = async () => {
    if (!selected) return;
    setLoading(true);
    setError(null);
    try {
      await loadLayout(selected, mode);
      onClose();
    } catch (err) {
      console.warn(err);
      setError("Failed to apply layout.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <LayoutModalShell title="Load layout" onClose={onClose}>
      <div className="space-y-4">
        {layouts.length === 0 ? (
          <p className="text-sm text-white/70">No saved layouts yet.</p>
        ) : (
          <div className="flex max-h-72 flex-col gap-2 overflow-y-auto pr-1">
            {layouts.map((layout) => (
              <button
                key={layout.name}
                type="button"
                onClick={() => setSelected(layout.name)}
                className={
                  "flex items-center justify-between rounded-md border px-3 py-2 text-left text-sm transition-colors " +
                  (selected === layout.name
                    ? "border-cyan-300/60 bg-cyan-500/15 text-white"
                    : "border-white/10 bg-white/5 hover:bg-white/10 text-white/90")
                }
                aria-pressed={selected === layout.name}
              >
                <span className="flex flex-col">
                  <span className="font-medium">{layout.name}</span>
                  <span className="text-xs text-white/60">
                    {layout.count} item{layout.count === 1 ? "" : "s"} • Updated {new Date(layout.updatedAt).toLocaleString()}
                  </span>
                </span>
              </button>
            ))}
          </div>
        )}

        <fieldset className="flex gap-3 text-xs text-white/80">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="layout-mode"
              checked={mode === "replace"}
              onChange={() => setMode("replace")}
            />
            Replace current dashboard
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="layout-mode"
              checked={mode === "append"}
              onChange={() => setMode("append")}
            />
            Append to current dashboard
          </label>
        </fieldset>

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
            onClick={handleLoad}
            disabled={!selected || loading || layouts.length === 0}
            className="rounded-md bg-cyan-500 px-3 py-2 text-sm font-medium text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading ? "Loading…" : "Load"}
          </button>
        </div>
      </div>
    </LayoutModalShell>
  );
}

