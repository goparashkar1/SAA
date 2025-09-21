// Importing ComponentType from React for type annotations
import type { ComponentType } from "react";

// Type definition for all valid widget identifiers in the application
// This union type ensures type safety when referencing widgets throughout the codebase
export type WidgetId = "globe" | "news" | "stats" | "sentiment" | "translation" | "heatmap";

// Interface defining the structure of a widget configuration object
// This ensures consistency across all widget definitions in the registry
interface WidgetConfig {
  name: string; // Human-readable display name for the widget
  icon: string; // Name of the Lucide React icon to use for this widget (must match available icons)
  import: () => Promise<{ default: ComponentType<any> }>; // Dynamic import function for code splitting
  defaultSize: { w: number; h: number }; // Default dimensions for the widget in grid units
}

// Main widget registry object that maps WidgetIds to their configuration
// This serves as the single source of truth for all available widgets in the application
export const widgetRegistry: Record<WidgetId, WidgetConfig> = {
  // Globe widget configuration - displays a 3D globe visualization
  globe: {
    name: "Globe", // Display name shown in UI
    icon: "Globe2", // Lucide React icon name (Globe2 component)
    import: () => import("../components/dashboard/GlobeMap"), // Lazy-loaded component import
    defaultSize: { w: 6, h: 6 }, // Default size: 6 grid units wide, 6 grid units high
  },
  
  // News widget configuration - displays news feeds or articles
  news: {
    name: "News", // Display name shown in UI
    icon: "Newspaper", // Lucide React icon name (Newspaper component)
    import: () => import("../components/dashboard/NewsWidget"), // Lazy-loaded component import
    defaultSize: { w: 6, h: 6 }, // Default size: 6 grid units wide, 6 grid units high
  },
  
  // Statistics widget configuration - displays data visualizations and charts
  stats: {
    name: "Statistics", // Display name shown in UI
    icon: "BarChart3", // Lucide React icon name (BarChart3 component)
    import: () => import("../components/dashboard/StatsWidget"), // Lazy-loaded component import
    defaultSize: { w: 6, h: 6 }, // Default size: 6 grid units wide, 6 grid units high
  },
  
  // Sentiment analysis widget configuration - displays sentiment metrics
  sentiment: {
    name: "Sentiment", // Display name shown in UI
    icon: "HeartPulse", // Lucide React icon name (HeartPulse component)
    import: () => import("../components/dashboard/SentimentWidget"), // Lazy-loaded component import
    defaultSize: { w: 6, h: 6 }, // Default size: 6 grid units wide, 6 grid units high
  },
  
  // Translation widget configuration - provides translation functionality
  translation: {
    name: "Translation", // Display name shown in UI
    icon: "Languages", // Lucide React icon name (Languages component)
    import: () => import("../components/dashboard/TranslationWidget"), // Lazy-loaded component import
    defaultSize: { w: 6, h: 6 }, // Default size: 6 grid units wide, 6 grid units high
  },
  
  // Heatmap widget configuration - displays data density visualization
  heatmap: {
    name: "Heatmap", // Display name shown in UI
    icon: "Flame", // Lucide React icon name (Flame component)
    import: () => import("../components/dashboard/HeatmapWidget"), // Lazy-loaded component import
    defaultSize: { w: 12, h: 8 }, // Larger default size: 12 grid units wide, 8 grid units high
  },
};