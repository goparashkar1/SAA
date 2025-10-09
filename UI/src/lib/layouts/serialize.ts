import { DashboardLayout, PlacedWidget } from "./types";

const createId = () =>
  typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

export function serializeLayout(name: string, items: PlacedWidget[]): DashboardLayout {
  const ordered = [...items]
    .map((it, idx) => ({ ...it, order: it.order ?? idx }))
    .sort((a, b) => a.order - b.order)
    .map((it, idx) => ({ ...it, order: idx }));

  const timestamp = new Date().toISOString();

  return {
    version: 1,
    name,
    createdAt: timestamp,
    updatedAt: timestamp,
    items: ordered.map(({ id, instanceId, title, props, order, x, y, w, h }) => ({
      id,
      instanceId,
      title,
      props: props ?? {},
      order,
      x,
      y,
      w,
      h,
    })),
  };
}

export function applyLayout(
  layout: DashboardLayout,
  options: { append?: boolean } = {}
): PlacedWidget[] {
  const { append = false } = options;
  return layout.items.map((item, idx) => ({
    id: item.id,
    instanceId: append ? createId() : item.instanceId ?? createId(),
    title: item.title,
    props: item.props ?? {},
    order: idx,
    x: item.x,
    y: item.y,
    w: item.w,
    h: item.h,
  }));
}

