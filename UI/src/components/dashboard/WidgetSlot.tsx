import React, { Suspense, useMemo } from "react";
import { Loader2, X, Maximize2, SlidersHorizontal } from "lucide-react";
import { widgetRegistry } from "../../widgets/registry";
import { createLightSweepVars, WIDGET_LIGHT_SWEEP_SETTINGS } from "../../ui/shimmer";
import { useDash, type Placed } from "../../store/dashboard";

const spinner = (
  <div className="flex flex-1 items-center justify-center py-10 text-cyan-300">
    <Loader2 className="h-6 w-6 animate-spin" />
  </div>
);

type WidgetSlotProps = {
  item: Placed & { runtimeProps?: Record<string, any> };
};

export default function WidgetSlot({ item }: WidgetSlotProps) {
  const closeWidget = useDash((state) => state.closeWidget);
  const config = widgetRegistry[item.widgetId];
  const sweepStyle = useMemo(() => createLightSweepVars(WIDGET_LIGHT_SWEEP_SETTINGS), []);

  if (!config) {
    return (
      <div className="rounded-lg border border-white/10 bg-white/5 p-4 text-sm text-red-300">
        Unknown widget: {item.widgetId}
      </div>
    );
  }

  const Component = useMemo(() => config.component, [config]);

  const mergedProps = useMemo(
    () => ({
      ...(item.props ?? {}),
      ...(item.runtimeProps ?? {}),
    }),
    [item.props, item.runtimeProps]
  );

  return (
    <div className="group relative flex h-full w-full">
      <div className="absolute inset-0 rounded-[18px] opacity-0 transition-opacity duration-300 ease-out group-hover:opacity-100">
        <div className="absolute inset-0 rounded-[18px] bg-gradient-to-br from-cyan-200/20 via-transparent to-transparent blur-sm" />
      </div>

      <div
        className="widget-card light-sweep-surface relative flex h-full w-full flex-col rounded-[18px] border border-white/20 bg-white/12 backdrop-blur-lg p-4 shadow-[0_14px_32px_rgba(8,18,28,0.35)] transition-all duration-300 ease-out will-change-transform group-hover:-translate-y-1 group-hover:scale-[1.01] group-hover:border-cyan-300/40 group-hover:shadow-[0_28px_60px_rgba(0,180,255,0.25)]"
        data-light-sweep="widget"
        style={sweepStyle}
      >
        <Suspense fallback={spinner}>
          <div className="flex h-full flex-col transition-[box-shadow,filter] duration-300 ease-out">
            <Component {...mergedProps} />
          </div>
        </Suspense>
      </div>

      <div className="absolute -top-3 -right-3 z-20 flex overflow-hidden rounded-xl border border-white/25 bg-[#0b1d2d]/90 backdrop-blur-md opacity-0 pointer-events-none shadow-[0_18px_40px_rgba(8,18,28,0.6)] transition-all duration-300 ease-out group-hover:opacity-100 group-hover:pointer-events-auto group-hover:-translate-y-1">
        <button
          type="button"
          className="flex h-6 w-7 items-center justify-center bg-cyan-400/70 text-white transition-colors hover:bg-cyan-300"
          aria-label={`Widget options for ${config.title} (coming soon)`}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          className="flex h-6 w-7 items-center justify-center bg-cyan-500/80 text-white transition-colors hover:bg-cyan-400"
          aria-label={`Expand ${config.title} widget (coming soon)`}
        >
          <Maximize2 className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => closeWidget(item.i)}
          className="flex h-6 w-7 items-center justify-center bg-red-500/80 text-white transition-colors hover:bg-red-500"
          aria-label={`Close ${config.title} widget`}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
