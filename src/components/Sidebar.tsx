import React from "react";
import { PanelKey } from "../types";
import {
  Search,
  FileText,
  Newspaper,
  ClipboardList,
  ChevronLeft,
  ChevronRight,
  Languages,
  Tag,
  TrendingUp,
  Globe,
  LayoutDashboard,
  SlidersHorizontal,
  LineChart,
  GitBranch,
  Rss,
  Share2,
  FileCode,
  Scan,
  Activity,
  Calendar,
  Map,
  Shield,
  Megaphone,
  Database,
  CloudDownload,
  Settings as SettingsIcon,
  AudioLines,
  Sparkles,
  Smile,
  MapPin,
  Bot,
  Camera,
  AlertTriangle,
  Coins,
  Users,
  Eye,
  ShieldCheck,
  History,
  BadgeDollarSign,
} from "lucide-react";
import Divider from "./ui/Divider";

// Composite icon used for the monitoring menu badge
function MonitorIcon() {
  return (
    <span className="relative inline-block h-5 w-5 text-white">
      <Globe className="h-5 w-5 opacity-90" />
      <span className="absolute -bottom-0 -right-2 grid place-items-center rounded-full bg-[#263B4C]/90 border border-white/20 h-3.5 w-3.5 shadow-sm">
        <Search className="h-2.5 w-2.5 opacity-90" />
      </span>
    </span>
  );
}

type SidebarItem = { key: PanelKey; label: string; icon: React.ReactNode };
type SidebarSubItem = { id: string; label: string; icon: React.ReactNode };

// Primary navigation sections exposed in the sidebar
const ITEMS: SidebarItem[] = [
  { key: "Dashboard", label: "Dashboard", icon: <LayoutDashboard className="h-5 w-5" /> },
  { key: "Data Collection", label: "Data Collection", icon: <Globe className="h-5 w-5" /> },
  { key: "Process & Enrichment", label: "Process & Enrichment", icon: <SlidersHorizontal className="h-5 w-5" /> },
  { key: "Analysis & Detection", label: "Analysis & Detection", icon: <LineChart className="h-5 w-5" /> },
  { key: "Report & Share", label: "Report & Share", icon: <Newspaper className="h-5 w-5" /> },
  { key: "System", label: "System", icon: <Database className="h-5 w-5" /> },
];

const LABEL_MAX_WIDTH = 200;

const SUB_ITEMS: Partial<Record<PanelKey, SidebarSubItem[]>> = {
  "Data Collection": [
    { id: "web-crawler", label: "Web Crawler", icon: <Search className="h-4 w-4" /> },
    { id: "news-feeds", label: "News Feeds", icon: <Rss className="h-4 w-4" /> },
    { id: "social-media-monitor", label: "Social Media Monitor", icon: <Share2 className="h-4 w-4" /> },
    { id: "dark-web-monitor", label: "Dak Web Monitor", icon: <Eye className="h-4 w-4" /> },
    { id: "file-document-ingestion", label: "File & Document Ingestion", icon: <FileText className="h-4 w-4" /> },
    { id: "geo-spatial-feeds", label: "Geo-Spatial Feeds", icon: <Map className="h-4 w-4" /> },
  ],
  "Process & Enrichment": [
    { id: "translation", label: "Translation", icon: <Languages className="h-4 w-4" /> },
    { id: "transcription", label: "Transcription", icon: <AudioLines className="h-4 w-4" /> },
    { id: "ocr", label: "OCR", icon: <Scan className="h-4 w-4" /> },
    { id: "cleaning-deduplication", label: "Cleaning & Deduplication", icon: <Sparkles className="h-4 w-4" /> },
    { id: "entity-extraction", label: "Entity Extraction", icon: <Tag className="h-4 w-4" /> },
    { id: "sentiment-analysis", label: "Sentiment Analysis", icon: <Smile className="h-4 w-4" /> },
    { id: "geolocation-mapping", label: "Geolocation & Mapping", icon: <MapPin className="h-4 w-4" /> },
  ],
  "Analysis & Detection": [
    { id: "entity-graphs", label: "Entity Graphs", icon: <GitBranch className="h-4 w-4" /> },
    { id: "threat-profiling", label: "Threat Profiling", icon: <Shield className="h-4 w-4" /> },
    { id: "trend-forecasting", label: "Trend Forecasting", icon: <TrendingUp className="h-4 w-4" /> },
    { id: "bot-detection", label: "Bot Detection", icon: <Bot className="h-4 w-4" /> },
    { id: "image-video-forensics", label: "Image-Video Forensice", icon: <Camera className="h-4 w-4" /> },
    { id: "anomaly-detection", label: "Anomaly Detection", icon: <AlertTriangle className="h-4 w-4" /> },
    { id: "crypto-financial-analysis", label: "Crypto-Financial Analysis", icon: <Coins className="h-4 w-4" /> },
  ],
  "Report & Share": [
    { id: "daily-briefs", label: "Daily Briefs", icon: <Calendar className="h-4 w-4" /> },
    { id: "custom-reports", label: "Custom Reports", icon: <ClipboardList className="h-4 w-4" /> },
    { id: "dashboards", label: "Dashboards", icon: <LayoutDashboard className="h-4 w-4" /> },
    { id: "alerts-notifications", label: "Alerts & Notifications", icon: <Megaphone className="h-4 w-4" /> },
    { id: "collaboration-tools", label: "Collaboration Tools", icon: <Users className="h-4 w-4" /> },
    { id: "export-api", label: "Export & API", icon: <CloudDownload className="h-4 w-4" /> },
  ],
  System: [
    { id: "agent-management", label: "Agent Management", icon: <SettingsIcon className="h-4 w-4" /> },
    { id: "user-access-control", label: "User & Access Control", icon: <ShieldCheck className="h-4 w-4" /> },
    { id: "audit-logs", label: "Audit Logs", icon: <History className="h-4 w-4" /> },
    { id: "api-management", label: "API Management", icon: <FileCode className="h-4 w-4" /> },
    { id: "token-economy", label: "Token Economy", icon: <BadgeDollarSign className="h-4 w-4" /> },
    { id: "system-health-performance", label: "System Performance", icon: <Activity className="h-4 w-4" /> },
    { id: "security-compliance", label: "Security & Compliance", icon: <Shield className="h-4 w-4" /> },
    { id: "customization", label: "Customization", icon: <SlidersHorizontal className="h-4 w-4" /> },
  ],
};

export default function Sidebar({
  active,
  onChange,
  collapsed = false,
  onToggleCollapse,
}: {
  active: PanelKey;
  onChange: (k: PanelKey) => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}) {
  // Track expanded accordion group and active submenu selection
  const [openGroup, setOpenGroup] = React.useState<PanelKey | null>(null);
  const [activeSub, setActiveSub] = React.useState<Partial<Record<PanelKey, string | null>>>({});

  // Reset expanded groups when the sidebar collapses
  React.useEffect(() => {
    if (collapsed) setOpenGroup(null);
  }, [collapsed]);

  // Render the collapsible shell and navigation content
  return (
    <aside
      className={
        (collapsed ? "w-[64px]" : "w-[252px]") +
        " relative shrink-0 h-full bg-[#263B4C]/65 shadow-[4px_4px_4px_rgba(0,0,0,0.25)] text-white transition-[width] duration-200"
      }
    >
      {/* Collapse toggle control on the sidebar edge */}
      <button
        type="button"
        onClick={onToggleCollapse}
        className="absolute top-1/2 -translate-y-1/2 translate-x-1/2 right-0 z-10 h-9 w-9 rounded-md border border-white/10 bg-white/10 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/20 grid place-items-center shadow"
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        title={collapsed ? "Expand" : "Collapse"}
      >
        {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
      </button>

      {/* Scrollable navigation column */}
      <div
        className={
          (collapsed ? "p-3" : "px-6 pt-3 pb-6") +
          " h-full overflow-y-auto overflow-x-hidden flex flex-col items-center gap-3 sidebar-scroll"
        }
      >
        {/* Top divider under logo: thicker, more solid, harmonized with item dividers */}
        {!collapsed ? (
          <div className="w-full flex justify-center mt-1 mb-2">
            <div className="relative w-[204px] h-[14px]">
              {/* Base bright line */}
              <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[3px] bg-gradient-to-r from-transparent via-white/40 to-transparent" />
              {/* Cyan core for a more solid feel */}
              <div className="absolute left-2 right-2 top-1/2 -translate-y-1/2 h-[3px] rounded-full bg-gradient-to-r from-cyan-400/0 via-cyan-400 to-cyan-400/0" />
               {/* Cyan core - symmetrical fade using consistent syntax */}
              <div className="absolute left-2 top-1/2 -translate-y-1/2 h-2.5 w-2.5 rounded-full bg-cyan-400/80 shadow-[0_0_8px_rgba(34,211,238,0.5)]" />
              <div className="absolute right-0 top-1/2 -translate-y-1/2 h-2.5 w-2.5 rounded-full bg-cyan-400/80 shadow-[0_0_8px_rgba(34,211,238,0.5)]" />
            </div>
          </div>
        ) : (
          <div className="w-full flex justify-center mt-1 mb-2">
            <div className="relative w-10 h-[12px]">
              <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[2px] bg-gradient-to-r from-transparent via-white/35 to-transparent" />
              <div className="absolute left-2.5 right-2.5 top-1/2 -translate-y-1/2 h-[2px] rounded-full bg-gradient-to-r from-cyan-300/25 via-cyan-400/50 to-cyan-300/25" />
            </div>
          </div>
        )}
        {/* Primary navigation with optional nested submenus */}
        {ITEMS.map((it, idx) => {
          const subItems = SUB_ITEMS[it.key] ?? [];
          return (
            <React.Fragment key={it.key}>
              <SidebarPill
                collapsed={collapsed}
                active={active === it.key}
                onClick={() => {
                  setOpenGroup((v) => (v === it.key ? null : it.key));
                  onChange(it.key);
                }}
                icon={it.icon}
                label={it.label}
                ariaExpanded={openGroup === it.key}
              />

              {!collapsed && openGroup === it.key && subItems.length > 0 && (
                <div className="relative w-full flex flex-col items-start gap-2 pl-6">
                  {/* Vertical connector aligned to bullet centers */}
                  <span className="pointer-events-none absolute left-[18px] top-3 bottom-3 w-px bg-white/15 z-0" />

                  {subItems.map((sub) => (
                    <SidebarSubPill
                      key={sub.id}
                      label={sub.label}
                      icon={sub.icon}
                      active={activeSub[it.key] === sub.id}
                      onClick={() => {
                        setActiveSub((s) => ({ ...s, [it.key]: sub.id }));
                        onChange(it.key);
                      }}
                    />
                  ))}
                </div>
              )}

              {!collapsed && idx < ITEMS.length - 1 && (
                <div className="w-full flex justify-center my-0.5">
                  <div className="relative w-[183px] h-[10px]">
                    <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[2px] bg-gradient-to-r from-transparent via-white/25 to-transparent" />
                    <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[6px] w-14 rounded-full bg-cyan-400/25 blur-[10px]" />
                  </div>
                </div>
              )}
            </React.Fragment>
          );
        })}

        {/* Footer utilities and branding */}
        <div className="mt-auto w-full pt-2">
          {!collapsed && (
            <>
              <div className="w-full flex justify-center my-1">
                <div className="relative w-[183px] h-[10px]">
                  <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[2px] bg-gradient-to-r from-transparent via-white/25 to-transparent" />
                  <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[6px] w-14 rounded-full bg-cyan-400/25 blur-[10px]" />
                </div>
              </div>
              <div className="w-full flex justify-center">
                <div className="pointer-events-none select-none text-center uppercase tracking-[0.25em] text-white/25 mt-2 leading-tight">
                  <div className="text-[8px] sm:text-[8px]">Powered by</div>
                  <div className="text-[10px] sm:text-xs mt-0.5">microsint</div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </aside>
  );
}

// Interactive button for a top-level sidebar item
function SidebarPill({
  active,
  onClick,
  icon,
  label,
  ariaExpanded,
  collapsed,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  ariaExpanded?: boolean;
  collapsed?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "relative inline-flex items-center overflow-hidden transition-colors duration-150 focus:outline-none text-white/90 border h-10 w-full rounded-md " +
        (collapsed ? "justify-center px-0 gap-0 " : "justify-start px-2.5 gap-2 ") +
        (active
          ? " border-cyan-300/30 bg-cyan-600/20 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06),inset_-8px_0_16px_rgba(0,0,0,0.25)]"
          : " border-white/10 bg-white/5 hover:bg-white/10 text-white/90")
      }
      aria-current={active ? "page" : undefined}
      aria-expanded={ariaExpanded}
      aria-label={collapsed ? label : undefined}
      title={collapsed ? label : undefined}
    >
      {active && (
        <span className="absolute right-0 top-0 bottom-0 w-1.5 bg-cyan-400/90 shadow-[0_0_8px_rgba(34,211,238,0.6)] rounded-r-md" />
      )}
      <span className="grid place-items-center h-5 w-5 shrink-0 opacity-90">{icon}</span>
      <span
        className={"text-[13px] leading-tight whitespace-nowrap overflow-hidden " + (collapsed ? "opacity-0" : "opacity-100")}
        style={{
          maxWidth: collapsed ? 0 : LABEL_MAX_WIDTH,
          transition: "max-width 300ms ease-in-out, opacity 300ms ease-in-out",
          willChange: "max-width, opacity",
        }}
      >
        {label}
      </span>
    </button>
  );
}

// Nested submenu entry with bullet indicator and keyboard support
function SidebarSubPill({
  label,
  icon,
  onClick,
  active,
}: {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onClick();
      }}
      className={
        "relative w-full h-8 rounded-md pr-3 pl-2 flex items-center justify-start gap-2 select-none cursor-pointer transition-colors duration-150 " +
        (active
          ? "bg-cyan-600/20 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06),inset_-8px_0_16px-rgba(0,0,0,0.25)]"
          : "text-white/90 hover:bg-white/10")
      }
    >
      {/* Left bullet point (z-index raises it above the connector line) */}
      <span
        className={
          "absolute -left-3 top-1/2 -translate-y-1/2 h-3 w-3 rounded-full border z-10 " +
          (active
            ? "border-cyan-300/70 bg-[#22d3ee]"
            : "border-white/40 bg-[#999999]")
        }
      />
      <span className="grid place-items-center h-4 w-4 shrink-0 opacity-90">{icon}</span>
      <span className="text-xs leading-tight whitespace-nowrap">{label}</span>
    </div>
  );
}
