import React from "react";
import { ExternalLink, TrendingUp, X } from "lucide-react";

const regionColors = {
  "North America": "#8884d8",
  Europe: "#82ca9d",
  Asia: "#ffc658",
  Africa: "#ff8042",
  Oceania: "#0088FE",
  "South America": "#00C49F",
};

type NewsItem = {
  id: number;
  title: string;
  region: keyof typeof regionColors;
  description: string;
  date: string;
};

type NewsWidgetProps = {
  newsData: NewsItem[];
  selectedRegion: keyof typeof regionColors | null;
  onRemove?: () => void;
};

export default function NewsWidget({ newsData, selectedRegion, onRemove }: NewsWidgetProps) {
  return (
    <div className="relative flex h-full flex-col gap-4">
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="absolute -top-2 -right-2 rounded-tr rounded-bl bg-red-500/80 px-2 py-1 text-white transition-colors hover:bg-red-500"
          aria-label="Remove news widget"
        >
          <X className="h-3 w-3" />
        </button>
      )}

      <div className="flex items-center gap-2 text-white">
        <TrendingUp className="h-5 w-5 text-emerald-400" />
        <h2 className="text-lg font-semibold">
          {selectedRegion ? `${selectedRegion} News` : "Latest News"}
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-white/12">
        {newsData.map((news) => (
          <div key={news.id} className="p-3 transition-colors hover:bg-white/10">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-medium text-white">{news.title}</h3>
              <span
                className="whitespace-nowrap rounded-full px-2 py-1 text-xs text-white"
                style={{ backgroundColor: regionColors[news.region] }}
              >
                {news.region}
              </span>
            </div>
            <p className="mt-1 text-sm text-white/80">{news.description}</p>
            <div className="mt-2 flex items-center justify-between text-xs text-white/60">
              <span>{news.date}</span>
              <button className="flex items-center text-cyan-300 hover:text-cyan-200">
                Read more
                <ExternalLink className="ml-1 h-3 w-3" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
