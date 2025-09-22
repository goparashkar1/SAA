// Importing React and necessary hooks for state management and performance optimization
import React, { useCallback, useMemo, useRef, useState } from "react";
import * as Icons from "lucide-react";
import {
  widgetRegistry,
  type WidgetId,
  type WidgetGroup,
  type WidgetMeta,
} from "../../widgets/registry";
// Importing custom hook to access dashboard state management functions
import { useDash } from "../../store/dashboard";
import SaveLayoutModal from "../layouts/SaveLayoutModal";
import LoadLayoutModal from "../layouts/LoadLayoutModal";
import ManageLayoutsModal from "../layouts/ManageLayoutsModal";
import { serializeLayout } from "../../lib/layouts/serialize";
import type { PlacedWidget } from "../../lib/layouts/types";

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
  const importLayoutFromFile = useDash((state) => state.importLayoutFromFile);
  const layout = useDash((state) => state.layout);

  // State management for modal visibility and selected widget IDs
  const [isAddOpen, setAddOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<WidgetId[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [layoutsMenuOpen, setLayoutsMenuOpen] = useState(false);
  const [isSaveOpen, setSaveOpen] = useState(false);
  const [isLoadOpen, setLoadOpen] = useState(false);
  const [isManageOpen, setManageOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const groupedEntries = useMemo(() => {
    const entries = Object.entries(widgetRegistry) as Array<[
      WidgetId,
      WidgetMeta
    ]>;
    const map = new Map<WidgetGroup, Array<[WidgetId, WidgetMeta]>>();
    for (const entry of entries) {
      const [id, meta] = entry;
      const groupEntries = map.get(meta.group) ?? [];
      groupEntries.push([id, meta]);
      map.set(meta.group, groupEntries);
    }
    return Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([group, items]) => [
        group,
        items.sort((a, b) => a[1].title.localeCompare(b[1].title)),
      ] as [WidgetGroup, Array<[WidgetId, WidgetMeta]>]);
  }, []);

  const [collapsedGroups, setCollapsedGroups] = useState<Partial<Record<WidgetGroup, boolean>>>({});
  const searchValue = searchTerm.trim().toLowerCase();

  const filteredGroups = useMemo(() => {
    return groupedEntries
      .map(([group, items]) => {
        const visibleItems = searchValue
          ? items.filter(([, meta]) =>
              meta.title.toLowerCase().includes(searchValue)
            )
          : items;
        return [group, visibleItems] as [WidgetGroup, Array<[WidgetId, WidgetMeta]>];
      })
      .filter(([, items]) => items.length > 0);
  }, [groupedEntries, searchValue]);

  const toggleGroup = useCallback((group: WidgetGroup) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [group]: !prev[group],
    }));
  }, []);

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

  const currentSnapshot: PlacedWidget[] = useMemo(
    () =>
      layout
        .slice()
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        .map((item, idx) => ({
          id: item.widgetId,
          instanceId: item.instanceId ?? item.i,
          title: item.title,
          props: item.props ?? {},
          order: item.order ?? idx,
          x: item.x,
          y: item.y,
          w: item.w,
          h: item.h,
        })),
    [layout]
  );

  const handleExportCurrent = useCallback(() => {
    const defaultName = `dashboard-${new Date().toISOString().slice(0, 19)}`;
    const name = window.prompt("Export current layout as:", defaultName);
    if (!name) return;
    const payload = serializeLayout(name, currentSnapshot);
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${name}.micr_layout.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }, [currentSnapshot]);

  const handleImportClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleImportChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
      try {
        const importedName = await importLayoutFromFile(file, false);
        window.alert(
          importedName
            ? `Imported layout "${importedName}"`
            : `Imported layout from ${file.name}`
        );
      } catch (err) {
        console.warn(err);
        const message = err instanceof Error ? err.message : "";
        if (message === "UNSUPPORTED_VERSION") {
          window.alert("Layout file version not supported.");
        } else {
          window.alert("Failed to import layout. Check the file format.");
        }
      } finally {
        event.target.value = "";
      }
    },
    [importLayoutFromFile]
  );

  return (
    <div className="flex flex-wrap items-center gap-3">
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

      <div className="relative">
        <button
          type="button"
          onClick={() => setLayoutsMenuOpen((prev) => !prev)}
          className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-white/10"
        >
          <Icons.LayoutGrid className="h-4 w-4" /> Layouts
          <Icons.ChevronDown
            className={
              "h-4 w-4 transition-transform " +
              (layoutsMenuOpen ? "rotate-180" : "rotate-0")
            }
          />
        </button>
        {layoutsMenuOpen && (
          <div className="absolute z-40 mt-2 w-56 rounded-md border border-white/10 bg-slate-900/95 py-2 text-sm shadow-xl">
            <button
              type="button"
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-white/90 hover:bg-white/10"
              onClick={() => {
                setLayoutsMenuOpen(false);
                setSaveOpen(true);
              }}
            >
              <Icons.Save className="h-4 w-4" /> Save as…
            </button>
            <button
              type="button"
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-white/90 hover:bg-white/10"
              onClick={() => {
                setLayoutsMenuOpen(false);
                setLoadOpen(true);
              }}
            >
              <Icons.DownloadCloud className="h-4 w-4" /> Load…
            </button>
            <button
              type="button"
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-white/90 hover:bg-white/10"
              onClick={() => {
                setLayoutsMenuOpen(false);
                setManageOpen(true);
              }}
            >
              <Icons.Settings className="h-4 w-4" /> Manage…
            </button>
            <div className="my-1 border-t border-white/10" />
            <button
              type="button"
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-white/90 hover:bg-white/10"
              onClick={() => {
                setLayoutsMenuOpen(false);
                handleExportCurrent();
              }}
            >
              <Icons.Download className="h-4 w-4" /> Export current…
            </button>
            <button
              type="button"
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-white/90 hover:bg-white/10"
              onClick={() => {
                setLayoutsMenuOpen(false);
                handleImportClick();
              }}
            >
              <Icons.Upload className="h-4 w-4" /> Import…
            </button>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="application/json"
        onChange={handleImportChange}
        className="hidden"
      />

      {/* Conditionally render the modal when isAddOpen is true */}
      {isAddOpen && (
        <Modal title="Add widget" onClose={handleCloseModal}>
          <div className="space-y-3">
            {/* Grid layout for displaying available widgets */}
            <div className="flex flex-col gap-2">
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search widgets"
                className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-cyan-400 focus:outline-none"
              />
              <div className="flex flex-col gap-3 max-h-[420px] overflow-y-auto pr-1">
                {filteredGroups.map(([group, items]) => {
                  const isCollapsed = searchValue
                    ? false
                    : collapsedGroups[group] ?? false;
                  return (
                    <div key={group} className="rounded-md border border-white/10 bg-white/5">
                      <button
                        type="button"
                        onClick={() => toggleGroup(group)}
                      className="flex w-full items-center justify-between px-3 py-2 text-left text-sm font-semibold text-white transition-colors hover:bg-white/10"
                      aria-expanded={!isCollapsed}
                    >
                      <span>{group}</span>
                      <Icons.ChevronDown
                        className={
                          "h-4 w-4 transition-transform " +
                          (isCollapsed ? "rotate-90" : "rotate-0")
                        }
                      />
                    </button>
                    {!isCollapsed && (
                      <div className="flex flex-col divide-y divide-white/5">
                        {items.map(([id, config]) => {
                          const Icon = config.icon ?? Icons.LayoutGrid;
                          const isSelected = selectedIds.includes(id);
                          return (
                            <button
                              key={id}
                              type="button"
                              onClick={() => toggleSelection(id)}
                              className={
                                "flex items-center justify-between px-3 py-2 text-left text-sm transition-colors " +
                                (isSelected
                                  ? "bg-cyan-500/15 text-white"
                                  : "hover:bg-white/10 text-white/90")
                              }
                              aria-pressed={isSelected}
                            >
                              <span className="flex items-center gap-2">
                                <Icon className="h-4 w-4" />
                                <span className="flex flex-col">
                                  <span>{config.title}</span>
                                  {config.disabled && (
                                    <span className="text-[10px] uppercase tracking-wide text-white/60">
                                      Placeholder
                                    </span>
                                  )}
                                </span>
                              </span>
                              {isSelected ? (
                                <Icons.Check className="h-4 w-4 text-cyan-300" />
                              ) : (
                                <Icons.Plus className="h-4 w-4 text-white/60" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  );
                })}
                {filteredGroups.length === 0 && searchValue && (
                  <div className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/60">
                    No widgets match “{searchTerm}”.
                  </div>
                )}
              </div>
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

      <SaveLayoutModal
        isOpen={isSaveOpen}
        onClose={() => setSaveOpen(false)}
      />
      <LoadLayoutModal
        isOpen={isLoadOpen}
        onClose={() => setLoadOpen(false)}
      />
      <ManageLayoutsModal
        isOpen={isManageOpen}
        onClose={() => setManageOpen(false)}
      />
    </div>
  );
}
