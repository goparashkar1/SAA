import React from "react";
import CopilotDock from "./copilot/CopilotDock";
import { PanelKey } from "../types";
import { createLightSweepVars, SIDEBAR_LIGHT_SWEEP_SETTINGS } from "../ui/shimmer";
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
  MessageSquare,
  Plane,
  Anchor,
} from "lucide-react";
import { WorkflowDock } from "./WorkflowDock";
// ... your imports


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
type SidebarSubItem = { type?: "item"; id: string; label: string; icon: React.ReactNode };
type SidebarGroup = { type: "group"; id: string; label: string; icon?: React.ReactNode; items: SidebarSubItem[] };
type SidebarEntry = SidebarSubItem | SidebarGroup;

// Primary navigation sections exposed in the sidebar
const ITEMS: SidebarItem[] = [
  { key: "Dashboard", label: "Dashboard", icon: <LayoutDashboard className="h-5 w-5" /> },
  { key: "Data Collection", label: "Data Collection", icon: <Globe className="h-5 w-5" /> },
  { key: "Process & Enrichment", label: "Process & Enrichment", icon: <SlidersHorizontal className="h-5 w-5" /> },
  { key: "Analysis & Detection", label: "Analysis & Detection", icon: <LineChart className="h-5 w-5" /> },
  { key: "Report & Share", label: "Report & Share", icon: <Newspaper className="h-5 w-5" /> },
  { key: "System", label: "System", icon: <Database className="h-5 w-5" /> },
];

const LABEL_MAX_WIDTH = 260;
const GROUP_CONNECTOR_LEFT = "20px";
const SUBGROUP_CONNECTOR_LEFT = "13px";

const SUB_ITEMS: Partial<Record<PanelKey, SidebarEntry[]>> = {
  "Data Collection": [
    {
      type: "group",
      id: "web-news",
      label: "Web & News Sources",
      items: [
        { id: "web-crawler", label: "Web Crawler", icon: <Search className="h-4 w-4" /> },
        { id: "news-feeds", label: "News Feeds", icon: <Rss className="h-4 w-4" /> },
        { id: "dark-web-monitor", label: "Dark Web Monitor", icon: <Eye className="h-4 w-4" /> },
      ],
    },
    {
      type: "group",
      id: "social-open-web",
      label: "Social & Open Web",
      items: [
        { id: "social-media-monitor", label: "Social Media Monitor", icon: <Share2 className="h-4 w-4" /> },
        { id: "forums-blogs", label: "Forums & Blogs", icon: <FileText className="h-4 w-4" /> },
        { id: "messaging-platforms", label: "Messaging Platforms", icon: <MessageSquare className="h-4 w-4" /> },
      ],
    },
    {
      type: "group",
      id: "docs-files",
      label: "Documents & Files",
      items: [
        { id: "file-document-ingestion", label: "File & Document Ingestion", icon: <FileText className="h-4 w-4" /> },
        { id: "archive-repository-monitor", label: "Archive & Repository Monitor", icon: <History className="h-4 w-4" /> },
      ],
    },
    {
      type: "group",
      id: "geo-tracking",
      label: "Geo & Tracking",
      items: [
        { id: "geo-spatial-feeds", label: "Geo-Spatial Feeds", icon: <Map className="h-4 w-4" /> },
        { id: "live-event-monitoring", label: "Live Event Monitoring", icon: <Activity className="h-4 w-4" /> },
        { id: "flight-tracker", label: "Flight Tracker", icon: <Plane className="h-4 w-4" /> },
        { id: "transit-monitoring", label: "Transit Monitoring", icon: <MapPin className="h-4 w-4" /> },
        { id: "vessel-maritime-tracker", label: "Vessel / Maritime Tracker", icon: <Anchor className="h-4 w-4" /> },
      ],
    },
  ],
  "Process & Enrichment": [
    {
      type: "group",
      id: "text-language",
      label: "Text & Language Processing",
      items: [
        { id: "translation", label: "Translation", icon: <Languages className="h-4 w-4" /> },
        { id: "transliteration", label: "Transliteration & Romanization", icon: <Languages className="h-4 w-4" /> },
        { id: "lang-id", label: "Language Identification", icon: <Languages className="h-4 w-4" /> },
        { id: "summarization", label: "Summarization", icon: <FileText className="h-4 w-4" /> },
        { id: "style-transfer", label: "Paraphrase / Style Transfer", icon: <Sparkles className="h-4 w-4" /> },
        { id: "keyword-extraction", label: "Keyword & Topic Extraction", icon: <Tag className="h-4 w-4" /> },
      ],
    },
    {
      type: "group",
      id: "speech-av",
      label: "Speech & A/V Processing",
      items: [
        { id: "transcription", label: "Transcription", icon: <AudioLines className="h-4 w-4" /> },
        { id: "speaker-diarization", label: "Speaker Diarization", icon: <Users className="h-4 w-4" /> },
        { id: "audio-lang-id", label: "Audio Language ID", icon: <AudioLines className="h-4 w-4" /> },
        { id: "subtitle-alignment", label: "Subtitle Alignment", icon: <ClipboardList className="h-4 w-4" /> },
      ],
    },
    {
      type: "group",
      id: "document-visual",
      label: "Document & Visual Text",
      items: [
        { id: "ocr", label: "OCR", icon: <Scan className="h-4 w-4" /> },
        { id: "table-form-extraction", label: "Table & Form Extraction", icon: <ClipboardList className="h-4 w-4" /> },
        { id: "layout-parsing", label: "Layout / Structure Parsing", icon: <LayoutDashboard className="h-4 w-4" /> },
        { id: "doc-conversion", label: "Document Conversion", icon: <FileCode className="h-4 w-4" /> },
      ],
    },
    {
      type: "group",
      id: "data-quality",
      label: "Data Quality & Normalization",
      items: [
        { id: "clean-dedup", label: "Cleaning & Deduplication", icon: <Sparkles className="h-4 w-4" /> },
        { id: "pii-redaction", label: "PII Detection & Redaction", icon: <Shield className="h-4 w-4" /> },
        { id: "canonicalization", label: "Canonicalization", icon: <SlidersHorizontal className="h-4 w-4" /> },
        { id: "fuzzy-dedup", label: "Clustering", icon: <GitBranch className="h-4 w-4" /> },
      ],
    },
    {
      type: "group",
      id: "entities-events",
      label: "Entities, Events & Relations",
      items: [
        { id: "entity-extraction", label: "Entity Extraction", icon: <Tag className="h-4 w-4" /> },
        { id: "entity-linking", label: "Entity Linking & Disambiguation", icon: <GitBranch className="h-4 w-4" /> },
        { id: "event-extraction", label: "Event Extraction", icon: <Activity className="h-4 w-4" /> },
        { id: "relation-extraction", label: "Relationship Extraction", icon: <GitBranch className="h-4 w-4" /> },
        { id: "coref-resolution", label: "Coreference Resolution", icon: <Users className="h-4 w-4" /> },
      ],
    },
    {
      type: "group",
      id: "sentiment-intent",
      label: "Sentiment, Intent & Narrative",
      items: [
        { id: "sentiment-analysis", label: "Sentiment Analysis", icon: <Smile className="h-4 w-4" /> },
        { id: "emotion-toxicity", label: "Emotion / Toxicity", icon: <AlertTriangle className="h-4 w-4" /> },
        { id: "stance-propaganda", label: "Stance / Propaganda", icon: <Shield className="h-4 w-4" /> },
        { id: "topic-modeling", label: "Topic Modeling", icon: <TrendingUp className="h-4 w-4" /> },
      ],
    },
    {
      type: "group",
      id: "geospatial",
      label: "Geospatial Enrichment",
      items: [
        { id: "geolocation-mapping", label: "Geolocation & Mapping", icon: <MapPin className="h-4 w-4" /> },
        { id: "geocoding", label: "Geocoding / Reverse Geocoding", icon: <MapPin className="h-4 w-4" /> },
        { id: "placename-disambig", label: "Disambiguation", icon: <MapPin className="h-4 w-4" /> },
        { id: "route-proximity", label: "Route / Proximity Analysis", icon: <Map className="h-4 w-4" /> },
      ],
    },
    {
      type: "group",
      id: "indexing-embeddings",
      label: "Indexing & Embeddings",
      items: [
        { id: "embeddings", label: "Vectorization / Embeddings", icon: <Sparkles className="h-4 w-4" /> },
        { id: "chunking", label: "Chunking & Segmentation", icon: <ClipboardList className="h-4 w-4" /> },
        { id: "search-index", label: "Search Index Build", icon: <Search className="h-4 w-4" /> },
        { id: "taxonomy-tagging", label: "Taxonomy Tagging", icon: <Tag className="h-4 w-4" /> },
      ],
    },
    {
      type: "group",
      id: "metadata-provenance",
      label: "Metadata & Provenance",
      items: [
        { id: "metadata-extraction", label: "Metadata Extraction", icon: <FileText className="h-4 w-4" /> },
        { id: "source-fingerprint", label: "Source Fingerprint", icon: <History className="h-4 w-4" /> },
        { id: "provenance-lineage", label: "Provenance & Lineage", icon: <ShieldCheck className="h-4 w-4" /> },
      ],
    },
  ],
  "Analysis & Detection": [
    {
      type: "group",
      id: "graphs-networks",
      label: "Graphs & Networks",
      items: [
        { id: "entity-graphs", label: "Entity Graphs", icon: <GitBranch className="h-4 w-4" /> },
        { id: "community-detection", label: "Community Detection", icon: <GitBranch className="h-4 w-4" /> },
        { id: "centrality-influence", label: "Centrality & Influence", icon: <GitBranch className="h-4 w-4" /> },
        { id: "link-prediction", label: "Link Prediction", icon: <GitBranch className="h-4 w-4" /> },
        { id: "kg-reasoning", label: "Knowledge-Graph Reasoning", icon: <GitBranch className="h-4 w-4" /> },
      ],
    },
    {
      type: "group",
      id: "threat-intel-risk",
      label: "Threat Intelligence & Risk",
      items: [
        { id: "threat-profiling", label: "Threat Profiling", icon: <Shield className="h-4 w-4" /> },
        { id: "ttp-mapping", label: "TTP Mapping (ATT&CK)", icon: <Shield className="h-4 w-4" /> },
        { id: "ioc-correlation", label: "IOC Correlation", icon: <AlertTriangle className="h-4 w-4" /> },
        { id: "risk-scoring", label: "Risk Scoring", icon: <ShieldCheck className="h-4 w-4" /> },
        { id: "watchlist-matching", label: "Watchlist Matching", icon: <Shield className="h-4 w-4" /> },
      ],
    },
    {
      type: "group",
      id: "time-series-forecasting",
      label: "Time Series & Forecasting",
      items: [
        { id: "trend-forecasting", label: "Trend Forecasting", icon: <TrendingUp className="h-4 w-4" /> },
        { id: "nowcasting-spikes", label: "Nowcasting & Spikes", icon: <Activity className="h-4 w-4" /> },
        { id: "seasonality-decomp", label: "Seasonality / Decomposition", icon: <LineChart className="h-4 w-4" /> },
        { id: "change-point", label: "Change Point Detection", icon: <LineChart className="h-4 w-4" /> },
      ],
    },
    {
      type: "group",
      id: "behavioral-bot",
      label: "Behavioral & Bot Analytics",
      items: [
        { id: "bot-detection", label: "Bot Detection", icon: <Bot className="h-4 w-4" /> },
        { id: "cib-detection", label: "Coordinated Inauthentic Behavior", icon: <Users className="h-4 w-4" /> },
        { id: "sockpuppet-clusters", label: "Sockpuppet Clusters", icon: <Users className="h-4 w-4" /> },
        { id: "automation-fingerprints", label: "Automation Fingerprints", icon: <Bot className="h-4 w-4" /> },
      ],
    },
    {
      type: "group",
      id: "media-forensics",
      label: "Media Forensics",
      items: [
        { id: "image-video-forensics", label: "Image-Video Forensics", icon: <Camera className="h-4 w-4" /> },
        { id: "deepfake-detection", label: "Deepfake Detection", icon: <Camera className="h-4 w-4" /> },
        { id: "metadata-forensics", label: "Metadata Forensics", icon: <FileText className="h-4 w-4" /> },
        { id: "geo-chrono-locate", label: "Geo/Chrono-Location", icon: <Map className="h-4 w-4" /> },
      ],
    },
    {
      type: "group",
      id: "anomaly-outliers",
      label: "Anomaly & Outliers",
      items: [
        { id: "anomaly-detection", label: "Anomaly Detection", icon: <AlertTriangle className="h-4 w-4" /> },
        { id: "fraud-abuse", label: "Fraud & Abuse Signals", icon: <AlertTriangle className="h-4 w-4" /> },
        { id: "rare-event-mining", label: "Rare-Event Mining", icon: <Search className="h-4 w-4" /> },
        { id: "outlier-explainer", label: "Outlier Explainer", icon: <Search className="h-4 w-4" /> },
      ],
    },
    {
      type: "group",
      id: "crypto-finint",
      label: "Crypto / Financial Intelligence",
      items: [
        { id: "crypto-financial-analysis", label: "Crypto-Financial Analysis", icon: <Coins className="h-4 w-4" /> },
        { id: "address-clustering", label: "Address Clustering", icon: <GitBranch className="h-4 w-4" /> },
        { id: "flow-tracing", label: "Flow Tracing", icon: <Activity className="h-4 w-4" /> },
        { id: "sanctions-exposure", label: "Sanctions Exposure", icon: <ShieldCheck className="h-4 w-4" /> },
      ],
    },
  ],
  "Report & Share": [
    {
      type: "group",
      id: "briefings-reports",
      label: "Briefings & Reports",
      items: [
        { id: "daily-briefs", label: "Daily Briefs", icon: <Calendar className="h-4 w-4" /> },
        { id: "custom-reports", label: "Custom Reports", icon: <ClipboardList className="h-4 w-4" /> },
        { id: "scheduled-reports", label: "Scheduled Reports", icon: <Calendar className="h-4 w-4" /> },
        { id: "templates-branding", label: "Templates & Branding", icon: <FileText className="h-4 w-4" /> },
        { id: "publishing-approvals", label: "Publishing Queue & Approvals", icon: <ShieldCheck className="h-4 w-4" /> },
      ],
    },
    {
      type: "group",
      id: "dashboards-storyboards",
      label: "Dashboards & Storyboards",
      items: [
        { id: "dashboards", label: "Dashboards", icon: <LayoutDashboard className="h-4 w-4" /> },
        { id: "storyboards", label: "Storyboards / Narratives", icon: <Newspaper className="h-4 w-4" /> },
        { id: "snapshot-versioning", label: "Snapshot & Versioning", icon: <History className="h-4 w-4" /> },
        { id: "embeds-share", label: "Embeds & Share Links", icon: <Share2 className="h-4 w-4" /> },
        { id: "widget-library", label: "KPI & Widget Library", icon: <Sparkles className="h-4 w-4" /> },
      ],
    },
    {
      type: "group",
      id: "alerts-notifications",
      label: "Alerts & Notifications",
      items: [
        { id: "alerts-notifications", label: "Alerts & Notifications", icon: <Megaphone className="h-4 w-4" /> },
        { id: "rule-triggers", label: "Threshold & Rule Triggers", icon: <AlertTriangle className="h-4 w-4" /> },
        { id: "digests-summaries", label: "Digests & Summaries", icon: <FileText className="h-4 w-4" /> },
        { id: "channel-delivery", label: "Channel Delivery", icon: <Share2 className="h-4 w-4" /> },
        { id: "geofence-topic-watchers", label: "Geofence & Topic Watchers", icon: <MapPin className="h-4 w-4" /> },
      ],
    },
    {
      type: "group",
      id: "collaboration-workflow",
      label: "Collaboration & Workflow",
      items: [
        { id: "collaboration-tools", label: "Collaboration Tools", icon: <Users className="h-4 w-4" /> },
        { id: "comments-annotations", label: "Comments & Annotations", icon: <FileText className="h-4 w-4" /> },
        { id: "tasks-assignments", label: "Tasks & Assignments", icon: <ClipboardList className="h-4 w-4" /> },
        { id: "review-approval", label: "Review & Approval", icon: <ShieldCheck className="h-4 w-4" /> },
        { id: "version-history", label: "Version History", icon: <History className="h-4 w-4" /> },
        { id: "share-permissions", label: "Share Links & Permissions", icon: <Shield className="h-4 w-4" /> },
      ],
    },
    {
      type: "group",
      id: "export-api",
      label: "Export & API",
      items: [
        { id: "export-api", label: "Export & API", icon: <CloudDownload className="h-4 w-4" /> },
        { id: "export-formats", label: "Export Formats", icon: <CloudDownload className="h-4 w-4" /> },
        { id: "rest-api", label: "Programmatic Access (REST)", icon: <FileCode className="h-4 w-4" /> },
        { id: "webhooks-callbacks", label: "Webhooks & Callbacks", icon: <Activity className="h-4 w-4" /> },
        { id: "integrations", label: "External Integrations", icon: <Share2 className="h-4 w-4" /> },
        { id: "data-feeds", label: "Data Feeds", icon: <Rss className="h-4 w-4" /> },
        { id: "watermarking-classification", label: "Watermarking & Classification", icon: <Shield className="h-4 w-4" /> },
      ],
    },
  ],
  System: [
    {
      type: "group",
      id: "platform-ops",
      label: "Platform Ops & Observability",
      items: [
        { id: "system-health-performance", label: "System Performance", icon: <Activity className="h-4 w-4" /> },
        { id: "health-metrics", label: "Health & Metrics", icon: <Activity className="h-4 w-4" /> },
        { id: "audit-logs", label: "Audit Logs", icon: <History className="h-4 w-4" /> },
        { id: "scheduler-queues", label: "Job Scheduler & Queues", icon: <Calendar className="h-4 w-4" /> },
        { id: "backups-restore", label: "Backups & Restore", icon: <CloudDownload className="h-4 w-4" /> },
        { id: "datastores-caches", label: "Data Stores & Caches", icon: <Database className="h-4 w-4" /> },
      ],
    },
    {
      type: "group",
      id: "access-security",
      label: "Access, Security & Compliance",
      items: [
        { id: "user-access-control", label: "User & Access Control", icon: <ShieldCheck className="h-4 w-4" /> },
        { id: "security-compliance", label: "Security & Compliance", icon: <Shield className="h-4 w-4" /> },
        { id: "secrets-keys", label: "Secrets & Keys", icon: <Shield className="h-4 w-4" /> },
        { id: "sso-oauth", label: "SSO / OAuth", icon: <Users className="h-4 w-4" /> },
        { id: "rate-limits", label: "Rate Limits & Throttling", icon: <AlertTriangle className="h-4 w-4" /> },
      ],
    },
    {
      type: "group",
      id: "apis-integrations",
      label: "APIs & Integrations",
      items: [
        { id: "api-management", label: "API Management", icon: <FileCode className="h-4 w-4" /> },
        { id: "webhooks-callbacks", label: "Webhooks & Callbacks", icon: <Activity className="h-4 w-4" /> },
        { id: "sdks-client-keys", label: "SDKs & Client Keys", icon: <FileCode className="h-4 w-4" /> },
        { id: "external-integrations", label: "External Integrations", icon: <Share2 className="h-4 w-4" /> },
      ],
    },
    {
      type: "group",
      id: "agents-models-billing",
      label: "Agents, Models & Billing",
      items: [
        { id: "agent-management", label: "Agent Management", icon: <SettingsIcon className="h-4 w-4" /> },
        { id: "token-economy", label: "Token Economy", icon: <BadgeDollarSign className="h-4 w-4" /> },
        { id: "billing-quotas", label: "Billing & Quotas", icon: <BadgeDollarSign className="h-4 w-4" /> },
        { id: "model-registry", label: "Model Registry & Keys", icon: <Sparkles className="h-4 w-4" /> },
        { id: "runtime-sandboxes", label: "Runtime Sandboxes", icon: <Bot className="h-4 w-4" /> },
      ],
    },
    {
      type: "group",
      id: "customization-workspace",
      label: "Customization & Workspace",
      items: [
        { id: "customization", label: "Customization", icon: <SlidersHorizontal className="h-4 w-4" /> },
        { id: "feature-flags", label: "Feature Flags", icon: <SlidersHorizontal className="h-4 w-4" /> },
        { id: "localization", label: "Localization", icon: <Languages className="h-4 w-4" /> },
        { id: "appearance-themes", label: "Appearance & Themes", icon: <SlidersHorizontal className="h-4 w-4" /> },
        { id: "workspace-settings", label: "Tenant & Workspace Settings", icon: <Users className="h-4 w-4" /> },
      ],
    },
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
  const [openSubGroups, setOpenSubGroups] = React.useState<Record<string, boolean>>({});

  // Reset expanded groups when the sidebar collapses
  React.useEffect(() => {
    if (collapsed) setOpenGroup(null);
  }, [collapsed]);

  const activeGroupHasSubItems =
    openGroup != null && (SUB_ITEMS[openGroup]?.length ?? 0) > 0;

  const anyNestedGroupOpen =
    openGroup != null &&
    Object.keys(openSubGroups).some((key) =>
      key.startsWith(`${openGroup}:`) && openSubGroups[key]
    );

  const dockOverlayActive =
    !collapsed && (activeGroupHasSubItems || anyNestedGroupOpen);

  const [overlayMode, setOverlayMode] = React.useState(dockOverlayActive);
  const overlayTimeoutRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    if (dockOverlayActive) {
      if (overlayTimeoutRef.current) {
        window.clearTimeout(overlayTimeoutRef.current);
        overlayTimeoutRef.current = null;
      }
      setOverlayMode(true);
      return;
    }

    overlayTimeoutRef.current = window.setTimeout(() => {
      setOverlayMode(false);
      overlayTimeoutRef.current = null;
    }, 220);

    return () => {
      if (overlayTimeoutRef.current) {
        window.clearTimeout(overlayTimeoutRef.current);
        overlayTimeoutRef.current = null;
      }
    };
  }, [dockOverlayActive]);

  const navClassName = [
    "row-start-1 col-span-full",
    overlayMode ? "row-span-3" : "row-span-1",
    collapsed ? "py-3" : "pt-3 pb-6",
    "px-0 sidebar-scroll flex flex-col items-stretch gap-0",
    "relative min-h-0 overflow-y-auto overflow-x-hidden transition-[box-shadow] duration-200 ease-in-out",
    overlayMode
      ? "z-50 bg-[#263B4C]/95 shadow-[0_0_0_1px_rgba(148,233,255,0.35)]"
      : "z-30",
  ].join(" ");

  const workflowDockClassName = [
    "row-start-2 col-span-full relative w-full border-t border-white/10 pt-3 pb-2 transition-all duration-300 ease-in-out",
    overlayMode
      ? "z-0 pointer-events-none blur-sm opacity-60 saturate-75"
      : "z-10 opacity-100",
  ].join(" ");

  const copilotDockClassName = [
    "row-start-3 col-span-full relative w-full border-t border-white/10 pt-3 transition-all duration-300 ease-in-out",
    overlayMode
      ? "z-0 pointer-events-none blur-sm opacity-60 saturate-75"
      : "z-10 opacity-100",
  ].join(" ");

  // Render the collapsible shell and navigation content
  return (
    <aside
      className={
        (collapsed ? "w-[64px]" : "w-[320px]") +
        " relative isolate z-40 shrink-0 h-full bg-[#263B4C]/65 shadow-[4px_4px_4px_rgba(0,0,0,0.25)] text-white transition-[width] duration-200"
      }
    >
      {/* Collapse toggle control on the sidebar edge */}
      <button
        type="button"
        onClick={onToggleCollapse}
        className="absolute top-1/2 -translate-y-1/2 translate-x-1/2 right-0 z-60 h-9 w-9 rounded-md border border-white/10 bg-white/10 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/20 grid place-items-center shadow transition-all duration-200 ease-in-out"
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        title={collapsed ? "Expand" : "Collapse"}
      >
        {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
      </button>

      <div className="relative grid h-full grid-rows-[minmax(0,1fr)_auto_auto]">
        {/* Scrollable navigation column */}
        <div className={navClassName}>
          {/* Top divider under logo: thicker, more solid, harmonized with item dividers */}
          {!collapsed ? (
            <div className="w-full flex justify-center mt-1 mb-2">
              <div className="relative w-[260px] h-[14px]">
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

                {!collapsed && subItems.length > 0 && (
                  <div
                    className={
                      "relative z-50 w-full flex flex-col items-start gap-2 pl-6 transition-all duration-200 ease-in-out " +
                      (openGroup === it.key
                        ? "max-h-[1600px] opacity-100 mt-2 overflow-visible pr-1"
                        : "max-h-0 opacity-0 mt-0 pointer-events-none overflow-hidden")
                    }
                    aria-hidden={openGroup !== it.key}
                  >
                    {/* Vertical connector aligned to bullet centers */}
                    {openGroup === it.key && (
                      <span
                        className="pointer-events-none absolute w-px bg-white/15 z-0"
                        style={{ left: GROUP_CONNECTOR_LEFT, top: "12px", bottom: "12px" }}
                      />
                    )}

                    {subItems.map((entry) => {
                      if (entry.type === "group") {
                        const groupKey = `${it.key}:${entry.id}`;
                        return (
                          <SidebarSubGroup
                            key={entry.id}
                            label={entry.label}
                            icon={entry.icon}
                            items={entry.items}
                            open={Boolean(openSubGroups[groupKey])}
                            onToggle={() => {
                              const thisKey = `${it.key}:${entry.id}`;
                              setOpenSubGroups((current) => {
                                const isOpen = !!current[thisKey];

                                // Keep groups from OTHER top-level sections; close siblings in THIS section
                                const next: Record<string, boolean> = {};
                                for (const k of Object.keys(current)) {
                                  if (!k.startsWith(`${it.key}:`)) next[k] = current[k];
                                }

                                // If it wasn't open, open this one; otherwise leave all closed for this section
                                if (!isOpen) next[thisKey] = true;

                                return next;
                              });
                            }}
                            activeId={activeSub[it.key] ?? null}
                            onItemClick={(item) => {
                              setActiveSub((s) => ({ ...s, [it.key]: item.id }));
                              onChange(it.key);
                            }}
                          />
                        );
                      }

                      const sub = entry as SidebarSubItem;
                      return (
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
                      );
                    })}
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* --- Workflows Dock (dedicated space above Copilot) --- */}
        <div className={workflowDockClassName}>
          <WorkflowDock collapsed={collapsed} />
        </div>

        <div className={copilotDockClassName}>
          <CopilotDock collapsed={collapsed} />
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
  const labelStyle: React.CSSProperties = {
    maxWidth: collapsed ? 0 : LABEL_MAX_WIDTH,
    letterSpacing: "0.5px",
    transition: "max-width 280ms ease, opacity 200ms ease, transform 200ms ease",
    willChange: "max-width, opacity, transform",
    opacity: collapsed ? 0 : 1,
    transform: collapsed ? "translateX(-8px)" : "translateX(0)",
    paddingLeft: collapsed ? 0 : 8,
  };
  const sweepStyle = React.useMemo(
    () => createLightSweepVars(SIDEBAR_LIGHT_SWEEP_SETTINGS),
    []
  );

  return (
    <button
      type="button"
      onClick={onClick}
      data-active={active ? "true" : undefined}
      className={[
        "sidebar-button light-sweep-surface relative grid h-10 w-full grid-cols-[48px_auto] items-center overflow-hidden border-t border-white/10 transition-all duration-200 ease-in-out focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-200/60 text-white/90",
        collapsed ? "px-0" : "px-2",
        active ? "bg-cyan-600/20 text-white" : "bg-white/5",
      ].join(" ")}
      aria-current={active ? "page" : undefined}
      aria-expanded={ariaExpanded}
      aria-label={collapsed ? label : undefined}
      title={collapsed ? label : undefined}
      data-light-sweep="sidebar"
      style={{
        ...sweepStyle,
        gridTemplateColumns: collapsed ? "48px 0fr" : "48px 1fr",
        columnGap: 0,
      }}
    >
      <span className="pointer-events-none flex h-5 w-5 items-center justify-center justify-self-center opacity-90">
        {icon}
      </span>
      <span
        className="text-[13px] leading-tight whitespace-nowrap overflow-hidden justify-self-start"
        style={labelStyle}
      >
        {label}
      </span>
    </button>
  );
}

// Expandable subgroup wrapper that nests additional sidebar pills
function SidebarSubGroup({
  label,
  icon,
  items,
  open,
  onToggle,
  activeId,
  onItemClick,
}: {
  label: string;
  icon?: React.ReactNode;
  items: SidebarSubItem[];
  open: boolean;
  onToggle: () => void;
  activeId: string | null | undefined;
  onItemClick: (item: SidebarSubItem) => void;
}) {
  const headerRef = React.useRef<HTMLDivElement>(null);
  const childrenRef = React.useRef<HTMLDivElement>(null);
  const hasActiveChild = React.useMemo(() => items.some((item) => item.id === activeId), [items, activeId]);
  const sweepStyle = React.useMemo(
    () => createLightSweepVars(SIDEBAR_LIGHT_SWEEP_SETTINGS),
    []
  );

  const focusChild = React.useCallback(
    (position: "first" | "last") => {
      const buttons = childrenRef.current?.querySelectorAll<HTMLDivElement>("[role='button']");
      if (!buttons?.length) return;
      const target = position === "first" ? buttons[0] : buttons[buttons.length - 1];
      target?.focus();
    },
    []
  );

  const handleHeaderKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onToggle();
        return;
      }

      if (!open || !items.length) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        focusChild("first");
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        focusChild("last");
      }
    },
    [focusChild, items, onToggle, open]
  );

  const handleChildAreaKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;

      const buttons = childrenRef.current?.querySelectorAll<HTMLDivElement>("[role='button']");
      if (!buttons?.length) return;

      const targetIndex = Array.from(buttons).findIndex((btn) => btn === e.target);
      if (targetIndex === -1) return;

      e.preventDefault();

      if (e.key === "ArrowDown") {
        const next = buttons[targetIndex + 1] ?? buttons[targetIndex];
        next?.focus();
      } else {
        if (targetIndex === 0) {
          headerRef.current?.focus();
        } else {
          buttons[targetIndex - 1]?.focus();
        }
      }
    },
    [headerRef]
  );

  const highlight = open || hasActiveChild;

  return (
    <div className="w-full">
      <div
        ref={headerRef}
        role="button"
        tabIndex={0}
        aria-expanded={open}
        data-active={highlight ? "true" : undefined}
        onClick={onToggle}
        onKeyDown={handleHeaderKeyDown}
        className={
          "sidebar-button light-sweep-surface relative flex h-8 w-full items-center justify-start gap-1.5 px-2 text-white/90 border-t border-white/10 transition-all duration-200 ease-in-out focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-200/60 " +
          (highlight ? "bg-cyan-600/20 text-white" : "bg-white/5")
        }
        data-light-sweep="sidebar"
        style={sweepStyle}
      >
        <span className="inline-flex items-center justify-center h-4 w-4 text-white/80 transition-transform duration-200">
          <ChevronRight
            className={
              "h-4 w-4 transition-transform duration-200" +
              (open ? " rotate-90" : "")
            }
          />
        </span>
        {icon ? <span className="grid place-items-center h-4 w-4 shrink-0 opacity-90">{icon}</span> : null}
        <span
          className="text-xs leading-tight whitespace-nowrap"
          style={{ letterSpacing: "0.5px" }}
        >
          {label}
        </span>
      </div>

      <div
        ref={childrenRef}
        onKeyDown={handleChildAreaKeyDown}
        className={
          "relative z-50 w-full pl-5 flex flex-col gap-2 transition-all duration-200 ease-in-out " +
          (open ? "max-h-[960px] opacity-100 mt-2 overflow-visible" : "max-h-0 opacity-0 mt-0 pointer-events-none overflow-hidden")
        }
        aria-hidden={!open}
      >
        {open && (
  <span
    className="pointer-events-none absolute w-px bg-white/15"
    style={{ left: SUBGROUP_CONNECTOR_LEFT, top: 0, bottom: 0 }}
  />
)}

        {items.map((item) => (
          <div key={item.id} className="relative">
            <SidebarSubPill
              label={item.label}
              icon={item.icon}
              active={activeId === item.id}
              onClick={() => onItemClick(item)}
            />
          </div>
        ))}
      </div>
    </div>
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
  const sweepStyle = React.useMemo(
    () => createLightSweepVars(SIDEBAR_LIGHT_SWEEP_SETTINGS),
    []
  );

  return (
    <div
      role="button"
      tabIndex={0}
      data-active={active ? "true" : undefined}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onClick();
      }}
      className={
        "sidebar-button light-sweep-surface relative flex h-8 w-full items-center justify-start gap-2 px-2 select-none cursor-pointer border-t border-white/10 transition-all duration-200 ease-in-out text-white/90 focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-200/60 " +
        (active ? "bg-cyan-600/20 text-white" : "bg-white/5")
      }
      data-light-sweep="sidebar"
      style={sweepStyle}
    >
      <span
        className={
          "absolute -left-3 top-1/2 -translate-y-1/2 h-2.5 w-2.5 rounded-full border z-10 " +
          (active ? "border-cyan-300/70 bg-[#22d3ee]" : "border-white/40 bg-[#999999]")
        }
      />
      <span className="grid place-items-center h-4 w-4 shrink-0 opacity-90">{icon}</span>
      <span
        className="text-xs leading-tight whitespace-nowrap"
        style={{ letterSpacing: "0.5px" }}
      >
        {label}
      </span>
    </div>
  );
}






