import React from "react";
import { X } from "lucide-react";

type LayoutModalShellProps = {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
};

export default function LayoutModalShell({
  title,
  onClose,
  children,
}: LayoutModalShellProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-lg rounded-lg border border-white/10 bg-slate-900/95 p-4 text-white shadow-xl">
        <div className="mb-3 flex items-start justify-between">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md bg-white/10 p-1 text-white transition-colors hover:bg-white/20"
            aria-label="Close dialog"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

