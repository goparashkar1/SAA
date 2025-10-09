import { DashboardLayout, LayoutMeta } from "./types";

const STORAGE_KEY = (tenant?: string, user?: string) =>
  `microsint:layouts:v1:${tenant ?? "default"}:${user ?? "local"}`;

const hasWindow = typeof window !== "undefined";

const getLocalStorage = (): Storage | null => {
  if (!hasWindow) return null;
  try {
    return window.localStorage;
  } catch (err) {
    console.warn("Layout repo localStorage unavailable", err);
    return null;
  }
};

const safeParse = (value: string | null): Record<string, DashboardLayout> => {
  if (!value) return {};
  try {
    const parsed = JSON.parse(value) as Record<string, DashboardLayout>;
    if (parsed && typeof parsed === "object") {
      return parsed;
    }
  } catch (err) {
    console.warn("Failed to parse stored layouts", err);
  }
  return {};
};

const safeStringify = (value: Record<string, DashboardLayout>): string => {
  try {
    return JSON.stringify(value);
  } catch (err) {
    console.warn("Failed to stringify layouts", err);
    return "{}";
  }
};

export interface LayoutRepo {
  list(): Promise<LayoutMeta[]>;
  load(name: string): Promise<DashboardLayout | null>;
  save(layout: DashboardLayout, overwrite?: boolean): Promise<void>;
  remove(name: string): Promise<void>;
  rename(oldName: string, newName: string): Promise<void>;
  import(layout: DashboardLayout, overwrite?: boolean): Promise<void>;
  export(name: string): Promise<Blob | null>;
}

export function createLocalLayoutRepo(tenant?: string, user?: string): LayoutRepo {
  const storage = getLocalStorage();
  const key = STORAGE_KEY(tenant, user);

  const read = (): Record<string, DashboardLayout> => {
    if (!storage) return {};
    return safeParse(storage.getItem(key));
  };

  const write = (obj: Record<string, DashboardLayout>) => {
    if (!storage) return;
    storage.setItem(key, safeStringify(obj));
  };

  const ensureStorage = () => {
    if (!storage) throw new Error("LAYOUT_STORAGE_UNAVAILABLE");
  };

  return {
    async list() {
      const all = read();
      return Object.values(all)
        .map((layout) => ({
          name: layout.name,
          createdAt: layout.createdAt,
          updatedAt: layout.updatedAt,
          count: layout.items.length,
        }))
        .sort((a, b) => a.name.localeCompare(b.name));
    },
    async load(name) {
      const all = read();
      return all[name] ?? null;
    },
    async save(layout, overwrite = false) {
      ensureStorage();
      const all = read();
      if (!overwrite && all[layout.name]) {
        throw new Error("DUPLICATE_NAME");
      }
      const now = new Date().toISOString();
      const existing = all[layout.name];
      all[layout.name] = {
        ...layout,
        createdAt: existing?.createdAt ?? layout.createdAt ?? now,
        updatedAt: now,
      };
      write(all);
    },
    async remove(name) {
      ensureStorage();
      const all = read();
      delete all[name];
      write(all);
    },
    async rename(oldName, newName) {
      ensureStorage();
      const all = read();
      if (!all[oldName]) throw new Error("NOT_FOUND");
      if (all[newName]) throw new Error("DUPLICATE_NAME");
      const now = new Date().toISOString();
      all[newName] = {
        ...all[oldName],
        name: newName,
        updatedAt: now,
      };
      delete all[oldName];
      write(all);
    },
    async import(layout, overwrite = false) {
      await this.save(layout, overwrite);
    },
    async export(name) {
      const layout = await this.load(name);
      if (!layout) return null;
      return new Blob([JSON.stringify(layout, null, 2)], {
        type: "application/json",
      });
    },
  };
}

