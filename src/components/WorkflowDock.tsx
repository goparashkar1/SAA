// src/components/WorkflowDock.tsx
import React from "react";
import { GitMerge, Play, PlusCircle, Clock, CheckCircle2, XCircle, PauseCircle } from "lucide-react";

export type RunStatus = "queued" | "running" | "failed" | "completed" | "paused";
export type Trigger = "manual" | "schedule" | "event";

export interface RunItem {
  id: string;
  name: string;
  workflowName: string;
  status: RunStatus;
  progress: number;   // 0..100
  trigger: Trigger;
  startedAt: string;  // ISO
}

interface Props {
  collapsed: boolean;
  runs?: RunItem[];
  /** open the main workflows console */
  onOpenConsole?: () => void;
  /** open a specific run detail */
  onOpenRun?: (id: string) => void;
  /** create & start a new run */
  onNewRun?: () => void;
  /** create a new workflow */
  onNewWorkflow?: () => void;
}

const statusIcon = (s: RunStatus) => {
  switch (s) {
    case "running": return <Clock className="h-3.5 w-3.5" />;
    case "completed": return <CheckCircle2 className="h-3.5 w-3.5" />;
    case "failed": return <XCircle className="h-3.5 w-3.5" />;
    case "paused": return <PauseCircle className="h-3.5 w-3.5" />;
    default: return <Clock className="h-3.5 w-3.5" />;
  }
};

const statusClasses: Record<RunStatus, string> = {
  queued: "bg-white/5 text-white/70",
  running: "bg-blue-500/15 text-blue-300",
  completed: "bg-emerald-500/15 text-emerald-300",
  failed: "bg-rose-500/15 text-rose-300",
  paused: "bg-amber-500/15 text-amber-300",
};

const mock: RunItem[] = [
  { id: "r_1012", name: "Daily Iran Update", workflowName: "Ingest → Translate → Classify", status: "running", progress: 58, trigger: "schedule", startedAt: new Date(Date.now() - 1000 * 60 * 20).toISOString() },
  { id: "r_1011", name: "OSINT 101 Trial", workflowName: "Twitter Collector", status: "completed", progress: 100, trigger: "manual", startedAt: new Date(Date.now() - 1000 * 60 * 110).toISOString() },
  { id: "r_1010", name: "News Digest EU", workflowName: "RSS → Translate → Summarize", status: "failed", progress: 41, trigger: "event", startedAt: new Date(Date.now() - 1000 * 60 * 240).toISOString() },
];

function timeAgo(iso: string) {
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.max(1, Math.round(ms / 60000));
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  return `${h}h ago`;
}

function WorkflowDock({
  collapsed,
  runs = mock,
  onOpenConsole,
  onOpenRun,
  onNewRun,
  onNewWorkflow,
}: Props) {
  const openConsole = onOpenConsole ?? (() => {});
  const openRun = onOpenRun ?? (() => openConsole());

  const runningCount = runs.filter((r) => r.status === "running").length;

  // Collapsed: minimal icon strip
  if (collapsed) {
    return (
      <div className="mx-2 mt-2 mb-2 rounded-xl border border-white/10 bg-white/5 px-2 py-2">
        <div className="flex flex-col items-center gap-3">
          <button
            title="New Run"
            onClick={onNewRun ?? openConsole}
            className="rounded-lg border border-white/10 bg-white/5 p-2 text-white/90 hover:bg-white/10"
          >
            <Play className="h-4 w-4" />
          </button>
          <button
            title="New Workflow"
            onClick={onNewWorkflow ?? openConsole}
            className="rounded-lg border border-white/10 bg-white/5 p-2 text-white/90 hover:bg-white/10"
          >
            <PlusCircle className="h-4 w-4" />
          </button>
          <button
            title="Open Workflows"
            onClick={openConsole}
            className="rounded-lg border border-white/10 bg-white/5 p-2 text-white/90 hover:bg-white/10"
          >
            <GitMerge className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  // Expanded sidebar: full dock panel
  return (
    <div className="mx-3 mt-3 mb-3 rounded-2xl border border-white/10 bg-white/5 shadow-md">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-white/10">
        <div className="flex items-center gap-2">
          {/* Tailwind doesn't have 4.5; use 18px */}
          <GitMerge className="h-[18px] w-[18px] text-white/80" />
          <div className="text-xs font-semibold text-white">Workflows</div>
          {runningCount > 0 && (
            <span className="ml-1 rounded-md bg-blue-500/20 px-1.5 py-0.5 text-[10px] text-blue-200">
              {runningCount} running
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onNewRun ?? openConsole}
            className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-white/90 hover:bg-white/10"
          >
            <Play className="h-3.5 w-3.5" /> Run
          </button>
          <button
            onClick={onNewWorkflow ?? openConsole}
            className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-white/90 hover:bg-white/10"
          >
            <PlusCircle className="h-3.5 w-3.5" /> New
          </button>
        </div>
      </div>

      {/* Body (top 3 runs) */}
      <ul className="max-h-60 overflow-auto">
        {runs.slice(0, 3).map((r) => (
          <li
            key={r.id}
            className="px-3 py-2 hover:bg-white/[0.04] cursor-pointer"
            onClick={() => openRun(r.id)}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] ${statusClasses[r.status]}`}>
                    {statusIcon(r.status)} {r.status}
                  </span>
                  <span className="text-[10px] text-white/50">• {r.trigger}</span>
                  <span className="text-[10px] text-white/40">• {timeAgo(r.startedAt)}</span>
                </div>
                <div className="mt-1 truncate text-xs font-medium text-white/90">{r.name}</div>
                <div className="truncate text-[11px] text-white/60">{r.workflowName}</div>
                <div className="mt-1.5 h-1.5 w-full rounded-full bg-white/10">
                  <div
                    className={`h-1.5 rounded-full ${
                      r.status === "failed"
                        ? "bg-rose-500/80"
                        : r.status === "completed"
                        ? "bg-emerald-500/80"
                        : "bg-blue-500/80"
                    }`}
                    style={{ width: `${r.progress}%` }}
                  />
                </div>
              </div>
              <div className="shrink-0 text-right">
                <div className="text-[11px] tabular-nums text-white/70">{r.progress}%</div>
              </div>
            </div>
          </li>
        ))}
      </ul>

      {/* Footer */}
      <div className="flex items-center justify-end px-3 py-2 border-t border-white/10">
        <button
          onClick={openConsole}
          className="text-[11px] text-white/70 hover:text-white underline underline-offset-4"
        >
          Open console
        </button>
      </div>
    </div>
  );
}

// Export both ways to avoid import mismatches
export { WorkflowDock };
export default WorkflowDock;
