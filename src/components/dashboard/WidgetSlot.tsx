// Importing React and necessary hooks for component lazy loading and memoization
import React, { Suspense, useMemo } from "react";
// Importing specific icons from lucide-react for loading spinner and close button
import { Loader2, X } from "lucide-react";
// Importing widget registry to access widget configuration data
import { widgetRegistry } from "../../widgets/registry";
// Importing custom dashboard hook and type definition for placed widgets
import { useDash, type Placed } from "../../store/dashboard";

// Loading spinner component shown while widgets are being lazy-loaded
// Uses a spinning Loader2 icon with cyan color for visual consistency
const spinner = (
  <div className="flex flex-1 items-center justify-center py-10 text-cyan-300">
    <Loader2 className="h-6 w-6 animate-spin" />
  </div>
);

// Type definition for WidgetSlot component props
// Expects an item object that conforms to the Placed type with optional runtimeProps
type WidgetSlotProps = {
  item: Placed & { runtimeProps?: Record<string, any> };
};

// Main WidgetSlot component that renders individual widget instances
export default function WidgetSlot({ item }: WidgetSlotProps) {
  // Accessing the closeWidget function from the dashboard store to remove widgets
  const closeWidget = useDash((state) => state.closeWidget);
  
  // Retrieving widget configuration from the registry using the widgetId
  const config = widgetRegistry[item.widgetId];

  // Error handling for unknown widget IDs
  // Displays an error message if the widget configuration is not found in the registry
  if (!config) {
    return (
      <div className="rounded-lg border border-white/10 bg-white/5 p-4 text-sm text-red-300">
        Unknown widget: {item.widgetId}
      </div>
    );
  }

  // Memoized lazy loading of the widget component using React.lazy()
  // This ensures the component import only happens once and is cached for performance
  const Component = useMemo(() => config.component, [config]);

  const mergedProps = useMemo(
    () => ({
      ...(item.props ?? {}),        // Spread static props from widget configuration
      ...(item.runtimeProps ?? {}), // Spread runtime props passed to the component
    }),
    [item.props, item.runtimeProps] // Dependencies for the memoization
  );

  return (
    // Container for the widget with styling for glassmorphism effect
    <div className="relative flex h-full flex-col rounded-lg border border-white/10 bg-white/5 backdrop-blur-sm shadow p-4">
      {/* Close button positioned absolutely in the top-right corner */}
      <button
        type="button"
        onClick={() => closeWidget(item.i)} // Calls closeWidget with the widget's unique identifier
        className="absolute -top-2 -right-2 rounded-tr rounded-bl bg-red-500/80 px-2 py-1 text-white transition-colors hover:bg-red-500"
        aria-label={"Close " + config.title + " widget"} // Accessibility label describing the button action
      >
        <X className="h-3 w-3" /> {/* Close icon */}
      </button>

      {/* React Suspense boundary for handling lazy loading */}
      <Suspense fallback={spinner}> {/* Shows spinner while widget component is loading */}
        {/* Container to ensure the widget fills available space */}
        <div className="flex h-full flex-col">
          {/* Render the widget component (may be lazy) with merged props */}
          <Component {...mergedProps} />
        </div>
      </Suspense>
    </div>
  );
}
