import React, { useState } from "react";
import { PanelKey } from "./types";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import TranslationReportPage from "./pages/TranslationReportPage";
import Dashboard from "./components/dashboard/dashboard";
import { CopilotProvider, useCopilotHotkeys } from "./components/copilot/hooks/useCopilot";
import CopilotPanel from "./components/copilot/CopilotPanel";
import CommandPalette from "./components/copilot/CommandPalette";

// Only background in the app (fixed, overscanned, tinted)
import MicrosintDynamicBackground from "./components/ui/dynamic_background.jsx";

function AppContent() {
  const [active, setActive] = useState<PanelKey>("Dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  useCopilotHotkeys();

  return (
    // Full viewport shell
    <div className="relative w-full h-dvh min-h-screen" dir="ltr">
      {/* Background */}
      <MicrosintDynamicBackground />

      {/* Foreground */}
      <div className="relative z-10 grid grid-rows-[auto,1fr] h-full">
        {/* Row 1: header (auto height) */}
        <Header
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={() => setSidebarCollapsed((v) => !v)}
        />

        {/* Row 2: content row fills the rest */}
        <div className="relative grid grid-cols-[auto,auto,1fr] min-h-0 overflow-hidden">
          {/* Sidebar column — stretches to full row height */}
          <div className="flex-none h-full">
            <div className="h-full min-h-0 flex flex-col">
              <Sidebar
                active={active}
                onChange={setActive}
                collapsed={sidebarCollapsed}
                onToggleCollapse={() => setSidebarCollapsed((v) => !v)}
              />
            </div>
          </div>

          {/* Copilot panel column (kept as-is, but ensure it inherits height) */}
          <div className="flex-none h-full">
            <CopilotPanel sidebarCollapsed={sidebarCollapsed} />
          </div>

          {/* Main column — grows and scrolls within the row */}
          <main className="sidebar-scroll flex-1 min-h-0 overflow-auto p-6 text-white/90 transition-[padding] duration-300">
            {active === "Dashboard" && <Dashboard />}

            {active === "Data Collection" && (
              <section>
                <h1 className="mb-2 text-2xl font-semibold">Collection Agents</h1>
                <p className="text-sm opacity-80">
                  Collection Agents content appears here. Placeholder.
                </p>
              </section>
            )}

            {active === "Process & Enrichment" && <TranslationReportPage />}

            {active === "Analysis & Detection" && (
              <section>
                <h1 className="mb-2 text-2xl font-semibold">Analysis Agents</h1>
                <p className="text-sm opacity-80">Analysis Agents page placeholder content.</p>
              </section>
            )}

            {active === "Report & Share" && (
              <section>
                <h1 className="mb-2 text-2xl font-semibold">Report Agents</h1>
                <p className="text-sm opacity-80">Report Agents page placeholder content.</p>
              </section>
            )}

            {active === "System" && (
              <section>
                <h1 className="mb-2 text-2xl font-semibold">System</h1>
                <p className="text-sm opacity-80">System page placeholder content.</p>
              </section>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <CopilotProvider>
      <AppContent />
      <CommandPalette />
    </CopilotProvider>
  );
}
