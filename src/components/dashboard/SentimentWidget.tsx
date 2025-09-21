import React, { useMemo } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { HeartPulse } from "lucide-react";

// Static sentiment tallies per region that power the widget; the structure mirrors how the parent dashboard references regions.
const regionStatsData = {
  "North America": { positive: 28, neutral: 10, negative: 4 },
  Europe: { positive: 22, neutral: 12, negative: 4 },
  Asia: { positive: 35, neutral: 15, negative: 6 },
  Africa: { positive: 18, neutral: 9, negative: 4 },
  Oceania: { positive: 12, neutral: 5, negative: 2 },
  "South America": { positive: 16, neutral: 8, negative: 3 },
};

// Palette that pins each sentiment classification to the color rendered by the pie segments and legend tooltip.
const segmentColors = {
  positive: "#4ade80",
  neutral: "#fbbf24",
  negative: "#f87171",
};

// Visualizes the sentiment distribution for the region selected in the host dashboard; expects the parent to supply the region key.
export default function SentimentWidget({
  selectedRegion,
}: {
  selectedRegion: keyof typeof regionStatsData | null;
}) {
  // Derive the pie-friendly dataset whenever the selected region changes; null indicates no region is currently selected.
  const chartData = useMemo(() => {
    if (!selectedRegion || !regionStatsData[selectedRegion]) {
      return null;
    }

    const { positive, neutral, negative } = regionStatsData[selectedRegion];
    return [
      { name: "Positive", value: positive, fill: segmentColors.positive },
      { name: "Neutral", value: neutral, fill: segmentColors.neutral },
      { name: "Negative", value: negative, fill: segmentColors.negative },
    ];
  }, [selectedRegion]);

  return (
    // High-level column layout keeps the header and chart vertically ordered when the widget is embedded inside the dashboard card.
    <div className="flex h-full flex-col gap-4">
      {/* Section title with iconography to mirror the visual language of adjacent widgets. */}
      <div className="flex items-center">
        <HeartPulse className="mr-2 h-5 w-5 text-pink-300 opacity-90" />
        <h2 className="text-lg font-semibold">Sentiment Breakdown</h2>
      </div>

      {/* Chart area centers the visualization or the empty-state message while preserving a consistent minimum height. */}
      <div className="flex flex-1 items-center justify-center min-h-[20rem]">
        {chartData ? (
          // Responsive container allows the pie chart to scale with the parent grid cell without manual resize logic.
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={4}
              >
                {chartData.map((entry) => (
                  <Cell key={entry.name} fill={entry.fill} />
                ))}
              </Pie>
              {/* Tooltip surfaces exact counts during hover while matching the dashboard aesthetic. */}
              <Tooltip
                contentStyle={{ background: "rgba(15, 23, 42, 0.9)", borderRadius: 8, border: "1px solid rgba(255,255,255,0.15)" }}
                labelStyle={{ color: "#fff" }}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          // Empty-state guidance prompts the user to make a selection rather than showing a blank chart. 
          <p className="text-center text-sm text-white/60">
            Select a region on the globe to view sentiment analysis.
          </p>
        )}
      </div>
    </div>
  );
}
