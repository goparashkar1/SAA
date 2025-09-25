import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useAnimation } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Edit3,
  Pause,
  Play,
  Snowflake,
  X,
} from "lucide-react";

type SecretHubProps = {
  open: boolean;
  onClose: () => void;
  anchorRef?: React.RefObject<HTMLElement> | null;
  id?: string;
};

type PulseMap = {
  time: number;
  world: number;
  geo: number;
  weather: number;
  entity: number;
};

const focusableSelector = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

const containerMotion = {
  initial: { opacity: 0, y: -16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -16 },
  transition: { duration: 0.25, ease: "easeOut" },
};

const sectionTitlePulse = {
  scale: [1, 1.04, 1],
  transition: { duration: 0.32, ease: "easeOut" },
};

const DROP_GAP = 12;

const sampleTimestamp = new Date(Date.UTC(2025, 8, 25, 15, 6, 2));

const formatClock = (date: Date) =>
  new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
    timeZone: "UTC",
  }).format(date);

const formatDisplayDate = (date: Date) =>
  new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);

function SectionCard({
  title,
  pulseKey,
  children,
}: {
  title: string;
  pulseKey: number;
  children: React.ReactNode;
}) {
  const controls = useAnimation();

  useEffect(() => {
    controls.start(sectionTitlePulse);
  }, [controls, pulseKey]);

  return (
    <div className="rounded-lg border border-cyan-400/20 bg-slate-900/40 px-4 pb-4 pt-3 shadow-inner shadow-cyan-500/5">
      <motion.div
        role="heading"
        aria-level={3}
        className="flex items-center justify-between text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-cyan-200/80"
        animate={controls}
        initial={false}
      >
        <span>{title}</span>
      </motion.div>
      <div className="mt-3 border-t border-cyan-400/15 pt-3 text-sm text-slate-100/90">
        {children}
      </div>
    </div>
  );
}

export default function SecretHub({ open, onClose, anchorRef, id }: SecretHubProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const firstInteractiveRef = useRef<HTMLButtonElement | null>(null);
  const wasOpenRef = useRef(false);
  const [panelPosition, setPanelPosition] = useState<{ left: number; top: number } | null>(null);

  // Time controls
  const [timelineValue, setTimelineValue] = useState(12);
  const [paused, setPaused] = useState(true);
  const [speed, setSpeed] = useState<"1x" | "2x" | "4x">("1x");
  const [utcLocked, setUtcLocked] = useState(false);

  // Geo watchlist
  const [watchlist, setWatchlist] = useState([
    { label: "Black Sea", active: true },
    { label: "Taiwan Strait", active: false },
    { label: "Persian Gulf", active: true },
  ]);

  // Weather overlays
  const [overlays, setOverlays] = useState({
    Radar: true,
    IR: false,
    Clouds: true,
  });

  // Presence toggle
  const [presenceVisible, setPresenceVisible] = useState(true);

  const [pulses, setPulses] = useState<PulseMap>({
    time: 0,
    world: 0,
    geo: 0,
    weather: 0,
    entity: 0,
  });

  useEffect(() => {
    if (open && firstInteractiveRef.current) {
      firstInteractiveRef.current.focus();
    }
  }, [open]);

  useEffect(() => {
    if (open) {
      wasOpenRef.current = true;
    }
  }, [open]);

  useEffect(() => {
    if (!open && wasOpenRef.current) {
      wasOpenRef.current = false;
      const target = anchorRef?.current;
      if (target) {
        target.focus();
      }
    }
  }, [anchorRef, open]);

  const updatePanelPosition = useCallback(() => {
    const anchor = anchorRef?.current;
    const panel = panelRef.current;
    if (!anchor || !panel) {
      return;
    }

    const parent = panel.offsetParent as HTMLElement | null;
    if (!parent) {
      return;
    }

    const anchorRect = anchor.getBoundingClientRect();
    const parentRect = parent.getBoundingClientRect();

    setPanelPosition({
      left: anchorRect.left + anchorRect.width / 2 - parentRect.left,
      top: anchorRect.bottom - parentRect.top + DROP_GAP,
    });
  }, [anchorRef]);

  useLayoutEffect(() => {
    if (!open) {
      setPanelPosition(null);
      return;
    }
    updatePanelPosition();
  }, [open, updatePanelPosition]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleReposition = () => updatePanelPosition();

    window.addEventListener("resize", handleReposition);
    window.addEventListener("scroll", handleReposition, true);

    return () => {
      window.removeEventListener("resize", handleReposition);
      window.removeEventListener("scroll", handleReposition, true);
    };
  }, [open, updatePanelPosition]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab" || !panelRef.current) {
        return;
      }

      const focusables = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(focusableSelector)
      ).filter((el) => !el.hasAttribute("data-focus-guard"));

      if (focusables.length === 0) {
        return;
      }

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      } else if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      }
    };

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (!target || !panelRef.current) return;
      if (panelRef.current.contains(target)) return;
      if (anchorRef?.current && anchorRef.current.contains(target as Node)) return;
      onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handlePointerDown, true);
    document.addEventListener("touchstart", handlePointerDown, true);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handlePointerDown, true);
      document.removeEventListener("touchstart", handlePointerDown, true);
    };
  }, [anchorRef, onClose, open]);

  const panelStyle: React.CSSProperties = panelPosition
    ? {
        left: panelPosition.left,
        top: panelPosition.top,
        transform: "translateX(-50%)",
      }
    : {
        left: "50%",
        top: `calc(100% + ${DROP_GAP}px)`,
        transform: "translateX(-50%)",
      };

  const triggerPulse = (section: keyof PulseMap) => {
    setPulses((prev) => ({ ...prev, [section]: prev[section] + 1 }));
  };

  const updateWatchlist = (label: string) => {
    setWatchlist((prev) =>
      prev.map((item) =>
        item.label === label ? { ...item, active: !item.active } : item
      )
    );
    triggerPulse("geo");
  };

  const toggleOverlay = (key: keyof typeof overlays) => {
    setOverlays((prev) => ({ ...prev, [key]: !prev[key] }));
    triggerPulse("weather");
  };

  const handleTimelineStep = (direction: -1 | 1) => {
    setTimelineValue((prev) => {
      const next = Math.min(24, Math.max(0, prev + direction));
      return next;
    });
    triggerPulse("time");
  };

  const worldClockRows = [
    { label: "UTC", time: "12:06", day: true },
    { label: "Washington", time: "08:06", day: true },
    { label: "Tehran", time: "16:36", day: false },
    { label: "Tel Aviv", time: "15:06", day: true },
  ];

  const sparkline = [10, 20, 35, 50, 35, 15];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          {...containerMotion}
          id={id}
          ref={panelRef}
          className="absolute z-30 w-[min(30rem,33vw)] min-w-[20rem]"
          style={panelStyle}
        >
          <div className="flex max-h-[50vh] flex-col overflow-hidden rounded-xl border border-cyan-400/25 bg-slate-900/90 backdrop-blur-md shadow-lg shadow-cyan-500/10">
            {/* Hub header */}
            <div className="flex items-start justify-between gap-4 border-b border-cyan-400/20 bg-slate-900/95 px-5 py-4">
              <div>
                <div className="text-[0.65rem] uppercase tracking-[0.24em] text-cyan-200/70">Secret</div>
                <div className="text-xl font-semibold text-cyan-50">Secret Control Hub</div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="group rounded-md border border-cyan-400/30 bg-slate-800/50 p-2 text-cyan-200/80 transition hover:border-cyan-300/60 hover:text-cyan-100 focus:outline-none"
                aria-label="Close secret control hub"
              >
                <ChevronUp className="h-4 w-4 transition-all group-hover:hidden" />
                <X className="hidden h-4 w-4 transition-all group-hover:block" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-1 secret-hub-scroll">
              <div className="grid grid-cols-1 gap-4 p-4 lg:grid-cols-2">
                {/* Time control section */}
                <SectionCard title="Time" pulseKey={pulses.time}>
                  <div className="flex flex-col gap-3">
                    <div className="text-center">
                      <div className="text-2xl font-mono tracking-widest text-cyan-100">{formatClock(sampleTimestamp)}</div>
                      <div className="text-xs uppercase tracking-[0.32em] text-cyan-300/60">{formatDisplayDate(sampleTimestamp)}</div>
                    </div>

                    <label className="flex flex-col gap-2 text-xs uppercase tracking-[0.24em] text-cyan-300/70">
                      <span>Passed At</span>
                      <input
                        type="range"
                        min={0}
                        max={24}
                        step={1}
                        value={timelineValue}
                        onChange={(event) => {
                          setTimelineValue(Number(event.target.value));
                          triggerPulse("time");
                        }}
                        className="h-1 w-full cursor-pointer appearance-none rounded-full bg-cyan-200/20 accent-cyan-400"
                      />
                    </label>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        ref={firstInteractiveRef}
                        type="button"
                        onClick={() => {
                          setPaused((prev) => !prev);
                          triggerPulse("time");
                        }}
                        aria-pressed={paused}
                        className={`rounded-md border px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] transition focus:outline-none ${
                          paused
                            ? "border-cyan-400/40 bg-cyan-600/30 text-cyan-100 shadow-[0_0_12px_rgba(34,211,238,0.25)]"
                            : "border-cyan-400/20 bg-slate-800/60 text-cyan-200/80 hover:border-cyan-400/40"
                        }`}
                      >
                        Pause
                      </button>
                      <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
                        <button
                          type="button"
                          onClick={() => handleTimelineStep(-1)}
                          className="flex items-center gap-1 rounded-md border border-cyan-400/20 bg-slate-800/60 px-2 py-1 text-cyan-100/80 transition hover:border-cyan-300/40 hover:text-cyan-50 focus:outline-none"
                          aria-label="Step backward"
                        >
                          <ChevronLeft className="h-4 w-4" />
                          Step
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setPaused((prev) => !prev);
                            triggerPulse("time");
                          }}
                          className="flex items-center gap-1 rounded-md border border-cyan-400/20 bg-slate-800/60 px-3 py-1 text-cyan-100/80 transition hover:border-cyan-300/40 hover:text-cyan-50 focus:outline-none"
                          aria-label={paused ? "Resume timeline" : "Pause timeline"}
                        >
                          {paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                          {paused ? "Play" : "Pause"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleTimelineStep(1)}
                          className="flex items-center gap-1 rounded-md border border-cyan-400/20 bg-slate-800/60 px-2 py-1 text-cyan-100/80 transition hover:border-cyan-300/40 hover:text-cyan-50 focus:outline-none"
                          aria-label="Step forward"
                        >
                          Step
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                      <div className="flex flex-wrap items-center gap-2">
                        {["1x", "2x", "4x"].map((value) => (
                          <button
                            key={value}
                            type="button"
                            onClick={() => {
                              setSpeed(value as "1x" | "2x" | "4x");
                              triggerPulse("time");
                            }}
                            aria-pressed={speed === value}
                            className={`rounded-md border px-2 py-1 font-semibold transition focus:outline-none ${
                              speed === value
                                ? "border-cyan-400/50 bg-cyan-500/30 text-cyan-100"
                                : "border-cyan-400/15 bg-slate-800/60 text-cyan-200/70 hover:border-cyan-300/40"
                            }`}
                          >
                            {value}
                          </button>
                        ))}
                      </div>
                      <label className="flex min-w-0 items-center gap-2">
                        <input
                          type="checkbox"
                          checked={utcLocked}
                          onChange={() => {
                            setUtcLocked((prev) => !prev);
                            triggerPulse("time");
                          }}
                          className="h-4 w-4 rounded border border-cyan-400/30 bg-slate-900/70 text-cyan-400 focus:outline-none"
                        />
                        <span className="text-cyan-200/70">Lock to UTC slice</span>
                      </label>
                    </div>

                    {utcLocked && (
                      <div className="mt-1 inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3 py-1 text-[0.65rem] uppercase tracking-[0.28em] text-cyan-200/90">
                        AS OF 12:06 UTC
                      </div>
                    )}
                  </div>
                </SectionCard>

                {/* World clocks */}
                <SectionCard title="World Clocks" pulseKey={pulses.world}>
                  <div className="flex items-center justify-between text-xs text-cyan-200/80">
                    <span className="tracking-[0.32em] uppercase">Locator</span>
                    <button
                      type="button"
                      className="rounded-md border border-cyan-400/20 bg-slate-800/60 p-1 text-cyan-200/80 transition hover:border-cyan-300/40 hover:text-cyan-50 focus:outline-none"
                      aria-label="Edit world clocks"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <ul className="mt-3 space-y-2 text-sm text-slate-100/90">
                    {worldClockRows.map((row) => (
                      <li key={row.label} className="flex items-center justify-between gap-2 rounded-md border border-cyan-400/10 bg-slate-900/60 px-3 py-2">
                        <div className="flex min-w-0 items-center gap-2">
                          <span
                            className={`h-2.5 w-2.5 rounded-full shadow-[0_0_8px_rgba(34,211,238,0.4)] ${
                              row.day ? "bg-cyan-300" : "bg-slate-500"
                            }`}
                            aria-hidden="true"
                          />
                          <span className="uppercase tracking-[0.24em] text-xs text-cyan-200/80">{row.label}</span>
                        </div>
                        <span className="font-mono text-base text-cyan-100/90">{row.time}</span>
                      </li>
                    ))}
                  </ul>
                </SectionCard>

                {/* Geo watchlist */}
                <SectionCard title="Geo Watchlist" pulseKey={pulses.geo}>
                  <div className="flex flex-wrap gap-2">
                    {watchlist.map((item) => (
                      <button
                        key={item.label}
                        type="button"
                        onClick={() => updateWatchlist(item.label)}
                        aria-pressed={item.active}
                        className={`rounded-full border px-3 py-1 text-xs uppercase tracking-[0.24em] transition focus:outline-none ${
                          item.active
                            ? "border-cyan-400/50 bg-cyan-600/20 text-cyan-100"
                            : "border-cyan-400/20 bg-slate-800/60 text-cyan-200/80 hover:border-cyan-300/40"
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                  <div className="mt-4 flex items-center justify-between text-xs text-cyan-200/70">
                    <span className="uppercase tracking-[0.24em]">Vantage: Global</span>
                    <select
                      disabled
                      className="w-[7.5rem] rounded-md border border-cyan-400/15 bg-slate-800/60 px-3 py-1 text-center text-cyan-200/40 focus:outline-none"
                      aria-label="Vantage scope"
                    >
                      <option>Global</option>
                    </select>
                  </div>
                </SectionCard>

                {/* Weather */}
                <SectionCard title="Weather" pulseKey={pulses.weather}>
                  <div className="space-y-4 text-sm">
                    <div className="text-base text-cyan-100/90">
                      Current: 21°C, Wind 8 kt, 1014 hPa, Cloud 40%
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {Object.keys(overlays).map((key) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => toggleOverlay(key as keyof typeof overlays)}
                          aria-pressed={overlays[key as keyof typeof overlays]}
                          className={`rounded-md border px-3 py-1 text-xs uppercase tracking-[0.24em] transition focus:outline-none ${
                            overlays[key as keyof typeof overlays]
                              ? "border-cyan-400/50 bg-cyan-500/25 text-cyan-100"
                              : "border-cyan-400/15 bg-slate-800/60 text-cyan-200/70 hover:border-cyan-300/40"
                          }`}
                        >
                          {key}
                        </button>
                      ))}
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-[0.24em] text-cyan-300/70">
                        Next 6 hrs precip prob %
                      </div>
                      <div className="mt-2 flex h-16 items-end gap-1">
                        {sparkline.map((value, index) => (
                          <div
                            key={index}
                            className="flex-1 rounded-full bg-gradient-to-t from-cyan-400/20 via-cyan-400/40 to-cyan-300/80 shadow-[0_0_12px_rgba(34,211,238,0.25)]"
                            style={{ height: `${Math.max(8, value)}%` }}
                            aria-hidden="true"
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </SectionCard>

                {/* Entity & pulse */}
                <SectionCard title="Entity & Pulse" pulseKey={pulses.entity}>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between rounded-lg border border-cyan-400/15 bg-slate-900/60 px-3 py-2 text-sm">
                      <div>
                        <div className="text-sm font-semibold text-cyan-100">Analyst B</div>
                        <div className="text-xs uppercase tracking-[0.24em] text-cyan-300/60">ID #92AF-33</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setPresenceVisible((prev) => !prev);
                          triggerPulse("entity");
                        }}
                        aria-pressed={presenceVisible}
                        className={`inline-flex items-center gap-2 rounded-md border px-3 py-1 text-xs uppercase tracking-[0.24em] transition focus:outline-none ${
                          presenceVisible
                            ? "border-cyan-400/40 bg-cyan-600/20 text-cyan-100"
                            : "border-cyan-400/20 bg-slate-800/60 text-cyan-200/70 hover:border-cyan-300/40"
                        }`}
                      >
                        {presenceVisible ? (
                          "Visible"
                        ) : (
                          <span className="inline-flex items-center gap-1.5">`r`n                            <Snowflake className="h-3.5 w-3.5" />
                            Invisible
                          </span>
                        )}
                      </button>
                    </div>
                    <div className={`text-xs uppercase tracking-[0.24em] ${
                      presenceVisible ? "text-cyan-300/70" : "text-slate-400/50"
                    }`}>
                      Auto-refresh {presenceVisible ? "active" : "paused"}
                    </div>
                    <div className="space-y-3 text-xs">
                      {[{ label: "Cyber", value: 75 }, { label: "Geo", value: 55 }, { label: "Social", value: 35 }].map((meter) => (
                        <div key={meter.label}>
                          <div className="mb-1 flex items-center justify-between">
                            <span className="uppercase tracking-[0.24em] text-cyan-200/80">{meter.label}</span>
                            <span className="font-mono text-sm text-cyan-100/80">{meter.value}%</span>
                          </div>
                          <div className="h-1.5 rounded-full border border-cyan-400/20 bg-slate-800/70">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-cyan-500/30 to-cyan-400"
                              style={{ width: `${meter.value}%` }}
                              aria-hidden="true"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </SectionCard>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}








