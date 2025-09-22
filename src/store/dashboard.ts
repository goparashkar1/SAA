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
  addWidget: (widgetId: WidgetId) => void;
  closeWidget: (i: string) => void;
  reopenWidget: (i: string) => void;
  importLayout: (items: Placed[]) => void;
  reset: () => void;

  layoutsRepo: LayoutRepo;
  listLayouts: () => Promise<LayoutMeta[]>;
  saveLayoutAs: (name: string, overwrite?: boolean) => Promise<void>;
  loadLayout: (name: string, mode: "replace" | "append") => Promise<void>;
  deleteLayout: (name: string) => Promise<void>;
  renameLayout: (oldName: string, newName: string) => Promise<void>;
  exportLayout: (name: string) => Promise<void>;
  importLayoutFromFile: (file: File, overwrite?: boolean) => Promise<string | null>;
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

export const useDash = create<DashboardState>()(
  persist(
    (set, get) => ({
      layout: seedLayout(),
      layoutsRepo: createLocalLayoutRepo(),
      addWidget: (widgetId) => {
        const config = widgetRegistry[widgetId];
        if (!config) return;
        const id = createId();
        set((state) => {
          const nextOrder = state.layout.length;
          return {
            layout: [
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
            ],
          };
        });
      },
      closeWidget: (i) => {
        set((state) => ({
          layout: state.layout.map((item) =>
            item.i === i ? { ...item, closed: true } : item
          ),
        }));
      },
      reopenWidget: (i) => {
        set((state) => ({
          layout: state.layout.map((item) =>
            item.i === i ? { ...item, closed: false } : item
          ),
        }));
      },
      importLayout: (items) => {
        const sanitized = sanitizeLayout(items);
        set({ layout: sanitized.length > 0 ? sanitized : seedLayout() });
      },
      reset: () => set({ layout: seedLayout() }),
      listLayouts: async () => get().layoutsRepo.list(),
      saveLayoutAs: async (name, overwrite = false) => {
        const repo = get().layoutsRepo;
        const snapshot = serializeLayout(name, toPlacedWidgetSnapshot(get().layout));
        await repo.save(snapshot, overwrite);
      },
      loadLayout: async (name, mode) => {
        const repo = get().layoutsRepo;
        const layout = await repo.load(name);
        if (!layout) return;
        const widgets = applyLayout(layout, { append: mode === "append" });
        if (mode === "append") {
          const existing = get().layout;
          const appended = toPlacedItems(widgets, {
            mode: "append",
            existing,
          });
          if (appended.length === 0) return;
          set((state) => ({ layout: [...state.layout, ...appended] }));
        } else {
          const replaced = toPlacedItems(widgets, {
            mode: "replace",
            existing: [],
          });
          if (replaced.length === 0) return;
          set({ layout: replaced });
        }
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
        let parsed = JSON.parse(text) as DashboardLayout;
        if (!parsed || parsed.version !== 1) {
          throw new Error("UNSUPPORTED_VERSION");
        }
        const repo = get().layoutsRepo;
        const now = new Date().toISOString();
        const baseName = (parsed.name ?? "").trim() || `import-${now}`;
        let layoutToSave = {
          ...parsed,
          name: baseName,
          createdAt: parsed.createdAt ?? now,
          updatedAt: parsed.updatedAt ?? now,
        } satisfies DashboardLayout;

        if (!overwrite) {
          const existingNames = new Set(
            (await repo.list()).map((entry) => entry.name)
          );
          if (existingNames.has(layoutToSave.name)) {
            let suffix = 1;
            let candidate = `${layoutToSave.name}-${suffix}`;
            while (existingNames.has(candidate)) {
              suffix += 1;
              candidate = `${layoutToSave.name}-${suffix}`;
            }
            layoutToSave = {
              ...layoutToSave,
              name: candidate,
              createdAt: now,
              updatedAt: now,
            };
          }
        }

        await repo.import(layoutToSave, overwrite);
        return layoutToSave.name;
      },
    }),
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
      version: 4,
      migrate: async (persistedState, version) => {
        if (!persistedState || version < 4) {
          return {
            ...(persistedState as Partial<DashboardState>),
            layout: seedLayout(),
          } as Partial<DashboardState>;
        }
        const state = persistedState as Partial<DashboardState>;
        const layout = sanitizeLayout((state.layout ?? []) as Placed[]);
        return {
          ...state,
          layout: layout.length > 0 ? layout : seedLayout(),
        } as Partial<DashboardState>;
      },
      merge: (persistedState, currentState) => {
        const persisted = (persistedState as Partial<DashboardState>) || {};
        const sanitized = sanitizeLayout(
          (persisted.layout ?? currentState.layout) as Placed[]
        );

        return {
          ...currentState,
          ...persisted,
          layout: sanitized.length > 0 ? sanitized : seedLayout(),
          layoutsRepo: currentState.layoutsRepo,
        };
      },
    }
  )
);
