import React from "react";
import { Plus, Pin, Trash2 } from "lucide-react";
import type { Thread } from "./types";

export type ThreadListProps = {
  threads: Thread[];
  activeId?: string | null;
  onSelect: (id: string) => void;
  onNewThread: () => void;
  onDelete: (id: string) => void;
  onTogglePin: (id: string, pinned: boolean) => void;
  side?: "left" | "right";
};

function formatThreadTime(updatedAt: string) {
  const date = new Date(updatedAt);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const oneDay = 24 * 60 * 60 * 1000;
  if (diff < oneDay) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  return date.toLocaleDateString();
}

export default function ThreadList({ threads, activeId, onSelect, onNewThread, onDelete, onTogglePin, side = "left" }: ThreadListProps) {
  const ordered = React.useMemo(() => {
    return [...threads].sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }, [threads]);

  const borderClass = side === "right" ? "border-l border-cyan-900/30" : "border-r border-cyan-900/30";
  const orderClass = side === "right" ? "order-2" : "order-1";

  return (
    <aside className={`flex h-full w-60 flex-col bg-[#0E1A25] ${borderClass} ${orderClass} transition-all duration-300`}>
      <div className="flex items-center justify-between px-4 py-3">
        <h2 className="text-sm font-semibold tracking-wide text-white/80">Threads</h2>
        <button
          type="button"
          onClick={onNewThread}
          className="inline-flex h-7 w-7 items-center justify-center rounded border border-white/10 bg-white/5 text-white/80 transition-all duration-150 hover:bg-white/10"
          aria-label="New chat"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
      <div className="flex-1 space-y-1 overflow-y-auto px-2 pb-2">
        {ordered.map((thread) => {
          const isActive = thread.id === activeId;
          return (
            <div
              key={thread.id}
              className={`group relative flex items-center gap-2 rounded border border-transparent px-2 py-2 transition-all duration-150 ${
                isActive ? "bg-cyan-500/15 border-cyan-500/30" : "hover:bg-white/5"
              }`}
            >
              <button
                type="button"
                onClick={() => onSelect(thread.id)}
                className="flex-1 text-left"
              >
                <div className="text-sm font-medium text-white/90 line-clamp-1">{thread.title || "Untitled"}</div>
                <div className="text-xs text-white/50">{formatThreadTime(thread.updatedAt)}</div>
              </button>
              <div className="flex items-center gap-1 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
                <button
                  type="button"
                  onClick={() => onTogglePin(thread.id, !thread.pinned)}
                  className={`inline-flex h-7 w-7 items-center justify-center rounded border border-white/10 text-white/70 transition-all duration-150 hover:bg-white/10 ${
                    thread.pinned ? "bg-white/10" : "bg-transparent"
                  }`}
                  aria-label={thread.pinned ? "Unpin thread" : "Pin thread"}
                >
                  <Pin className={`h-3.5 w-3.5 ${thread.pinned ? "fill-cyan-300 text-cyan-300" : "text-white/60"}`} />
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(thread.id)}
                  className="inline-flex h-7 w-7 items-center justify-center rounded border border-white/10 text-white/70 transition-all duration-150 hover:bg-white/10"
                  aria-label="Delete thread"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          );
        })}
        {!ordered.length && (
          <div className="rounded border border-white/10 bg-white/5 px-3 py-4 text-xs text-white/60">
            No conversations yet. Start a new chat to begin.
          </div>
        )}
      </div>
    </aside>
  );
}





