import React, { useState } from "react";
import { PanelKey } from "./types";  // Import type definition for panel keys to ensure type safety
import Header from "./components/Header";  // Header component for top navigation
import Sidebar from "./components/Sidebar";  // Sidebar component for main navigation
import bgImage from "./assets/Pattern.png";  // Background image asset for the application
import TranslationReportPage from "./pages/TranslationReportPage";  // Specific page component for Process & Enrichment
import Dashboard from "./components/dashboard/dashboard";  // Main dashboard component

// Main App component that serves as the root component of the application
export default function App() {
  // State management for the currently active panel/section in the application
  // Defaults to "Dashboard" on initial load
  const [active, setActive] = useState<PanelKey>("Dashboard");
  
  // State management for sidebar collapsed/expanded state
  // Defaults to false (expanded) on initial load
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);

  return (
    // Outer container with gradient background from dark blue to darker blue
    // Uses dvh (dynamic viewport height) for proper mobile browser support
    <div className="h-dvh w-full bg-gradient-to-b from-[#354F60] to-[#253F50]" dir="ltr">
      {/* 
        Inner container with background image and overlay gradient
        This creates a layered effect with the pattern image underneath a dark overlay
      */}
      <div
        className="flex flex-col h-dvh w-full bg-slateDeep-900/85 bg-cover bg-center"
        style={{
          // CSS background image with linear gradient overlay on top of the pattern image
          // The gradient creates a dark blue to black overlay for better text readability
          // rgba(11, 44, 78, 0.4) = dark blue with 40% opacity at the top
          // rgba(0, 0, 0, 0.9) = black with 90% opacity at the bottom
          backgroundImage: `linear-gradient(rgba(11, 44, 78, 0.4), rgba(0, 0, 0, 0.9)), url(${bgImage})`,
        }}
      >
        {/* 
          Header component with props for:
          - sidebarCollapsed: current state of sidebar
          - onToggleSidebar: function to toggle sidebar collapse/expand
        */}
        <Header
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={() => setSidebarCollapsed((v) => !v)}
        />

        {/* 
          Main content area wrapper using flex layout
          min-h-0 prevents flex items from overflowing their container
        */}
        <div className="flex flex-1 min-h-0 w-full">
          {/* 
            Sidebar component with props for:
            - active: currently active panel key
            - onChange: function to change active panel
            - collapsed: current collapsed state
            - onToggleCollapse: function to toggle sidebar collapse
          */}
          <Sidebar
            active={active}
            onChange={setActive}
            collapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed((v) => !v)}
          />

          {/* 
            Main content area that displays the active panel content
            - flex-1: takes remaining space after sidebar
            - overflow-auto: enables scrolling if content overflows
            - p-6: padding for content spacing
            - text-white/90: white text with 90% opacity
            - sidebar-scroll: custom class for scrollbar styling
          */}
          <main className="flex-1 overflow-auto p-6 text-white/90 sidebar-scroll">
            {/* 
              Conditional rendering based on active panel key
              Each condition checks if the active state matches and renders the appropriate component
            */}

            {/* Dashboard panel - renders the main dashboard component */}
            {active === "Dashboard" && <Dashboard />}

            {/* Data Collection panel - placeholder content */}
            {active === "Data Collection" && (
              <section>
                <h1 className="text-2xl font-semibold mb-2">Collection Agents</h1>
                <p className="text-sm opacity-80">Collection Agents content appears here. Placeholder.</p>
              </section>
            )}

            {/* Process & Enrichment panel - renders the TranslationReportPage component */}
            {active === "Process & Enrichment" && <TranslationReportPage />}

            {/* Analysis & Detection panel - placeholder content */}
            {active === "Analysis & Detection" && (
              <section>
                <h1 className="text-2xl font-semibold mb-2">Analysis Agents</h1>
                <p className="text-sm opacity-80">Analysis Agents page placeholder content.</p>
              </section>
            )}

            {/* Report & Share panel - placeholder content */}
            {active === "Report & Share" && (
              <section>
                <h1 className="text-2xl font-semibold mb-2">Report Agents</h1>
                <p className="text-sm opacity-80">Report Agents page placeholder content.</p>
              </section>
            )}

            {/* System panel - placeholder content */}
            {active === "System" && (
              <section>
                <h1 className="text-2xl font-semibold mb-2">System</h1>
                <p className="text-sm opacity-80">System page placeholder content.</p>
              </section>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}