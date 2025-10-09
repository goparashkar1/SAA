import React from "react";
import { Upload } from "lucide-react";
import { useDash } from "../../store/dashboard";

type ImportWorkspaceModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

const ModalShell: React.FC<{
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}> = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
    <div className="w-full max-w-md rounded-lg border border-white/10 bg-slate-900/95 p-5 text-white shadow-xl">
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

export default function ImportWorkspaceModal({
  isOpen,
  onClose,
}: ImportWorkspaceModalProps) {
  const importWorkspace = useDash((state) => state.importWorkspace);
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!isOpen) {
      setSelectedFile(null);
      setError(null);
      setLoading(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleImport = async () => {
    if (!selectedFile) {
      setError("Select a workspace JSON file to import.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await importWorkspace(selectedFile, true);
      onClose();
      window.alert("Workspace imported successfully.");
    } catch (err) {
      console.warn(err);
      const message = err instanceof Error ? err.message : "";
      setError(
        message === "UNSUPPORTED_VERSION"
          ? "Workspace version not supported."
          : "Failed to import workspace."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalShell title="Import workspace" onClose={onClose}>
      <div className="space-y-4">
        <label className="flex flex-col gap-2 text-sm text-white/80">
          Workspace JSON
          <input
            type="file"
            accept="application/json"
            onChange={(event) => {
              const file = event.target.files?.[0] ?? null;
              setSelectedFile(file);
              setError(null);
            }}
            className="rounded-md border border-dashed border-white/20 bg-white/5 px-3 py-6 text-white/80"
          />
        </label>
        {selectedFile && (
          <p className="text-xs text-white/60">{selectedFile.name}</p>
        )}
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
            onClick={handleImport}
            disabled={!selectedFile || loading}
            className="inline-flex items-center gap-2 rounded-md bg-cyan-500 px-3 py-2 text-sm font-medium text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Upload className="h-4 w-4" /> {loading ? "Importing…" : "Import"}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

