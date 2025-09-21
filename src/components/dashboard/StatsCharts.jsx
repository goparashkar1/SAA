import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { BarChart2 } from "lucide-react";

/**
 * MOCK DATA FOR REGIONAL STATISTICS
 * 
 * This object contains simulated data representing news statistics across different global regions.
 * Each region has:
 * - newsCount: Total number of news articles from that region
 * - positive: Count of articles with positive sentiment
 * - neutral: Count of articles with neutral sentiment
 * - negative: Count of articles with negative sentiment
 * 
 * In a real application, this data would typically come from an API or database.
 */
const regionStatsData = {
  "North America": { newsCount: 42, positive: 28, neutral: 10, negative: 4 },
  Europe: { newsCount: 38, positive: 22, neutral: 12, negative: 4 },
  Asia: { newsCount: 56, positive: 35, neutral: 15, negative: 6 },
  Africa: { newsCount: 31, positive: 18, neutral: 9, negative: 4 },
  Oceania: { newsCount: 19, positive: 12, neutral: 5, negative: 2 },
  "South America": { newsCount: 27, positive: 16, neutral: 8, negative: 3 }
};

/**
 * COLOR SCHEME FOR REGIONS
 * 
 * Defines a consistent color mapping for each region to be used across charts.
 * This ensures visual consistency when representing the same region in different visualizations.
 */
const regionColors = {
  "North America": "#8884d8",
  Europe: "#82ca9d",
  Asia: "#ffc658",
  Africa: "#ff8042",
  Oceania: "#0088FE",
  "South America": "#00C49F"
};

/**
 * STATSCHARTS COMPONENT
 * 
 * A React component that displays two data visualizations:
 * 1. A pie chart showing sentiment distribution for a selected region
 * 2. A bar chart showing news volume across all regions
 * 
 * @param {Object} props - Component properties
 * @param {string|null} props.selectedRegion - The currently selected region (from a parent component)
 */
const StatsCharts = ({ selectedRegion }) => {
  /**
   * PREPARE CHART DATA FOR THE SELECTED REGION
   * 
   * Transforms the regional data into a format suitable for the PieChart component.
   * If no region is selected, returns an empty array.
   * 
   * The sentiment values are mapped to specific colors for visual consistency:
   * - Positive: Green (#4ade80)
   * - Neutral: Amber (#fbbf24)
   * - Negative: Red (#f87171)
   */
  const chartData = selectedRegion 
    ? [
        { name: "Positive", value: regionStatsData[selectedRegion].positive, fill: "#4ade80" },
        { name: "Neutral", value: regionStatsData[selectedRegion].neutral, fill: "#fbbf24" },
        { name: "Negative", value: regionStatsData[selectedRegion].negative, fill: "#f87171" }
      ]
    : [];

  /**
   * PREPARE BAR CHART DATA
   * 
   * Transforms the regional data into a format suitable for the BarChart component.
   * Extracts the region names and their corresponding news counts for visualization.
   */
  const barChartData = Object.entries(regionStatsData).map(([region, data]) => ({
    name: region,
    News: data.newsCount,
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
      {/* 
        SENTIMENT CHART FOR SELECTED REGION 
        
        This section displays a pie chart visualizing the sentiment distribution
        (positive, neutral, negative) for the currently selected region.
        
        If no region is selected, it displays a prompt message.
      */}
      <div className="rounded-lg border border-white/10 bg-white/5 backdrop-blur-sm shadow p-4">
        <div className="flex items-center mb-3">
          <BarChart2 className="h-5 w-5 text-purple-400 mr-2 opacity-90" />
          <h2 className="text-lg font-semibold">
            {selectedRegion ? `${selectedRegion} News Sentiment` : 'Select a region to view sentiment analysis'}
          </h2>
        </div>
        <div className="h-80">
          {selectedRegion ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%" // Center X coordinate of the pie
                  cy="50%" // Center Y coordinate of the pie
                  innerRadius={60} // Creates a donut chart effect
                  outerRadius={80} // Overall size of the pie
                  fill="#8884d8"
                  paddingAngle={5} // Space between segments
                  dataKey="value" // Data property to use for segment size
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`} // Label format
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} /> // Apply custom colors to each segment
                  ))}
                </Pie>
                <Tooltip /> {/* Displays data details on hover */}
                <Legend /> {/* Shows the color mapping for each sentiment */}
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-white/60">
              Click on a region on the globe to see sentiment analysis
            </div>
          )}
        </div>
      </div>

      {/* 
        REGIONAL NEWS COUNT BAR CHART 
        
        This section displays a bar chart comparing news volume across all regions.
        It's always visible regardless of region selection.
      */}
      <div className="rounded-lg border border-white/10 bg-white/5 backdrop-blur-sm shadow p-4">
        <div className="flex items-center mb-3">
          <BarChart2 className="h-5 w-5 text-orange-400 mr-2 opacity-90" />
          <h2 className="text-lg font-semibold">News Volume by Region</h2>
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={barChartData}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" /> {/* Grid lines for better readability */}
              <XAxis dataKey="name" /> {/* Region names on the X-axis */}
              <YAxis /> {/* News count values on the Y-axis */}
              <Tooltip /> {/* Displays precise values on hover */}
              <Legend /> {/* Explains what the bar represents */}
              <Bar dataKey="News" fill="#8884d8" /> {/* The actual bars in the chart */}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default StatsCharts;