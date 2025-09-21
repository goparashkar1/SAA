import React from "react";
// Importing Lucide React icons for UI elements:
// - ExternalLink: Icon for external links/read more actions
// - TrendingUp: Icon indicating trending or popular content
import { ExternalLink, TrendingUp } from "lucide-react";

// Color scheme mapping for geographic regions
// Provides consistent color coding across the application for visual region identification
const regionColors = {
  "North America": "#8884d8",  // Purple shade for North American content
  Europe: "#82ca9d",           // Green shade for European content
  Asia: "#ffc658",             // Yellow/Orange shade for Asian content
  Africa: "#ff8042",           // Orange shade for African content
  Oceania: "#0088FE",          // Blue shade for Oceanian content
  "South America": "#00C49F"   // Teal shade for South American content
};

// NewsWidget component - displays a scrollable list of news items with regional filtering
// Props:
// - newsData: Array of news items to display
// - selectedRegion: Currently selected region filter (null shows all regions)
const NewsWidget = ({ newsData, selectedRegion }) => {
  return (
    // Main container with glassmorphism styling effects
    <div className="rounded-lg border border-white/10 bg-white/5 backdrop-blur-sm shadow p-4">
      {/* 
        Header section with icon and dynamic title
        - rounded-lg: Large rounded corners for modern appearance
        - border border-white/10: Subtle white border with 10% opacity
        - bg-white/5: Semi-transparent white background (5% opacity)
        - backdrop-blur-sm: Small background blur for glassmorphism effect
        - shadow: Subtle shadow for depth
        - p-4: Padding on all sides for content spacing
      */}
      
      {/* 
        Widget header with icon and title
        - flex items-center: Flex layout with vertical centering
        - mb-3: Margin bottom for spacing between header and content
      */}
      <div className="flex items-center mb-3">
        {/* Trending icon with emerald color and slight opacity */}
        <TrendingUp className="h-5 w-5 text-emerald-400 mr-2 opacity-90" />
        {/* 
          Dynamic title that changes based on selectedRegion prop
          - text-lg: Large text size
          - font-semibold: Semi-bold font weight for emphasis
        */}
        <h2 className="text-lg font-semibold">
          {selectedRegion ? `${selectedRegion} News` : 'Latest News'}
        </h2>
      </div>

      {/* 
        Scrollable news list container
        - h-96: Fixed height of 96 (24rem) to constrain content
        - overflow-y-auto: Enables vertical scrolling when content exceeds container height
      */}
      <div className="h-96 overflow-y-auto">
        {/* 
          Map through newsData array to render each news item
          Uses news.id as the React key for efficient re-rendering
        */}
        {newsData.map((news) => (
          // Individual news item container
          <div 
            key={news.id} 
            className="p-3 border-b border-white/10 hover:bg-white/5 transition-colors"
          >
            {/* 
              News item header with title and region badge
              - flex justify-between: Space between title and region badge
              - items-start: Align items to the top (important for multi-line titles)
            */}
            <div className="flex justify-between items-start">
              {/* News title with medium font weight and white color */}
              <h3 className="font-medium text-white">{news.title}</h3>
              {/* 
                Region badge with dynamic background color from regionColors mapping
                - text-xs: Extra small text size
                - px-2 py-1: Horizontal and vertical padding
                - rounded-full: Fully rounded corners (pill shape)
                - text-white: White text for contrast against colored background
                - ml-2: Left margin for spacing from title
                - whitespace-nowrap: Prevents text wrapping to maintain badge shape
              */}
              <span
                className="text-xs px-2 py-1 rounded-full text-white ml-2 whitespace-nowrap"
                style={{ backgroundColor: regionColors[news.region] }}
              >
                {news.region}
              </span>
            </div>

            {/* 
              News description/body text
              - text-sm: Small text size
              - text-white/80: White text with 80% opacity for secondary content
              - mt-1: Top margin for spacing from title/header
            */}
            <p className="text-sm text-white/80 mt-1">{news.description}</p>

            {/* 
              News item footer with date and action button
              - flex justify-between: Space between date and action button
              - items-center: Vertical centering of footer elements
              - mt-2: Top margin for spacing from description
            */}
            <div className="flex justify-between items-center mt-2">
              {/* 
                Publication date
                - text-xs: Extra small text size
                - text-white/60: White text with 60% opacity for tertiary content
              */}
              <span className="text-xs text-white/60">{news.date}</span>
              
              {/* 
                "Read more" action button with external link icon
                - text-xs: Extra small text size
                - text-cyan-300: Cyan color for the text (accent color)
                - flex items-center: Flex layout for icon alignment
                - hover:text-cyan-200: Lighter cyan color on hover for interactivity
              */}
              <button className="text-xs text-cyan-300 flex items-center hover:text-cyan-200">
                Read more 
                {/* External link icon with small size and left margin */}
                <ExternalLink className="h-3 w-3 ml-1" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Export the component for use in other parts of the application
export default NewsWidget;