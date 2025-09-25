import React from "react";
import { createPortal } from "react-dom";
import { Search } from "lucide-react";
import { useCopilot } from "./hooks/useCopilot";

export default function CommandPalette() {
  const { isPaletteOpen, closePalette, commandHints, setComposerValue } = useCopilot();
  const [query, setQuery] = React.useState("");

  React.useEffect(() => {
    if (isPaletteOpen) setQuery("");
  }, [isPaletteOpen]);

  React.useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isPaletteOpen) {
        closePalette();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isPaletteOpen, closePalette]);

  if (!isPaletteOpen) return null;

  const filtered = commandHints.filter((hint) => hint.toLowerCase().includes(query.toLowerCase()));

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 pt-32">
      <div className="w-full max-w-xl rounded border border-cyan-900/40 bg-[#0B1520] shadow-2xl">
        <div className="flex items-center gap-2 border-b border-cyan-900/30 px-4 py-3 text-white/80">
          <Search className="h-4 w-4" />
          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Ask Copilot or search commands"
            className="flex-1 bg-transparent text-sm text-white/90 placeholder:text-white/40 focus:outline-none"
          />
          <kbd className="rounded border border-white/10 bg-white/5 px-1.5 text-[10px] uppercase tracking-wide text-white/40">
            Esc
          </kbd>
        </div>
        <div className="max-h-64 overflow-y-auto px-2 py-2">
          {filtered.length === 0 && (
            <div className="rounded border border-white/10 bg-white/5 px-3 py-3 text-sm text-white/60">
              No matching commands.
            </div>
          )}
          {filtered.map((hint) => (
            <button
              key={hint}
              type="button"
              onClick={() => {
                setComposerValue(hint + " ");
                closePalette();
              }}
              className="flex w-full items-center justify-between rounded px-3 py-2 text-left text-sm text-white/80 transition-all duration-150 hover:bg-white/5"
            >
              <span>{hint}</span>
              <span className="text-[10px] uppercase tracking-wide text-white/40">Enter</span>
            </button>
          ))}
        </div>
      </div>
    </div>,
    document.body
  );
}
