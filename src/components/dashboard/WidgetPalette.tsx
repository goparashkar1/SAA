// Importing React and necessary hooks for state management and performance optimization
import React, { useCallback, useMemo, useState } from "react";
// Importing all icons from lucide-react library for dynamic icon rendering
import * as Icons from "lucide-react";
// Importing widget registry and type definition for widget identification
import { widgetRegistry, type WidgetId } from "../../widgets/registry";
// Importing custom hook to access dashboard state management functions
import { useDash } from "../../store/dashboard";

// Creating a lookup table to map icon names from the registry to actual Lucide React components
// This enables dynamic rendering of icons based on string identifiers stored in the registry
const iconLookup = Icons as Record<string, React.ComponentType<{ className?: string }>>;

// Modal component definition for displaying overlay content
// Reusable modal wrapper with title, close functionality, and content area
const Modal: React.FC<{ title: string; onClose: () => void; children: React.ReactNode }> = ({
  title,
  onClose,
  children,
}) => {
  return (
    // Full-screen backdrop with semi-transparent black background
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      {/* Modal container with styling for dark theme */}
      <div className="w-full max-w-lg rounded-lg border border-white/10 bg-slate-900/95 p-4 text-white shadow-xl">
        {/* Modal header with title and close button */}
        <div className="mb-3 flex items-start justify-between">
          <h2 className="text-lg font-semibold">{title}</h2>
          {/* Close button with hover effects and accessibility label */}
          <button
            type="button"
            onClick={onClose}
            className="rounded-md bg-white/10 p-1 text-white transition-colors hover:bg-white/20"
            aria-label="Close dialog"
          >
            <Icons.X className="h-4 w-4" />
          </button>
        </div>
        {/* Modal content area */}
        {children}
      </div>
    </div>
  );
};

// Main WidgetPalette component that provides interface for adding widgets and resetting dashboard
export default function WidgetPalette() {
  // Accessing dashboard state management functions from the store
  const addWidget = useDash((state) => state.addWidget);
  const reset = useDash((state) => state.reset);

  // State management for modal visibility and selected widget IDs
  const [isAddOpen, setAddOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<WidgetId[]>([]);

  // Memoized transformation of widget registry into array format for efficient rendering
  // This optimization prevents unnecessary recalculations on each render
  const registryEntries = useMemo(
    () => Object.entries(widgetRegistry) as Array<[WidgetId, typeof widgetRegistry[WidgetId]]>,
    [] // Empty dependency array ensures this only runs once
  );

  // Callback function to open the modal and reset selection state
  const handleOpenModal = useCallback(() => {
    setSelectedIds([]);
    setAddOpen(true);
  }, []);

  // Callback function to close the modal and reset selection state
  const handleCloseModal = useCallback(() => {
    setSelectedIds([]);
    setAddOpen(false);
  }, []);

  // Callback function to toggle selection of a widget ID
  // Adds the ID if not selected, removes it if already selected
  const toggleSelection = useCallback((id: WidgetId) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((entry) => entry !== id) : [...prev, id]
    );
  }, []);

  // Callback function to add all selected widgets to the dashboard
  // Closes the modal after adding the widgets
  const handleAddSelected = useCallback(() => {
    if (!selectedIds.length) return; // Early return if no widgets selected
    selectedIds.forEach((id) => addWidget(id)); // Add each selected widget
    setSelectedIds([]); // Reset selection state
    setAddOpen(false); // Close the modal
  }, [addWidget, selectedIds]); // Dependencies for the callback

  return (
    <div className="flex flex-wrap gap-3">
      {/* Button to open the widget addition modal */}
      <button
        type="button"
        onClick={handleOpenModal}
        className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-white/10"
      >
        <Icons.Plus className="h-4 w-4" /> Add widget
      </button>

      {/* Button to reset the dashboard to its default state */}
      <button
        type="button"
        onClick={() => reset()}
        className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-white/10"
      >
        <Icons.RotateCcw className="h-4 w-4" /> Reset
      </button>

      {/* Conditionally render the modal when isAddOpen is true */}
      {isAddOpen && (
        <Modal title="Add widget" onClose={handleCloseModal}>
          <div className="space-y-3">
            {/* Grid layout for displaying available widgets */}
            <div className="grid grid-cols-1 gap-2">
              {registryEntries.map(([id, config]) => {
                // Determine the appropriate icon component for this widget
                const Icon = iconLookup[config.icon] ?? Icons.LayoutGrid;
                // Check if this widget is currently selected
                const isSelected = selectedIds.includes(id);
                return (
                  // Button for each widget that toggles its selection state
                  <button
                    key={id}
                    type="button"
                    onClick={() => toggleSelection(id)}
                    className={
                      "flex items-center justify-between rounded-md border px-3 py-2 text-left text-sm transition-colors " +
                      (isSelected
                        ? "border-cyan-300/60 bg-cyan-500/15 text-white" // Selected state styling
                        : "border-white/10 bg-white/5 hover:bg-white/10 text-white") // Default state styling
                    }
                    aria-pressed={isSelected} // Accessibility attribute for selection state
                  >
                    <span className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      {config.name} {/* Display name from widget config */}
                    </span>
                    {/* Show checkmark for selected widgets, plus icon for unselected */}
                    {isSelected ? (
                      <Icons.Check className="h-4 w-4 text-cyan-300" />
                    ) : (
                      <Icons.Plus className="h-4 w-4 text-white/80" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Footer section with selection count and action buttons */}
            <div className="flex flex-col gap-3 border-t border-white/10 pt-3 sm:flex-row sm:items-center sm:justify-between">
              {/* Display count of selected widgets or prompt message */}
              <span className="text-xs text-white/60">
                {selectedIds.length
                  ? `${selectedIds.length} widget${selectedIds.length > 1 ? "s" : ""} selected`
                  : "Select one or more widgets to add them together."}
              </span>
              <div className="flex gap-2">
                {/* Cancel button to close the modal without adding widgets */}
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white transition-colors hover:bg-white/10"
                >
                  Cancel
                </button>
                {/* Add selected button (disabled when no widgets are selected) */}
                <button
                  type="button"
                  onClick={handleAddSelected}
                  disabled={selectedIds.length === 0}
                  className="rounded-md bg-cyan-500 px-3 py-2 text-sm font-medium text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Add selected
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}