export type WidgetItem = {
  i: string;
  widgetId: string;
  w: number;
  h?: number;
  x?: number;
  y?: number;
  props?: Record<string, any>;
  closed?: boolean;
  order?: number;
};

export type DashboardDoc = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  layout: WidgetItem[];
};

export type WorkspaceDoc = {
  version: 1;
  activeDashboardId: string;
  dashboards: DashboardDoc[];
};
