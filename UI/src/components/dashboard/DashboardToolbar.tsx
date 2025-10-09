import React from "react";
import WidgetPalette from "./WidgetPalette";

export default function DashboardToolbar() {
  return (
    <div className="flex flex-wrap items-center justify-end gap-2 md:gap-3">
      <WidgetPalette />
    </div>
  );
}
