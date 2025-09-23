import React, { useState } from "react";
import { LayoutGrid, Settings, Upload, Download, ChevronDown } from "lucide-react";
import WidgetPalette from "./WidgetPalette";
import ManageDashboardsModal from "./ManageDashboardsModal";
import ImportWorkspaceModal from "./ImportWorkspaceModal";
import { useDash } from "../../store/dashboard";

export default function DashboardToolbar() {
  const exportWorkspace = useDash((state) => state.exportWorkspace);

  const [menuOpen, setMenuOpen] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  const handleExport = async () => {
    setMenuOpen(false);
    await exportWorkspace();
  };

  return (
    <div className="flex flex-wrap items-center justify-end gap-2 md:gap-3">
      <WidgetPalette />
      <div className="relative">
        <button
          type="button"
          onClick={() => setMenuOpen((prev) => !prev)}
          className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white transition-colors hover:bg-white/10"
        >
          <LayoutGrid className="h-4 w-4" /> Dashboards
          <ChevronDown
            className={"h-4 w-4 transition-transform " + (menuOpen ? "rotate-180" : "rotate-0")}
          />
        </button>
        {menuOpen && (
          <div className="absolute right-0 z-40 mt-2 w-56 rounded-md border border-white/10 bg-slate-900/95 py-2 text-sm shadow-xl">
            <button
              type="button"
              onClick={() => {
                setManageOpen(true);
                setMenuOpen(false);
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-white/90 hover:bg-white/10"
            >
              <Settings className="h-4 w-4" /> Manage dashboards
            </button>
            <button
              type="button"
              onClick={handleExport}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-white/90 hover:bg-white/10"
            >
              <Upload className="h-4 w-4" /> Export workspace
            </button>
            <button
              type="button"
              onClick={() => {
                setImportOpen(true);
                setMenuOpen(false);
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-white/90 hover:bg-white/10"
            >
              <Download className="h-4 w-4" /> Import workspace
            </button>
          </div>
        )}
      </div>
      <ManageDashboardsModal
        isOpen={manageOpen}
        onClose={() => setManageOpen(false)}
      />
      <ImportWorkspaceModal
        isOpen={importOpen}
        onClose={() => setImportOpen(false)}
      />
    </div>
  );
}



