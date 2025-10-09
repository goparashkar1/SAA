import { DashboardDoc, WorkspaceDoc, WidgetItem } from "./types";

export const now = () => new Date().toISOString();

export const uuid = () =>
  typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

export function newDashboard(name = "Untitled Dashboard"): DashboardDoc {
  const timestamp = now();
  return {
    id: uuid(),
    name,
    createdAt: timestamp,
    updatedAt: timestamp,
    layout: [],
  };
}

export function cloneDashboard(
  src: DashboardDoc,
  withNewIds = true
): DashboardDoc {
  const timestamp = now();
  return {
    id: uuid(),
    name: `${src.name} (Copy)`,
    createdAt: timestamp,
    updatedAt: timestamp,
    layout: src.layout.map((item) => ({
      ...item,
      i: withNewIds ? uuid() : item.i,
    })),
  };
}

export function sanitizeWorkspace(doc: WorkspaceDoc): WorkspaceDoc {
  const dashboards = doc.dashboards ?? [];
  if (!dashboards.length) {
    const d = newDashboard("Default Dashboard");
    return {
      version: 1,
      dashboards: [d],
      activeDashboardId: d.id,
    };
  }
  const activeDashboardId =
    dashboards.find((d) => d.id === doc.activeDashboardId)?.id ?? dashboards[0].id;
  return {
    version: 1,
    dashboards: dashboards.map((dashboard) => ({
      ...dashboard,
      layout: Array.isArray(dashboard.layout)
        ? dashboard.layout.filter(filterWidgetItem)
        : [],
    })),
    activeDashboardId,
  };
}

function filterWidgetItem(widget: WidgetItem): boolean {
  if (!widget || typeof widget !== "object") return false;
  if (typeof widget.widgetId !== "string" || !widget.widgetId) return false;
  if (typeof widget.i !== "string" || !widget.i) return false;
  if (typeof widget.w !== "number") return false;
  return true;
}

