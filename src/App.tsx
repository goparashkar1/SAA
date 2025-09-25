import React, { useState } from "react";
import { PanelKey } from "./types";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import bgImage from "./assets/Pattern.png";
import TranslationReportPage from "./pages/TranslationReportPage";
import Dashboard from "./components/dashboard/dashboard";
import { CopilotProvider, useCopilotHotkeys } from "./components/copilot/hooks/useCopilot";
import CopilotPanel from "./components/copilot/CopilotPanel";
import CommandPalette from "./components/copilot/CommandPalette";

function AppContent() {
  const [active, setActive] = useState<PanelKey>("Dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  useCopilotHotkeys();

  return (
    <div className="h-dvh w-full bg-gradient-to-b from-[#354F60] to-[#253F50]" dir="ltr">
      <div
        className="flex h-dvh w-full flex-col bg-slateDeep-900/85 bg-cover bg-center"
        style={{
          backgroundImage: `linear-gradient(rgba(11, 44, 78, 0.4), rgba(0, 0, 0, 0.9)), url(${bgImage})`,
        }}
      >
        <Header
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={() => setSidebarCollapsed((v) => !v)}
        />
        <div className="relative flex min-h-0 w-full flex-1">
          <Sidebar
            active={active}
            onChange={setActive}
            collapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed((v) => !v)}
          />
          <CopilotPanel sidebarCollapsed={sidebarCollapsed} />
          <main className="sidebar-scroll flex-1 overflow-auto p-6 text-white/90 transition-[padding] duration-300">
            {active === "Dashboard" && <Dashboard />}
            {active === "Data Collection" && (
              <section>
                <h1 className="mb-2 text-2xl font-semibold">Collection Agents</h1>
                <p className="text-sm opacity-80">Collection Agents content appears here. Placeholder.</p>
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






