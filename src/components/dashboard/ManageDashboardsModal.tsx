import React from "react";
import { Pencil, Trash2, Star, Copy } from "lucide-react";
import { useDash } from "../../store/dashboard";

type ManageDashboardsModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

const ModalShell: React.FC<{
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}> = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
    <div className="w-full max-w-2xl rounded-lg border border-white/10 bg-slate-900/95 p-5 text-white shadow-xl">
      <div className="mb-4 flex items-start justify-between">
        <h2 className="text-lg font-semibold">{title}</h2>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md bg-white/10 p-1 text-white transition-colors hover:bg-white/20"
          aria-label="Close dialog"
        >
          ×
        </button>
      </div>
      {children}
    </div>
  </div>
);

export default function ManageDashboardsModal({
  isOpen,
  onClose,
}: ManageDashboardsModalProps) {
  const dashboards = useDash((state) => state.workspace.dashboards);
  const activeId = useDash((state) => state.workspace.activeDashboardId);

  const setActive = useDash((state) => state.setActiveDashboard);
  const renameDashboard = useDash((state) => state.renameDashboard);
  const deleteDashboard = useDash((state) => state.deleteDashboard);
  const duplicateDashboard = useDash((state) => state.duplicateDashboard);

  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editName, setEditName] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!isOpen) {
      setEditingId(null);
      setEditName("");
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const startEditing = (id: string, currentName: string) => {
    setEditingId(id);
    setEditName(currentName);
    setError(null);
  };

  const handleRename = (id: string) => {
    const trimmed = editName.trim();
    if (!trimmed) {
      setError("Name cannot be empty.");
      return;
    }
    renameDashboard(id, trimmed);
    setEditingId(null);
    setEditName("");
    setError(null);
  };

  const handleDuplicate = (id: string) => {
    duplicateDashboard(id);
  };

  const handleDelete = (id: string) => {
    if (dashboards.length <= 1) {
      window.alert("At least one dashboard must remain.");
      return;
    }
    const confirmed = window.confirm("Delete this dashboard?");
    if (!confirmed) return;
    deleteDashboard(id);
  };

  return (
    <ModalShell title="Manage dashboards" onClose={onClose}>
      <div className="space-y-4">
        {error && <p className="text-xs text-red-400">{error}</p>}
        <div className="flex max-h-72 flex-col gap-2 overflow-y-auto pr-1">
          {dashboards.map((dashboard) => {
            const isEditing = editingId === dashboard.id;
            const isActive = dashboard.id === activeId;
            return (
              <div
                key={dashboard.id}
                className="flex items-center justify-between rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
              >
                <div className="flex flex-1 flex-col">
                  {isEditing ? (
                    <input
                      value={editName}
                      onChange={(event) => setEditName(event.target.value)}
                      className="rounded-md border border-white/20 bg-white/10 px-2 py-1 text-sm text-white focus:border-cyan-400 focus:outline-none"
                      autoFocus
                    />
                  ) : (
                    <span className="font-medium text-white">
                      {dashboard.name}
                    </span>
                  )}
                  <span className="text-[11px] text-white/60">
                    Updated {new Date(dashboard.updatedAt).toLocaleString()}
                  </span>
                </div>
                <div className="ml-3 flex items-center gap-2 text-white/70">
                  {isEditing ? (
                    <>
                      <button
                        type="button"
                        onClick={() => handleRename(dashboard.id)}
                        className="rounded-md bg-cyan-500 px-2 py-1 text-xs font-semibold text-white"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(null);
                          setEditName("");
                        }}
                        className="rounded-md border border-white/20 px-2 py-1 text-xs text-white"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => setActive(dashboard.id)}
                        className={
                          "rounded-md border border-white/20 p-1 " +
                          (isActive
                            ? "bg-cyan-500/30 text-white"
                            : "hover:bg-white/10")
                        }
                        aria-label="Set active"
                      >
                        <Star className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => startEditing(dashboard.id, dashboard.name)}
                        className="rounded-md border border-white/20 p-1 hover:bg-white/10"
                        aria-label="Rename dashboard"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDuplicate(dashboard.id)}
                        className="rounded-md border border-white/20 p-1 hover:bg-white/10"
                        aria-label="Duplicate dashboard"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(dashboard.id)}
                        className="rounded-md border border-white/20 p-1 text-red-300 hover:bg-red-500/20"
                        aria-label="Delete dashboard"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
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
    </ModalShell>
  );
}
