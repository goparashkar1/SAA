import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import * as Icons from "lucide-react";
import {
  widgetRegistry,
  type WidgetId,
  type WidgetGroup,
  type WidgetMeta,
} from "../../widgets/registry";
import { useDash } from "../../store/dashboard";
import SaveLayoutModal from "../layouts/SaveLayoutModal";
import LoadLayoutModal from "../layouts/LoadLayoutModal";
import ManageLayoutsModal from "../layouts/ManageLayoutsModal";
import ManageDashboardsModal from "./ManageDashboardsModal";
import ImportWorkspaceModal from "./ImportWorkspaceModal";
import { serializeLayout } from "../../lib/layouts/serialize";
import type { PlacedWidget } from "../../lib/layouts/types";

type SectionKey = "add" | "layouts" | "dashboards";

const Modal: React.FC<{ title: string; onClose: () => void; children: React.ReactNode }> = ({
  title,
  onClose,
  children,
}) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
    <div className="w-full max-w-lg rounded-lg border border-white/10 bg-slate-900/95 p-4 text-white shadow-xl">
      <div className="mb-3 flex items-start justify-between">
        <h2 className="text-lg font-semibold">{title}</h2>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md bg-white/10 p-1 text-white transition-colors hover:bg-white/20"
          aria-label="Close dialog"
        >
          <Icons.X className="h-4 w-4" />
        </button>
      </div>
      {children}
    </div>
  </div>
);

export default function WidgetPalette() {
  const addWidget = useDash((state) => state.addWidget);
  const importLayoutFromFile = useDash((state) => state.importLayoutFromFile);
  const exportWorkspace = useDash((state) => state.exportWorkspace);
  const layout = useDash((state) => state.layout);

  const [menuOpen, setMenuOpen] = useState(false);
  const [expandedSection, setExpandedSection] = useState<SectionKey | null>("add");

  const [isAddOpen, setAddOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<WidgetId[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  const [isSaveOpen, setSaveOpen] = useState(false);
  const [isLoadOpen, setLoadOpen] = useState(false);
  const [isManageLayoutsOpen, setManageLayoutsOpen] = useState(false);
  const [isManageDashboardsOpen, setManageDashboardsOpen] = useState(false);
  const [isImportWorkspaceOpen, setImportWorkspaceOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

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
          ? items.filter(([, meta]) => meta.title.toLowerCase().includes(searchValue))
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

  const handleOpenModal = useCallback(() => {
    setSelectedIds([]);
    setAddOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setSelectedIds([]);
    setAddOpen(false);
  }, []);

  const toggleSelection = useCallback((id: WidgetId) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((entry) => entry !== id) : [...prev, id]
    );
  }, []);

  const handleAddSelected = useCallback(() => {
    if (!selectedIds.length) return;
    selectedIds.forEach((id) => addWidget(id));
    setSelectedIds([]);
    setAddOpen(false);
  }, [addWidget, selectedIds]);

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

  const closeMenu = useCallback(() => {
    setMenuOpen(false);
  }, []);

  const openMenuWithSection = useCallback(
    (section: SectionKey) => {
      setMenuOpen(true);
      setExpandedSection(section);
    },
    []
  );

  useEffect(() => {
    if (!menuOpen) return;
    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        closeMenu();
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeMenu();
      }
    };
    document.addEventListener("mousedown", handlePointerDown, true);
    document.addEventListener("touchstart", handlePointerDown, true);
    document.addEventListener("keydown", handleKeyDown, true);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown, true);
      document.removeEventListener("touchstart", handlePointerDown, true);
      document.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [closeMenu, menuOpen]);

  const triggerLayoutImport = useCallback(() => {
    closeMenu();
    requestAnimationFrame(() => {
      fileInputRef.current?.click();
    });
  }, [closeMenu]);

  const launchAddWidgets = useCallback(() => {
    closeMenu();
    handleOpenModal();
  }, [closeMenu, handleOpenModal]);

  const openSaveLayouts = useCallback(() => {
    closeMenu();
    setSaveOpen(true);
  }, [closeMenu]);

  const openLoadLayouts = useCallback(() => {
    closeMenu();
    setLoadOpen(true);
  }, [closeMenu]);

  const openManageLayouts = useCallback(() => {
    closeMenu();
    setManageLayoutsOpen(true);
  }, [closeMenu]);

  const openManageDashboards = useCallback(() => {
    closeMenu();
    setManageDashboardsOpen(true);
  }, [closeMenu]);

  const openImportWorkspace = useCallback(() => {
    closeMenu();
    setImportWorkspaceOpen(true);
  }, [closeMenu]);

  const exportWorkspaceNow = useCallback(async () => {
    closeMenu();
    await exportWorkspace();
  }, [closeMenu, exportWorkspace]);

  const toggleSection = useCallback((section: SectionKey) => {
    setExpandedSection((prev) => (prev === section ? null : section));
  }, []);

  const Section: React.FC<{
    id: SectionKey;
    icon: React.ComponentType<Icons.LucideProps>;
    label: string;
    description?: string;
    children: React.ReactNode;
  }> = ({ id, icon: Icon, label, description, children }) => {
    const open = expandedSection === id;
    return (
      <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
        <button
          type="button"
          onClick={() => toggleSection(id)}
          className="flex w-full items-center justify-between gap-2 text-left text-white/90 transition-colors hover:text-white"
        >
          <span className="flex items-center gap-2">
            <Icon className="h-4 w-4" />
            {label}
          </span>
          <Icons.ChevronDown
            className={
              "h-4 w-4 shrink-0 transition-transform duration-300 " +
              (open ? "rotate-180" : "rotate-0")
            }
          />
        </button>
        {open && description ? (
          <p className="mt-1 text-xs text-white/60">{description}</p>
        ) : null}
        <div
          className={
            "grid overflow-hidden transition-all duration-300 ease-out " +
            (open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0")
          }
        >
          <div className="overflow-hidden pt-2">{children}</div>
        </div>
      </div>
    );
  };

  return (
    <div ref={menuRef} className="relative flex flex-wrap items-center gap-2 md:gap-3">
      <div className="inline-flex overflow-hidden rounded-md border border-white/10 bg-white/5 text-sm text-white shadow-sm">
        <button
          type="button"
          onClick={() => openMenuWithSection("add")}
          className="flex items-center gap-2 px-3 py-2 transition-colors hover:bg-white/10"
        >
          <Icons.Sparkles className="h-4 w-4" /> Manage Workspace
        </button>
        <div className="h-full w-px bg-white/10" />
        <button
          type="button"
          onClick={() => {
            setMenuOpen((prev) => {
              const next = !prev;
              if (next) {
                setExpandedSection((current) => current ?? "add");
              }
              return next;
            });
          }}
          className="px-2 py-2 transition-colors hover:bg-white/10"
          aria-label="Toggle workspace menu"
        >
          <Icons.ChevronDown
            className={
              "h-4 w-4 transition-transform duration-200 " +
              (menuOpen ? "rotate-180" : "rotate-0")
            }
          />
        </button>
      </div>

      {menuOpen && (
        <div className="absolute right-0 top-full z-40 mt-2 w-80 origin-top-right rounded-xl border border-white/10 bg-slate-900/95 p-3 text-sm text-white shadow-[0_18px_60px_rgba(3,16,32,0.55)] transition-all duration-200 ease-out">
          <div className="space-y-3">
            <Section
              id="add"
              icon={Icons.Plus}
              label="Add Widgets"
              description="Open the widget library to enrich this dashboard."
            >
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={launchAddWidgets}
                  className="inline-flex items-center justify-center gap-2 rounded-md border border-white/10 bg-cyan-500/20 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-cyan-500/30"
                >
                  <Icons.LayoutGrid className="h-4 w-4" /> Launch widget library
                </button>
                <p className="text-[11px] text-white/50">
                  Select multiple widgets and drop them in together.
                </p>
              </div>
            </Section>

            <Section
              id="layouts"
              icon={Icons.SquareStack}
              label="Layouts"
              description="Capture, reuse, or exchange layout presets."
            >
              <div className="flex flex-col gap-1.5">
                <button
                  type="button"
                  onClick={openSaveLayouts}
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-left transition-colors hover:bg-white/10"
                >
                  <Icons.Save className="h-4 w-4" /> Save as
                </button>
                <button
                  type="button"
                  onClick={openLoadLayouts}
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-left transition-colors hover:bg-white/10"
                >
                  <Icons.DownloadCloud className="h-4 w-4" /> Load
                </button>
                <button
                  type="button"
                  onClick={openManageLayouts}
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-left transition-colors hover:bg-white/10"
                >
                  <Icons.Settings className="h-4 w-4" /> Manage
                </button>
                <div className="my-1 border-t border-white/10" />
                <button
                  type="button"
                  onClick={() => {
                    closeMenu();
                    handleExportCurrent();
                  }}
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-left transition-colors hover:bg-white/10"
                >
                  <Icons.Upload className="h-4 w-4" /> Export current
                </button>
                <button
                  type="button"
                  onClick={triggerLayoutImport}
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-left transition-colors hover:bg-white/10"
                >
                  <Icons.Download className="h-4 w-4" /> Import
                </button>
              </div>
            </Section>

            <Section
              id="dashboards"
              icon={Icons.LayoutGrid}
              label="Dashboards"
              description="Manage or exchange full workspace configurations."
            >
              <div className="flex flex-col gap-1.5">
                <button
                  type="button"
                  onClick={openManageDashboards}
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-left transition-colors hover:bg-white/10"
                >
                  <Icons.SlidersHorizontal className="h-4 w-4" /> Manage dashboards
                </button>
                <button
                  type="button"
                  onClick={exportWorkspaceNow}
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-left transition-colors hover:bg-white/10"
                >
                  <Icons.Upload className="h-4 w-4" /> Export workspace
                </button>
                <button
                  type="button"
                  onClick={openImportWorkspace}
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-left transition-colors hover:bg-white/10"
                >
                  <Icons.Download className="h-4 w-4" /> Import workspace
                </button>
              </div>
            </Section>
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="application/json"
        onChange={handleImportChange}
        className="hidden"
      />

      {isAddOpen && (
        <Modal title="Add widget" onClose={handleCloseModal}>
          <div className="space-y-3">
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
                    No widgets match "{searchTerm}".
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-3 border-t border-white/10 pt-3 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-xs text-white/60">
                {selectedIds.length
                  ? `${selectedIds.length} widget${selectedIds.length > 1 ? "s" : ""} selected`
                  : "Select one or more widgets to add them together."}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white transition-colors hover:bg-white/10"
                >
                  Cancel
                </button>
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

      <SaveLayoutModal isOpen={isSaveOpen} onClose={() => setSaveOpen(false)} />
      <LoadLayoutModal isOpen={isLoadOpen} onClose={() => setLoadOpen(false)} />
      <ManageLayoutsModal
        isOpen={isManageLayoutsOpen}
        onClose={() => setManageLayoutsOpen(false)}
      />
      <ManageDashboardsModal
        isOpen={isManageDashboardsOpen}
        onClose={() => setManageDashboardsOpen(false)}
      />
      <ImportWorkspaceModal
        isOpen={isImportWorkspaceOpen}
        onClose={() => setImportWorkspaceOpen(false)}
      />
    </div>
  );
}

