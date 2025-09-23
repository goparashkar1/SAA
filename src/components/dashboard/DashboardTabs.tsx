import React from "react";
import { Plus, Copy } from "lucide-react";
import { useDash } from "../../store/dashboard";

export default function DashboardTabs() {
  const dashboards = useDash((state) => state.workspace.dashboards);
  const activeId = useDash((state) => state.workspace.activeDashboardId);
  const setActive = useDash((state) => state.setActiveDashboard);
  const addDashboard = useDash((state) => state.addDashboard);
  const duplicateDashboard = useDash((state) => state.duplicateDashboard);

  const handleNew = () => {
    addDashboard("New Dashboard");
  };

  const handleDuplicate = () => {
    if (!activeId) return;
    duplicateDashboard(activeId);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {dashboards.map((dashboard) => (
        <button
          key={dashboard.id}
          type="button"
          onClick={() => setActive(dashboard.id)}
          className={
            "rounded-md px-3 py-1.5 text-sm transition-colors " +
            (dashboard.id === activeId
              ? "bg-white/20 text-white shadow"
              : "bg-white/5 text-white/80 hover:bg-white/10")
          }
        >
          {dashboard.name}
        </button>
      ))}
      <button
        type="button"
        onClick={handleNew}
        className="inline-flex items-center gap-1 rounded-md bg-cyan-500/20 px-2 py-1 text-sm text-white transition-colors hover:bg-cyan-500/30"
      >
        <Plus className="h-4 w-4" /> New
      </button>
      {dashboards.length > 0 && (
        <button
          type="button"
          onClick={handleDuplicate}
          className="inline-flex items-center gap-1 rounded-md bg-white/5 px-2 py-1 text-sm text-white/80 transition-colors hover:bg-white/10"
        >
          <Copy className="h-4 w-4" /> Duplicate
        </button>
      )}
    </div>
  );
}

