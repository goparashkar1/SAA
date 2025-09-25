import React, { useEffect, useMemo, useState } from "react";
import { useDash } from "../../store/dashboard";
import DashboardTabs from "./DashboardTabs";
import DashboardToolbar from "./DashboardToolbar";
import WidgetSlot from "./WidgetSlot";

const colSpanClass = (w?: number) => {
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

export default function Dashboard() {
  const dashboards = useDash((state) => state.workspace.dashboards);
  const activeId = useDash((state) => state.workspace.activeDashboardId);
  const renameDashboard = useDash((state) => state.renameDashboard);
  const loadWorkspace = useDash((state) => state.loadWorkspace);

  const activeDashboard = useMemo(
    () => dashboards.find((dashboard) => dashboard.id === activeId) ?? null,
    [dashboards, activeId]
  );

  const layout = useDash((state) => state.layout);

  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [title, setTitle] = useState(activeDashboard?.name ?? "Dashboard");

  useEffect(() => {
    void loadWorkspace();
  }, [loadWorkspace]);

  useEffect(() => {
    setTitle(activeDashboard?.name ?? "Dashboard");
  }, [activeDashboard?.id, activeDashboard?.name]);

  const mockNewsData = useMemo(
    () => [
      {
        id: 1,
        title: "Economic Summit Concludes with New Trade Agreements",
        region: "North America",
        description:
          "Leaders from multiple countries have signed new trade agreements aimed at boosting economic recovery.",
        date: "2023-10-15",
      },
      {
        id: 2,
        title: "Climate Change Conference Addresses Rising Sea Levels",
        region: "Europe",
        description:
          "Scientists present new data showing accelerated ice melt in polar regions.",
        date: "2023-10-14",
      },
      {
        id: 3,
        title: "Technology Innovation Fund Announced in Asia",
        region: "Asia",
        description:
          "New $500M fund will support AI and clean energy startups across the continent.",
        date: "2023-10-13",
      },
      {
        id: 4,
        title: "Agricultural Development Program Launched in Africa",
        region: "Africa",
        description:
          "New initiative aims to improve food security and sustainable farming practices.",
        date: "2023-10-12",
      },
      {
        id: 5,
        title: "Pacific Nations Collaborate on Fisheries Management",
        region: "Oceania",
        description:
          "Joint agreement establishes sustainable fishing quotas for the coming year.",
        date: "2023-10-11",
      },
      {
        id: 6,
        title: "South American Countries Address Deforestation",
        region: "South America",
        description:
          "New satellite monitoring system will help track and prevent illegal logging activities.",
        date: "2023-10-10",
      },
    ],
    []
  );

  const filteredNews = useMemo(
    () =>
      selectedRegion
        ? mockNewsData.filter((news) => news.region === selectedRegion)
        : mockNewsData,
    [mockNewsData, selectedRegion]
  );

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

  const handleTitleBlur = () => {
    if (!activeDashboard) return;
    renameDashboard(activeDashboard.id, title.trim() || "Untitled Dashboard");
  };

  return (
    <div className="p-4 md:p-6 text-white/90">
      <div className="mb-8 flex flex-col gap-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            onBlur={handleTitleBlur}
            className="w-full max-w-xl flex-1 bg-transparent text-2xl font-semibold text-white placeholder-white/40 focus:outline-none focus:ring-0 md:text-3xl"
            aria-label="Dashboard title"
          />
          <div className="flex w-full justify-end md:w-auto">
            <DashboardToolbar />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <DashboardTabs />
        </div>
      </div>

      <div className="grid grid-cols-1 items-stretch gap-4 md:gap-6 xl:grid-cols-12">
        {visibleItems.map((item) => (
          <div key={item.i} className={`h-full w-full ${colSpanClass(item.w)}`}>
            <WidgetSlot item={item} />
          </div>
        ))}

        {visibleItems.length === 0 && (
          <div className="mx-auto w-fit rounded-lg border border-dashed border-white/20 bg-white/5 px-20 py-4 text-center text-sm text-white/60">
            No widgets active. Use "Add widget" to populate the dashboard.
          </div>
        )}
      </div>
    </div>
  );
}
