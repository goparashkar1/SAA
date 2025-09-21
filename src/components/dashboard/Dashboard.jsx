import React, { useMemo, useState } from "react";
import WidgetPalette from "./WidgetPalette";
import WidgetSlot from "./WidgetSlot";
import { useDash } from "../../store/dashboard";

// Converts widget width (grid units) to Tailwind column-span utility classes so the layout matches the grid config.
const colSpanClass = (w) => {
  switch (w) {
    case 3:
      return "xl:col-span-3";
    case 4:
      return "xl:col-span-4";
    case 5:
      return "xl:col-span-5";
    case 6:
      return "xl:col-span-6";
    case 8:
      return "xl:col-span-8";
    case 9:
      return "xl:col-span-9";
    case 12:
      return "xl:col-span-12";
    default:
      return "xl:col-span-6";
  }
};

// Dashboard brings together the active layout, runtime widget props, and supporting chrome (title + palette).
const Dashboard = () => {
  // Persisted layout from zustand drives which widgets render and their size/position.
  const layout = useDash((state) => state.layout);
  // Region state is shared across globe + dependent widgets (news, stats, sentiment).
  const [selectedRegion, setSelectedRegion] = useState(null);

  // Mock news payload stands in for a future data service and is memoised so objects stay referentially stable.
  const mockNewsData = useMemo(
    () => [
      { id: 1, title: "Economic Summit Concludes with New Trade Agreements", region: "North America", description: "Leaders from multiple countries have signed new trade agreements aimed at boosting economic recovery.", date: "2023-10-15" },
      { id: 2, title: "Climate Change Conference Addresses Rising Sea Levels", region: "Europe", description: "Scientists present new data showing accelerated ice melt in polar regions.", date: "2023-10-14" },
      { id: 3, title: "Technology Innovation Fund Announced in Asia", region: "Asia", description: "New $500M fund will support AI and clean energy startups across the continent.", date: "2023-10-13" },
      { id: 4, title: "Agricultural Development Program Launched in Africa", region: "Africa", description: "New initiative aims to improve food security and sustainable farming practices.", date: "2023-10-12" },
      { id: 5, title: "Pacific Nations Collaborate on Fisheries Management", region: "Oceania", description: "Joint agreement establishes sustainable fishing quotas for the coming year.", date: "2023-10-11" },
      { id: 6, title: "South American Countries Address Deforestation", region: "South America", description: "New satellite monitoring system will help track and prevent illegal logging activities.", date: "2023-10-10" }
    ],
    []
  );

  // Filter news whenever a region is selected so dependent widgets stay context-aware.
  const filteredNews = useMemo(
    () =>
      selectedRegion
        ? mockNewsData.filter((news) => news.region === selectedRegion)
        : mockNewsData,
    [mockNewsData, selectedRegion]
  );

  // Runtime props feed per-widget inputs that depend on shared dashboard state (selected region, filtered data, etc.).
  const runtimeProps = useMemo(
    () => ({
      heatmap: {},
      news: {
        newsData: filteredNews,
        selectedRegion,
      },
      stats: {
        selectedRegion,
      },
      sentiment: {
        selectedRegion,
      },
      translation: {},
      globe: {
        selectedRegion,
        onRegionSelect: setSelectedRegion,
      },
    }),
    [filteredNews, selectedRegion]
  );

  // Visible layout excludes widgets that have been "closed" and stitches in the widget-specific runtime props.
  const visibleItems = useMemo(
    () =>
      layout
        .filter((item) => !item.closed)
        .map((item) => ({
          ...item,
          runtimeProps: runtimeProps[item.widgetId] ?? {},
        })),
    [layout, runtimeProps]
  );

  return (
    <div className="p-4 md:p-6 text-white/90">
      <div className="mb-4 flex flex-col gap-4 md:mb-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Global News Dashboard</h1>
          <p className="text-sm opacity-80">Monitor news trends and statistics across regions</p>
        </div>
        {/* Palette provides entry points for adding or resetting widgets. */}
        <WidgetPalette />
      </div>

      <div className="grid grid-cols-1 items-stretch gap-4 md:gap-6 xl:grid-cols-12">
        {visibleItems.map((item) => (
          <div key={item.i} className={`h-full w-full ${colSpanClass(item.w)}`}>
            <WidgetSlot item={item} />
          </div>
        ))}

        {/* Empty-state tile nudges the user to add widgets when none are visible. */}
        {visibleItems.length === 0 && (
          <div className="mx-auto w-fit rounded-lg border border-dashed border-white/20 bg-white/5 px-20 py-4 text-center text-sm text-white/60">
            No widgets active. Use "Add widget" to populate the dashboard.
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
