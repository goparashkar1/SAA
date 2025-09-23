import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { widgetRegistry, type WidgetId } from "../widgets/registry";
import {
  createLocalLayoutRepo,
  type LayoutRepo,
} from "../lib/layouts/layoutRepo";
import { serializeLayout, applyLayout } from "../lib/layouts/serialize";
import type {
  DashboardLayout,
  LayoutMeta,
  PlacedWidget,
} from "../lib/layouts/types";
import {
  createLocalWorkspaceRepo,
  loadWorkspaceSynchronously,
  type WorkspaceRepo,
} from "../lib/workspace/workspaceRepo";
import {
  cloneDashboard,
  newDashboard,
  now as isoNow,
  sanitizeWorkspace as sanitizeWorkspaceDoc,
} from "../lib/workspace/serialize";
import type { WorkspaceDoc, WidgetItem } from "../lib/workspace/types";

export type Placed = {
  i: string;
  widgetId: WidgetId;
  x: number;
  y: number;
  w: number;
  h: number;
  props?: Record<string, any>;
  closed?: boolean;
  instanceId: string;
  order: number;
  title?: string;
};

interface DashboardState {
  layout: Placed[];
  workspace: WorkspaceDoc;
  layoutsRepo: LayoutRepo;
  workspaceRepo: WorkspaceRepo;
  addWidget: (widgetId: WidgetId) => void;
  closeWidget: (i: string) => void;
  reopenWidget: (i: string) => void;
  importLayout: (items: Placed[]) => void;
  listLayouts: () => Promise<LayoutMeta[]>;
  saveLayoutAs: (name: string, overwrite?: boolean) => Promise<void>;
  loadLayout: (name: string, mode: "replace" | "append") => Promise<void>;
  deleteLayout: (name: string) => Promise<void>;
  renameLayout: (oldName: string, newName: string) => Promise<void>;
  exportLayout: (name: string) => Promise<void>;
  importLayoutFromFile: (
    file: File,
    overwrite?: boolean
  ) => Promise<string | null>;
  setActiveDashboard: (id: string) => void;
  addDashboard: (name?: string) => void;
  renameDashboard: (id: string, name: string) => void;
  deleteDashboard: (id: string) => void;
  duplicateDashboard: (id: string) => void;
  loadWorkspace: () => Promise<void>;
  exportWorkspace: () => Promise<void>;
  importWorkspace: (file: File, overwrite?: boolean) => Promise<void>;
}

const createId = () =>
  typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `wid-${Math.random().toString(36).slice(2)}`;

const seedLayout = (): Placed[] => [
  {
    i: "globe-1",
    instanceId: "globe-1",
    order: 0,
    widgetId: "globe",
    x: 0,
    y: 0,
    w: 6,
    h: 6,
  },
  {
    i: "news-1",
    instanceId: "news-1",
    order: 1,
    widgetId: "news",
    x: 6,
    y: 0,
    w: 6,
    h: 6,
  },
  {
    i: "stats-1",
    instanceId: "stats-1",
    order: 2,
    widgetId: "stats",
    x: 0,
    y: 6,
    w: 6,
    h: 6,
  },
  {
    i: "sentiment-1",
    instanceId: "sentiment-1",
    order: 3,
    widgetId: "sentiment",
    x: 6,
    y: 6,
    w: 6,
    h: 6,
  },
];

const sanitizeLayout = (items: unknown): Placed[] => {
  if (!Array.isArray(items)) return seedLayout();

  const seen = new Set<string>();
  return items
    .filter((item): item is Placed => {
      if (!item || typeof item !== "object") return false;
      if (typeof item.i !== "string" || !item.i) return false;
      if (!widgetRegistry[(item as Placed).widgetId as WidgetId]) return false;
      return true;
    })
    .filter((item) => {
      if (seen.has(item.i)) return false;
      seen.add(item.i);
      return true;
    })
    .map((item, index) => ({
      ...item,
      instanceId:
        typeof item.instanceId === "string" && item.instanceId.length > 0
          ? item.instanceId
          : item.i,
      order: typeof item.order === "number" ? item.order : index,
      x: typeof item.x === "number" ? item.x : 0,
      y: typeof item.y === "number" ? item.y : 0,
      w:
        typeof item.w === "number"
          ? item.w
          : widgetRegistry[item.widgetId].defaultSize.w,
      h:
        typeof item.h === "number"
          ? item.h
          : widgetRegistry[item.widgetId].defaultSize.h,
      props: item.props ?? {},
      closed: Boolean(item.closed),
    }));
};

const toPlacedWidgetSnapshot = (items: Placed[]): PlacedWidget[] => {
  const seen = new Set<string>();
  return [...items]
    .filter((item) => !item.closed)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .filter((item) => {
      const key = item.instanceId ?? item.i;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
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
    }));
};

const toPlacedItems = (
  widgets: PlacedWidget[],
  options: { mode: "replace" | "append"; existing: Placed[] }
): Placed[] => {
  const { mode, existing } = options;
  const baseOrder = mode === "append" ? existing.length : 0;
  const baseY =
    mode === "append"
      ? existing.reduce((max, item) => Math.max(max, item.y + item.h), 0)
      : 0;

  return widgets
    .map((widget, idx) => {
      const config = widgetRegistry[widget.id as WidgetId];
      if (!config) {
        console.warn(
          `Widget '${widget.id}' not found in registry during layout apply. Skipping.`
        );
        return null;
      }
      const instanceId = widget.instanceId || createId();
      return {
        i: instanceId,
        instanceId,
        widgetId: widget.id as WidgetId,
        title: widget.title,
        props: widget.props ?? {},
        order: baseOrder + idx,
        x: widget.x ?? 0,
        y:
          widget.y !== undefined
            ? widget.y
            : baseY + idx * (config.defaultSize.h ?? 1),
        w: widget.w ?? config.defaultSize.w,
        h: widget.h ?? config.defaultSize.h,
        closed: false,
      } as Placed;
    })
    .filter((item): item is Placed => Boolean(item));
};

const placedToWorkspaceItems = (items: Placed[]): WidgetItem[] => {
  const seen = new Set<string>();
  return [...items]
    .map((item, idx) => ({ item, idx }))
    .sort(
      (a, b) =>
        (a.item.order ?? a.idx) - (b.item.order ?? b.idx)
    )
    .map(({ item, idx }) => {
      const instanceId = item.instanceId ?? item.i;
      if (!instanceId || seen.has(instanceId)) return null;
      seen.add(instanceId);
      return {
        i: instanceId,
        widgetId: item.widgetId,
        w: item.w,
        h: item.h,
        x: item.x,
        y: item.y,
        props: item.props ?? {},
        closed: item.closed ?? false,
        order: item.order ?? idx,
      } satisfies WidgetItem;
    })
    .filter((entry): entry is WidgetItem => Boolean(entry));
};

const widgetItemsToPlaced = (items: WidgetItem[]): Placed[] => {
  const seen = new Set<string>();
  return items
    .map((item, idx) => ({ item, idx }))
    .sort(
      (a, b) =>
        (typeof a.item.order === "number" ? a.item.order : a.idx) -
        (typeof b.item.order === "number" ? b.item.order : b.idx)
    )
    .map(({ item, idx }) => {
      const config = widgetRegistry[item.widgetId as WidgetId];
      if (!config) return null;
      const instanceId =
        typeof item.i === "string" && item.i.length > 0
          ? item.i
          : createId();
      if (seen.has(instanceId)) return null;
      seen.add(instanceId);
      const width = typeof item.w === "number" ? item.w : config.defaultSize.w;
      const height = typeof item.h === "number" ? item.h : config.defaultSize.h;
      const yPos =
        typeof item.y === "number"
          ? item.y
          : idx * (config.defaultSize.h ?? 1);
      return {
        i: instanceId,
        instanceId,
        widgetId: item.widgetId as WidgetId,
        x: typeof item.x === "number" ? item.x : 0,
        y: yPos,
        w: width,
        h: height,
        props: item.props ?? {},
        closed: Boolean(item.closed),
        order: typeof item.order === "number" ? item.order : idx,
        title: item.props?.title,
      } as Placed;
    })
    .filter((item): item is Placed => Boolean(item));
};

const selectActiveLayout = (workspace: WorkspaceDoc): Placed[] => {
  const active = workspace.dashboards.find(
    (dashboard) => dashboard.id === workspace.activeDashboardId
  );
  if (!active) return [];
  return widgetItemsToPlaced(active.layout ?? []);
};

const createDefaultWorkspace = (): WorkspaceDoc => {
  const defaultLayout = seedLayout();
  const dashboard = newDashboard("Default Dashboard");
  return {
    version: 1,
    dashboards: [
      {
        ...dashboard,
        layout: placedToWorkspaceItems(defaultLayout),
      },
    ],
    activeDashboardId: dashboard.id,
  } satisfies WorkspaceDoc;
};

const syncWorkspaceWithLayout = (
  workspace: WorkspaceDoc,
  layout: Placed[]
): WorkspaceDoc => {
  if (!workspace.activeDashboardId) return workspace;
  const updatedDashboards = workspace.dashboards.map((dashboard) =>
    dashboard.id === workspace.activeDashboardId
      ? {
          ...dashboard,
          layout: placedToWorkspaceItems(layout),
          updatedAt: isoNow(),
        }
      : dashboard
  );
  return sanitizeWorkspaceDoc({
    version: 1,
    dashboards: updatedDashboards,
    activeDashboardId: workspace.activeDashboardId,
  });
};

const persistWorkspaceToRepo = (
  repo: WorkspaceRepo,
  workspace: WorkspaceDoc
) => {
  void repo.save(workspace);
};

const persistLatestWorkspace = (get: () => DashboardState) => {
  const { workspaceRepo, workspace } = get();
  persistWorkspaceToRepo(workspaceRepo, workspace);
};

const bootstrapWorkspace = () => {
  const repo = createLocalWorkspaceRepo();
  const stored = loadWorkspaceSynchronously(repo);
  const workspace = sanitizeWorkspaceDoc(
    stored ?? createDefaultWorkspace()
  );
  void repo.save(workspace);
  const layout = selectActiveLayout(workspace);
  return { repo, workspace, layout };
};

export const useDash = create<DashboardState>()(
  persist(
    (set, get) => {
      const bootstrap = bootstrapWorkspace();

      return {
        layout:
          bootstrap.layout.length > 0 ? bootstrap.layout : seedLayout(),
        workspace: bootstrap.workspace,
        layoutsRepo: createLocalLayoutRepo(),
        workspaceRepo: bootstrap.repo,
        addWidget: (widgetId) => {
          const config = widgetRegistry[widgetId];
          if (!config) return;
          const id = createId();
          set((state) => {
            const nextOrder = state.layout.length;
            const nextLayout = [
              ...state.layout,
              {
                i: id,
                instanceId: id,
                order: nextOrder,
                widgetId,
                x: 0,
                y: nextOrder,
                w: config.defaultSize.w,
                h: config.defaultSize.h,
                props: {},
                closed: false,
              },
            ];
            return {
              layout: nextLayout,
              workspace: syncWorkspaceWithLayout(state.workspace, nextLayout),
            };
          });
          persistLatestWorkspace(get);
        },
        closeWidget: (i) => {
          set((state) => {
            const nextLayout = state.layout.map((item) =>
              item.i === i ? { ...item, closed: true } : item
            );
            return {
              layout: nextLayout,
              workspace: syncWorkspaceWithLayout(state.workspace, nextLayout),
            };
          });
          persistLatestWorkspace(get);
        },
        reopenWidget: (i) => {
          set((state) => {
            const nextLayout = state.layout.map((item) =>
              item.i === i ? { ...item, closed: false } : item
            );
            return {
              layout: nextLayout,
              workspace: syncWorkspaceWithLayout(state.workspace, nextLayout),
            };
          });
          persistLatestWorkspace(get);
        },
        importLayout: (items) => {
          const sanitized = sanitizeLayout(items);
          set((state) => ({
            layout: sanitized,
            workspace: syncWorkspaceWithLayout(state.workspace, sanitized),
          }));
          persistLatestWorkspace(get);
        },

        listLayouts: async () => get().layoutsRepo.list(),
        saveLayoutAs: async (name, overwrite = false) => {
          const repo = get().layoutsRepo;
          const snapshot = serializeLayout(
            name,
            toPlacedWidgetSnapshot(get().layout)
          );
          await repo.save(snapshot, overwrite);
        },
        loadLayout: async (name, mode) => {
          const repo = get().layoutsRepo;
          const layout = await repo.load(name);
          if (!layout) return;
          const widgets = applyLayout(layout, { append: mode === "append" });
          if (mode === "append") {
            set((state) => {
              const appended = toPlacedItems(widgets, {
                mode: "append",
                existing: state.layout,
              });
              if (appended.length === 0) return {};
              const nextLayout = [...state.layout, ...appended];
              return {
                layout: nextLayout,
                workspace: syncWorkspaceWithLayout(
                  state.workspace,
                  nextLayout
                ),
              };
            });
          } else {
            set((state) => {
              const replaced = toPlacedItems(widgets, {
                mode: "replace",
                existing: [],
              });
              if (replaced.length === 0) return {};
              return {
                layout: replaced,
                workspace: syncWorkspaceWithLayout(
                  state.workspace,
                  replaced
                ),
              };
            });
          }
          persistLatestWorkspace(get);
        },
        deleteLayout: async (name) => {
          await get().layoutsRepo.remove(name);
        },
        renameLayout: async (oldName, newName) => {
          await get().layoutsRepo.rename(oldName, newName);
        },
        exportLayout: async (name) => {
          const blob = await get().layoutsRepo.export(name);
          if (!blob) return;
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `${name}.micr_layout.json`;
          document.body.appendChild(a);
          a.click();
          a.remove();
          URL.revokeObjectURL(url);
        },
        importLayoutFromFile: async (file, overwrite = false) => {
          const text = await file.text();
          const parsed = JSON.parse(text) as DashboardLayout;
          if (!parsed || parsed.version !== 1) {
            throw new Error("UNSUPPORTED_VERSION");
          }
          const repo = get().layoutsRepo;
          const now = new Date().toISOString();
          const baseName = (parsed.name ?? "").trim() || `import-${now}`;
          const snapshot = {
            ...parsed,
            name: baseName,
            createdAt: parsed.createdAt ?? now,
            updatedAt: parsed.updatedAt ?? now,
          } satisfies DashboardLayout;
          await repo.save(snapshot, overwrite);
          const widgets = applyLayout(snapshot, { append: false });
          set((state) => {
            const replaced = toPlacedItems(widgets, {
              mode: "replace",
              existing: [],
            });
            return {
              layout: replaced,
              workspace: syncWorkspaceWithLayout(state.workspace, replaced),
            };
          });
          persistLatestWorkspace(get);
          return snapshot.name;
        },
        setActiveDashboard: (id) => {
          set((state) => {
            const synced = syncWorkspaceWithLayout(state.workspace, state.layout);
            if (synced.activeDashboardId === id) {
              return { workspace: synced };
            }
            const workspace = sanitizeWorkspaceDoc({
              ...synced,
              activeDashboardId: id,
            });
            const layout = selectActiveLayout(workspace);
            return {
              workspace,
              layout,
            };
          });
          persistLatestWorkspace(get);
        },
        addDashboard: (name = "New Dashboard") => {
          set((state) => {
            const synced = syncWorkspaceWithLayout(
              state.workspace,
              state.layout
            );
            const baseLayout = seedLayout();
            const dashboard = {
              ...newDashboard(name.trim() || "Untitled Dashboard"),
              layout: placedToWorkspaceItems(baseLayout),
            };
            const workspace = sanitizeWorkspaceDoc({
              version: 1,
              dashboards: [...synced.dashboards, dashboard],
              activeDashboardId: dashboard.id,
            });
            return {
              workspace,
              layout: baseLayout,
            };
          });
          persistLatestWorkspace(get);
        },
        renameDashboard: (id, name) => {
          const trimmed = name.trim();
          set((state) => {
            const synced = syncWorkspaceWithLayout(
              state.workspace,
              state.layout
            );
            const dashboards = synced.dashboards.map((dashboard) =>
              dashboard.id === id
                ? {
                    ...dashboard,
                    name: trimmed || "Untitled Dashboard",
                    updatedAt: isoNow(),
                  }
                : dashboard
            );
            return {
              workspace: sanitizeWorkspaceDoc({
                ...synced,
                dashboards,
              }),
            };
          });
          persistLatestWorkspace(get);
        },
        deleteDashboard: (id) => {
          set((state) => {
            const synced = syncWorkspaceWithLayout(
              state.workspace,
              state.layout
            );
            if (synced.dashboards.length <= 1) {
              return { workspace: synced };
            }
            const remaining = synced.dashboards.filter(
              (dashboard) => dashboard.id !== id
            );
            if (remaining.length === 0) {
              return { workspace: synced };
            }
            const nextActiveId =
              synced.activeDashboardId === id
                ? remaining[0].id
                : synced.activeDashboardId;
            const workspace = sanitizeWorkspaceDoc({
              version: 1,
              dashboards: remaining,
              activeDashboardId: nextActiveId,
            });
            return {
              workspace,
              layout: selectActiveLayout(workspace),
            };
          });
          persistLatestWorkspace(get);
        },
        duplicateDashboard: (id) => {
          set((state) => {
            const synced = syncWorkspaceWithLayout(
              state.workspace,
              state.layout
            );
            const source = synced.dashboards.find((dashboard) => dashboard.id === id);
            if (!source) return { workspace: synced };
            const duplicate = cloneDashboard(source);
            const workspace = sanitizeWorkspaceDoc({
              version: 1,
              dashboards: [...synced.dashboards, duplicate],
              activeDashboardId: duplicate.id,
            });
            return {
              workspace,
              layout: selectActiveLayout(workspace),
            };
          });
          persistLatestWorkspace(get);
        },
        loadWorkspace: async () => {
          const repo = get().workspaceRepo;
          const doc = await repo.load();
          if (!doc) return;
          const workspace = sanitizeWorkspaceDoc(doc);
          set({
            workspace,
            layout: selectActiveLayout(workspace),
          });
          persistWorkspaceToRepo(repo, workspace);
        },
        exportWorkspace: async () => {
          const { workspaceRepo, workspace, layout } = get();
          const synced = syncWorkspaceWithLayout(workspace, layout);
          set({ workspace: synced });
          await workspaceRepo.save(synced);
          const blob = await workspaceRepo.export();
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = "workspace.micr_workspace.json";
          document.body.appendChild(a);
          a.click();
          a.remove();
          URL.revokeObjectURL(url);
        },
        importWorkspace: async (file, overwrite = true) => {
          const repo = get().workspaceRepo;
          const imported = await repo.import(file, overwrite);
          const workspace = sanitizeWorkspaceDoc(imported);
          await repo.save(workspace);
          set({
            workspace,
            layout: selectActiveLayout(workspace),
          });
        },
      };
    },
    {
      name: "dashboard-layout",
      storage:
        typeof window !== "undefined"
          ? createJSONStorage(() => window.localStorage)
          : createJSONStorage((): Storage => ({
              get length() {
                return 0;
              },
              clear() {},
              getItem() {
                return null;
              },
              key() {
                return null;
              },
              removeItem() {},
              setItem() {},
            })),
      version: 5,
      migrate: async (persistedState, version) => {
        if (!persistedState || version < 5) {
          return {
            workspace: createDefaultWorkspace(),
            layout: seedLayout(),
          } as Partial<DashboardState>;
        }
        const state = persistedState as Partial<DashboardState>;
        const workspace = state.workspace
          ? sanitizeWorkspaceDoc(state.workspace as WorkspaceDoc)
          : createDefaultWorkspace();
        return {
          ...state,
          workspace,
          layout: selectActiveLayout(workspace),
        } as Partial<DashboardState>;
      },
      merge: (persistedState, currentState) => {
        const persisted = (persistedState as Partial<DashboardState>) || {};
        const workspace = persisted.workspace
          ? sanitizeWorkspaceDoc(persisted.workspace as WorkspaceDoc)
          : currentState.workspace;
        return {
          ...currentState,
          ...persisted,
          workspace,
          layout: selectActiveLayout(workspace),
          layoutsRepo: currentState.layoutsRepo,
          workspaceRepo: currentState.workspaceRepo,
        };
      },
    }
  )
);

