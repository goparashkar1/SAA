import React from "react";
// Importing Lucide React icons for UI elements:
// - ExternalLink: Represents outgoing links/external content access
// - TrendingUp: Indicates trending or popular content
// - X: Close/remove icon for widget dismissal
import { ExternalLink, TrendingUp, X } from "lucide-react";

// Color scheme mapping for geographic regions
// Provides consistent visual coding across the application for different regions
// Each region is assigned a specific hex color for easy identification
const regionColors = {
  "North America": "#8884d8",  // Purple shade for North American content
  Europe: "#82ca9d",           // Green shade for European content  
  Asia: "#ffc658",             // Yellow/Orange shade for Asian content
  Africa: "#ff8042",           // Orange shade for African content
  Oceania: "#0088FE",          // Blue shade for Oceanian content
  "South America": "#00C49F",  // Teal shade for South American content
};

// TypeScript interface defining the structure of a news item
// Ensures type safety and consistent data structure throughout the component
type NewsItem = {
  id: number;                        // Unique identifier for each news item
  title: string;                     // Headline or title of the news article
  region: keyof typeof regionColors; // Region must be one of the predefined region keys
  description: string;               // Brief summary or excerpt of the news content
  date: string;                      // Publication date or timestamp
};

// Props interface for the NewsWidget component
// Defines what data the component expects to receive
type NewsWidgetProps = {
  newsData: NewsItem[];                       // Array of news items to display
  selectedRegion: keyof typeof regionColors | null;  // Currently selected region filter (null = show all)
  onRemove?: () => void;                      // Optional callback function for widget removal
};

// NewsWidget component - displays a scrollable list of news items with regional filtering
// Implements a card-based layout with interactive elements and visual region coding
export default function NewsWidget({ newsData, selectedRegion, onRemove }: NewsWidgetProps) {
  return (
    // Main container with relative positioning for absolute child elements
    // Uses flex column layout with gap spacing between child elements
    <div className="relative flex h-full flex-col gap-4">
      {/* 
        Conditional remove button - only rendered if onRemove callback is provided
        This allows the widget to be removable when used in a dashboard context
      */}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}  // Triggers the removal callback
          className="absolute -top-2 -right-2 rounded-tr rounded-bl bg-red-500/80 px-2 py-1 text-white transition-colors hover:bg-red-500"
          aria-label="Remove news widget"  // Accessibility label for screen readers
        >
          <X className="h-3 w-3" />  {/* Close icon with small dimensions */}
        </button>
      )}

      {/* 
        Widget header section with icon and dynamic title
        - flex layout with centered items and gap spacing
        - Title changes based on whether a region filter is applied
      */}
      <div className="flex items-center gap-2">
        {/* Trending icon with emerald color and slight transparency */}
        <TrendingUp className="h-5 w-5 text-emerald-400 opacity-90" />
        {/* 
          Dynamic title that contextually changes based on selectedRegion
          - text-lg: Large text size for prominence
          - font-semibold: Semi-bold weight for emphasis
        */}
        <h2 className="text-lg font-semibold">
          {selectedRegion ? `${selectedRegion} News` : "Latest News"}
        </h2>
      </div>

      {/* 
        Scrollable content container for news items
        - flex-1: Takes remaining vertical space
        - overflow-y-auto: Enables vertical scrolling when content overflows
        - rounded-md: Medium rounded corners
        - border: Subtle white border with transparency
        - bg-white/5: Semi-transparent white background
        - backdrop-blur-sm: Background blur effect for glassmorphism styling
      */}
      <div className="flex-1 overflow-y-auto rounded-md border border-white/10 bg-white/5 backdrop-blur-sm">
        {/* 
          Map through newsData array to render each news item
          Uses news.id as React key for efficient re-rendering and reconciliation
        */}
        {newsData.map((news) => (
          // Individual news item container
          <div
            key={news.id}
            className="border-b border-white/10 p-3 transition-colors last:border-none hover:bg-white/5"
          >
            {/* 
              News header with title and region badge
              - flex layout with space between elements
              - items-start: Aligns items to the top (important for multi-line titles)
              - gap-2: Spacing between title and badge
            */}
            <div className="flex items-start justify-between gap-2">
              {/* News title with medium font weight and full white color */}
              <h3 className="font-medium text-white">{news.title}</h3>
              {/* 
                Region badge with dynamic background color from regionColors mapping
                - whitespace-nowrap: Prevents text wrapping to maintain badge shape
                - rounded-full: Circular/pill-shaped badge
                - px-2 py-1: Horizontal and vertical padding
                - text-xs: Extra small text size
                - text-white: White text for contrast against colored background
              */}
              <span
                className="whitespace-nowrap rounded-full px-2 py-1 text-xs text-white"
                style={{ backgroundColor: regionColors[news.region] }}
              >
                {news.region}
              </span>
            </div>

            {/* 
              News description/body text
              - mt-1: Top margin for spacing from title
              - text-sm: Small text size
              - text-white/80: White text with 80% opacity for secondary content
            */}
            <p className="mt-1 text-sm text-white/80">{news.description}</p>

            {/* 
              News footer with date and action button
              - mt-2: Top margin for spacing from description
              - flex layout with space between elements
              - items-center: Vertical centering of footer content
              - text-xs: Extra small text size
              - text-white/60: White text with 60% opacity for tertiary content
            */}
            <div className="mt-2 flex items-center justify-between text-xs text-white/60">
              {/* Publication date display */}
              <span>{news.date}</span>
              {/* 
                "Read more" action button with external link icon
                - flex items-center: For icon alignment
                - text-cyan-300: Cyan accent color
                - hover:text-cyan-200: Lighter cyan on hover for interactivity
              */}
              <button className="flex items-center text-cyan-300 hover:text-cyan-200">
                Read more 
                {/* External link icon with left margin and small dimensions */}
                <ExternalLink className="ml-1 h-3 w-3" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}