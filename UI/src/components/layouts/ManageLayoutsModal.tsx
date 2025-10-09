import React from "react";
import LayoutModalShell from "./LayoutModalShell";
import { useDash } from "../../store/dashboard";
import type { LayoutMeta } from "../../lib/layouts/types";
import { Pencil, Trash2, Download } from "lucide-react";

type ManageLayoutsModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

type EditingState = {
  original: string;
  next: string;
};

export default function ManageLayoutsModal({
  isOpen,
  onClose,
}: ManageLayoutsModalProps) {
  const listLayouts = useDash((state) => state.listLayouts);
  const renameLayout = useDash((state) => state.renameLayout);
  const deleteLayout = useDash((state) => state.deleteLayout);
  const exportLayout = useDash((state) => state.exportLayout);

  const [layouts, setLayouts] = React.useState<LayoutMeta[]>([]);
  const [editing, setEditing] = React.useState<EditingState | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const refresh = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listLayouts();
      setLayouts(data);
    } catch (err) {
      console.warn(err);
      setError("Unable to load layouts.");
    } finally {
      setLoading(false);
    }
  }, [listLayouts]);

  React.useEffect(() => {
    if (!isOpen) return;
    refresh();
    setEditing(null);
    setError(null);
  }, [isOpen, refresh]);

  const handleRename = async () => {
    if (!editing) return;
    const nextName = editing.next.trim();
    if (!nextName) {
      setError("Name cannot be empty.");
      return;
    }
    if (layouts.some((l) => l.name === nextName && l.name !== editing.original)) {
      setError("Another layout already uses that name.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await renameLayout(editing.original, nextName);
      setEditing(null);
      await refresh();
    } catch (err) {
      console.warn(err);
      const message =
        err instanceof Error ? err.message : "Unable to rename layout.";
      setError(message === "DUPLICATE_NAME" ? "A layout already has that name." : message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (name: string) => {
    const confirmed = window.confirm(`Delete layout "${name}"?`);
    if (!confirmed) return;
    setLoading(true);
    setError(null);
    try {
      await deleteLayout(name);
      if (editing?.original === name) setEditing(null);
      await refresh();
    } catch (err) {
      console.warn(err);
      setError("Unable to delete layout.");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (name: string) => {
    try {
      await exportLayout(name);
    } catch (err) {
      console.warn(err);
      setError("Unable to export layout.");
    }
  };

  if (!isOpen) return null;

  return (
    <LayoutModalShell title="Manage layouts" onClose={onClose}>
      <div className="space-y-4">
        {error && <p className="text-xs text-red-400">{error}</p>}
        <div className="flex max-h-80 flex-col gap-2 overflow-y-auto pr-1">
          {layouts.length === 0 && !loading ? (
            <p className="text-sm text-white/70">No layouts saved yet.</p>
          ) : (
            layouts.map((layout) => {
              const isEditing = editing?.original === layout.name;
              return (
                <div
                  key={layout.name}
                  className="flex items-center justify-between rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/90"
                >
                  <div className="flex flex-1 flex-col">
                    {isEditing ? (
                      <input
                        value={editing?.next ?? ""}
                        onChange={(event) =>
                          setEditing((prev) =>
                            prev ? { ...prev, next: event.target.value } : prev
                          )
                        }
                        className="rounded-md border border-white/15 bg-white/5 px-2 py-1 text-sm text-white focus:border-cyan-400 focus:outline-none"
                        autoFocus
                      />
                    ) : (
                      <span className="font-medium text-white">{layout.name}</span>
                    )}
                    <span className="text-[11px] text-white/60">
                      {layout.count} item{layout.count === 1 ? "" : "s"} • Updated {new Date(layout.updatedAt).toLocaleString()}
                    </span>
                  </div>
                  <div className="ml-3 flex items-center gap-2 text-white/70">
                    {isEditing ? (
                      <>
                        <button
                          type="button"
                          onClick={handleRename}
                          className="rounded-md bg-cyan-500 px-2 py-1 text-xs font-medium text-white"
                          disabled={loading}
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditing(null)}
                          className="rounded-md border border-white/20 px-2 py-1 text-xs text-white"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() =>
                            setEditing({ original: layout.name, next: layout.name })
                          }
                          className="rounded-md border border-white/15 p-1 hover:bg-white/10"
                          aria-label={`Rename ${layout.name}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(layout.name)}
                          className="rounded-md border border-white/15 p-1 text-red-300 hover:bg-red-500/20 hover:text-red-200"
                          aria-label={`Delete ${layout.name}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleExport(layout.name)}
                          className="rounded-md border border-white/15 p-1 hover:bg-white/10"
                          aria-label={`Export ${layout.name}`}
                        >
                          <Download className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white transition-colors hover:bg-white/10"
          >
            Close
          </button>
        </div>
      </div>
    </LayoutModalShell>
  );
}

