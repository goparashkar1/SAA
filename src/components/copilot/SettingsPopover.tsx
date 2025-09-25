import React from "react";
import { Settings, ChevronDown } from "lucide-react";

const MODELS = [
  { label: "GPT-4o mini", value: "gpt-4o-mini" },
  { label: "GPT-4.1", value: "gpt-4.1" },
  { label: "GPT-4o", value: "gpt-4o" },
];

export type SettingsPopoverProps = {
  model: string;
  onModelChange: (value: string) => void;
  temperature: number;
  onTemperatureChange: (value: number) => void;
  includeContext: boolean;
  onIncludeContextChange: (value: boolean) => void;
};

export default function SettingsPopover({
  model,
  onModelChange,
  temperature,
  onTemperatureChange,
  includeContext,
  onIncludeContextChange,
}: SettingsPopoverProps) {
  const [open, setOpen] = React.useState(false);
  const popoverRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (!open) return;
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div className="relative" ref={popoverRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex items-center gap-1 rounded border border-white/10 bg-white/5 px-2 py-1 text-xs text-white/70 transition-all duration-150 hover:bg-white/10"
      >
        <Settings className="h-3.5 w-3.5" />
        Settings
        <ChevronDown className="h-3 w-3" />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-30 mt-2 w-60 rounded border border-cyan-900/30 bg-[#0B1520] p-3 text-sm text-white/80 shadow-xl">
          <div className="mb-3 space-y-1">
            <div className="text-xs uppercase tracking-wide text-white/40">Model</div>
            <select
              value={model}
              onChange={(event) => onModelChange(event.target.value)}
              className="w-full rounded border border-cyan-900/40 bg-[#0E1A25] px-2 py-1 text-sm text-white/90 focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-cyan-200/60"
            >
              {MODELS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-3 space-y-2">
            <div className="flex items-center justify-between text-xs uppercase tracking-wide text-white/40">
              <span>Temperature</span>
              <span className="text-white/60">{temperature.toFixed(1)}</span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.1}
              value={temperature}
              onChange={(event) => onTemperatureChange(Number(event.target.value))}
              className="w-full"
            />
          </div>

          <label className="mb-3 flex items-center gap-2 text-xs text-white/70">
            <input
              type="checkbox"
              checked={includeContext}
              onChange={(event) => onIncludeContextChange(event.target.checked)}
              className="h-4 w-4 rounded border border-white/20 bg-[#0E1A25] text-cyan-400 focus:ring-cyan-400"
            />
            Use current dashboard context
          </label>

          <p className="text-[11px] leading-relaxed text-white/50">
            Conversations are retained locally. Enterprise retention policies apply when synced with workspace storage.
          </p>
        </div>
      )}
    </div>
  );
}
