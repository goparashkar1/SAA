// Importing React library to define React components
import React from "react";
// Importing necessary components from recharts library for building bar charts
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
// Importing BarChart2 icon from lucide-react for the widget header
import { BarChart2 } from "lucide-react";

// Static data object containing news count statistics by region
// Each key represents a region and contains an object with newsCount
const regionStatsData = {
  "North America": { newsCount: 42 },
  Europe: { newsCount: 38 },
  Asia: { newsCount: 56 },
  Africa: { newsCount: 31 },
  Oceania: { newsCount: 19 },
  "South America": { newsCount: 27 },
};

// Transforming the regionStatsData object into an array format suitable for recharts
// Each array element becomes an object with 'name' (region) and 'News' (newsCount) properties
const barChartData = Object.entries(regionStatsData).map(([region, data]) => ({
  name: region,
  News: data.newsCount,
}));

// Main component definition for the statistics widget
export default function StatsWidget() {
  return (
    // Container div with flex column layout that fills available height
    <div className="flex h-full flex-col gap-4">
      {/* Header section containing icon and title */}
      <div className="flex items-center">
        {/* Bar chart icon with specific styling */}
        <BarChart2 className="mr-2 h-5 w-5 text-orange-400 opacity-90" />
        {/* Widget title */}
        <h2 className="text-lg font-semibold">News Volume by Region</h2>
      </div>
      
      {/* Chart container with responsive sizing and minimum height constraint */}
      <div className="flex-1 min-h-[20rem]">
        {/* ResponsiveContainer ensures the chart adapts to parent container size */}
        <ResponsiveContainer width="100%" height="100%">
          {/* BarChart component with data and margin configuration */}
          <BarChart
            data={barChartData}  // The transformed data array
            margin={{ top: 5, right: 30, left: 0, bottom: 5 }}  // Chart margins
          >
            {/* Grid lines with dashed pattern and custom color */}
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff22" />
            
            {/* X-axis configuration displaying region names */}
            <XAxis 
              dataKey="name"  // Data property to use for axis labels
              stroke="#ffffff99"  // Axis line color
              tick={{ fill: "#ffffff99", fontSize: 11 }}  // Tick styling
            />
            
            {/* Y-axis configuration displaying news count values */}
            <YAxis 
              stroke="#ffffff99"  // Axis line color
              tick={{ fill: "#ffffff99", fontSize: 11 }}  // Tick styling
            />
            
            {/* Tooltip configuration that appears on hover */}
            <Tooltip
              contentStyle={{ 
                background: "rgba(15, 23, 42, 0.9)",  // Dark semi-transparent background
                borderRadius: 8,  // Rounded corners
                border: "1px solid rgba(255,255,255,0.15)"  // Subtle border
              }}
              labelStyle={{ color: "#fff" }}  // Text color for tooltip labels
            />
            
            {/* Bar element representing the news data */}
            <Bar 
              dataKey="News"  // Data property to visualize
              fill="#38bdf8"  // Blue fill color for bars
              radius={[4, 4, 0, 0]}  // Rounded top corners only (top-left, top-right, bottom-right, bottom-left)
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}