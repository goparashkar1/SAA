export type PlacedWidget = {
  id: string;
  instanceId: string;
  title?: string;
  props?: Record<string, any>;
  order: number;
  x?: number;
  y?: number;
  w?: number;
  h?: number;
};

export type DashboardLayout = {
  version: 1;
  name: string;
  createdAt: string;
  updatedAt: string;
  items: PlacedWidget[];
};

export type LayoutMeta = Pick<DashboardLayout, "name" | "createdAt" | "updatedAt"> & {
  count: number;
};
