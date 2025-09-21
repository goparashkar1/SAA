import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { widgetRegistry, type WidgetId } from "../widgets/registry";

export type Placed = {
  i: string;
  widgetId: WidgetId;
  x: number;
  y: number;
  w: number;
  h: number;
  props?: Record<string, any>;
  closed?: boolean;
};

interface DashboardState {
  layout: Placed[];
  addWidget: (widgetId: WidgetId) => void;
  closeWidget: (i: string) => void;
  reopenWidget: (i: string) => void;
  importLayout: (items: Placed[]) => void;
  reset: () => void;
}

const seedLayout = (): Placed[] => [
  { i: "globe-1", widgetId: "globe", x: 0, y: 0, w: 6, h: 6 },
  { i: "news-1", widgetId: "news", x: 6, y: 0, w: 6, h: 6 },
  { i: "stats-1", widgetId: "stats", x: 0, y: 6, w: 6, h: 6 },
  { i: "sentiment-1", widgetId: "sentiment", x: 6, y: 6, w: 6, h: 6 },
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
    .map((item) => ({
      ...item,
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
    }));
};

export const useDash = create<DashboardState>()(
  persist(
    (set, get) => ({
      layout: seedLayout(),
      addWidget: (widgetId) => {
        const config = widgetRegistry[widgetId];
        if (!config) return;
        const id = `${widgetId}-${Date.now()}`;
        set((state) => ({
          layout: [
            ...state.layout,
            {
              i: id,
              widgetId,
              x: 0,
              y: state.layout.length,
              w: config.defaultSize.w,
              h: config.defaultSize.h,
              props: {},
              closed: false,
            },
          ],
        }));
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
      version: 2,
      migrate: async (persistedState, version) => {
        if (!persistedState || version < 2) {
          return {
            ...(persistedState as Partial<DashboardState>),
            layout: seedLayout(),
          };
        }
        return persistedState as DashboardState;
      },
      merge: (persistedState, currentState) => {
        const persisted = (persistedState as Partial<DashboardState>) || {};
        const sanitized = sanitizeLayout(persisted.layout ?? currentState.layout);

        return {
          ...currentState,
          ...persisted,
          layout: sanitized.length > 0 ? sanitized : seedLayout(),
        };
      },
    }
  )
);
