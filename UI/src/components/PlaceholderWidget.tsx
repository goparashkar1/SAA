import React from "react";

export default function PlaceholderWidget({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="w-full h-full p-4 rounded-md border border-white/10 bg-white/5 text-white/80">
      <div className="text-sm font-semibold mb-1">{title}</div>
      <div className="text-xs opacity-80">
        {description ?? "Placeholder widget. UI coming soon."}
      </div>
    </div>
  );
}
