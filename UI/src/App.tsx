import React, { useState } from "react";
import { PanelKey } from "./types";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import CopilotPanel from "./components/copilot/CopilotPanel";
import TranslationReportPage from "./pages/TranslationReportPage";
import Dashboard from "./components/dashboard/Dashboard";
import { CopilotProvider, useCopilotHotkeys } from "./components/copilot/hooks/useCopilot";
import CommandPalette from "./components/copilot/CommandPalette";
import { ThemeProvider } from "./lib/theme/ThemeContext";

// Only background in the app (fixed, overscanned, tinted)
import MicrosintDynamicBackground from "./components/ui/dynamic_background.jsx";

function AppContent() {
  const [active, setActive] = useState<PanelKey>("Dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  useCopilotHotkeys();

  // CSS variable for sidebar width
  const sidebarWidth = sidebarCollapsed ? 64 : 320;

  return (
    // Full viewport shell with smooth theme transitions
    <div 
      className="relative w-full h-dvh min-h-screen overflow-hidden transition-all duration-500 ease-in-out" 
      dir="ltr"
      style={{ '--sidebar-width': `${sidebarWidth}px` } as React.CSSProperties}
    >
      {/* Background */}
      <MicrosintDynamicBackground />

      {/* Full-height sidebar */}
      <Sidebar
        active={active}
        onChange={setActive}
        collapsed={sidebarCollapsed}
        onToggleSidebar={() => setSidebarCollapsed((v) => !v)}
      />

      {/* Main content area with sidebar offset and smooth theme transitions */}
      <div 
        className="relative z-10 flex flex-col h-full transition-[margin-left] duration-200 transition-all duration-500 ease-in-out"
        style={{ marginLeft: 'var(--sidebar-width)' }}
      >
        {/* Header */}
        <Header 
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={() => setSidebarCollapsed((v) => !v)}
        />

        {/* Content row */}
        <div className="flex-1 min-h-0 flex overflow-hidden">
          {/* Copilot panel column */}
          <div className="flex-none h-full">
            <CopilotPanel sidebarCollapsed={sidebarCollapsed} />
          </div>
          
          {/* Main column — grows and scrolls within the row */}
          <main className="main-scroll flex-1 min-h-0 overflow-auto p-6 text-white/90 transition-[padding] duration-300">
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
    <ThemeProvider>
      <CopilotProvider>
        <AppContent />
        <CommandPalette />
      </CopilotProvider>
    </ThemeProvider>
  );
}





