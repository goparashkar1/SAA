import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { BarChart2 } from "lucide-react";

const regionStatsData = {
  "North America": { newsCount: 42, positive: 28, neutral: 10, negative: 4 },
  Europe: { newsCount: 38, positive: 22, neutral: 12, negative: 4 },
  Asia: { newsCount: 56, positive: 35, neutral: 15, negative: 6 },
  Africa: { newsCount: 31, positive: 18, neutral: 9, negative: 4 },
  Oceania: { newsCount: 19, positive: 12, neutral: 5, negative: 2 },
  "South America": { newsCount: 27, positive: 16, neutral: 8, negative: 3 },
};

const regionColors = {
  "North America": "#8884d8",
  Europe: "#82ca9d",
  Asia: "#ffc658",
  Africa: "#ff8042",
  Oceania: "#0088FE",
  "South America": "#00C49F",
};

const StatsCharts = ({ selectedRegion }) => {
  const chartData = selectedRegion
    ? [
        { name: "Positive", value: regionStatsData[selectedRegion].positive, fill: "#4ade80" },
        { name: "Neutral", value: regionStatsData[selectedRegion].neutral, fill: "#fbbf24" },
        { name: "Negative", value: regionStatsData[selectedRegion].negative, fill: "#f87171" },
      ]
    : [];

  const barChartData = Object.entries(regionStatsData).map(([region, data]) => ({
    name: region,
    News: data.newsCount,
  }));

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <section className="flex flex-col gap-3">
        <header className="flex items-center gap-2">
          <BarChart2 className="h-5 w-5 text-purple-400" />
          <h2 className="text-lg font-semibold">
            {selectedRegion ? `${selectedRegion} News Sentiment` : "Select a region to view sentiment analysis"}
          </h2>
        </header>
        <div className="h-80">
          {selectedRegion ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-white/60">
              Click on a region on the globe to see sentiment analysis
            </div>
          )}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <header className="flex items-center gap-2">
          <BarChart2 className="h-5 w-5 text-orange-400" />
          <h2 className="text-lg font-semibold">News Volume by Region</h2>
        </header>
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
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="News" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
};

export default StatsCharts;
