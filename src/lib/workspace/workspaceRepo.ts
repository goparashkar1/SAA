import { WorkspaceDoc } from "./types";

const KEY = (tenant?: string, user?: string) =>
  `microsint:workspace:v1:${tenant ?? "default"}:${user ?? "local"}`;

export interface WorkspaceRepo {
  load(): Promise<WorkspaceDoc | null>;
  save(ws: WorkspaceDoc): Promise<void>;
  export(): Promise<Blob>;
  import(file: File, overwrite?: boolean): Promise<WorkspaceDoc>;
  storageKey: string;
}

export function createLocalWorkspaceRepo(
  tenant?: string,
  user?: string
): WorkspaceRepo {
  const key = KEY(tenant, user);
  return {
    storageKey: key,
    async load() {
      if (typeof window === "undefined") return null;
      const raw = window.localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as WorkspaceDoc) : null;
    },
    async save(ws) {
      if (typeof window === "undefined") return;
      window.localStorage.setItem(key, JSON.stringify(ws));
    },
    async export() {
      if (typeof window === "undefined") {
        return new Blob([
          JSON.stringify({ version: 1, dashboards: [], activeDashboardId: "" }, null, 2),
        ]);
      }
      const raw =
        window.localStorage.getItem(key) ??
        JSON.stringify({ version: 1, dashboards: [], activeDashboardId: "" }, null, 2);
      return new Blob([raw], { type: "application/json" });
    },
    async import(file, overwrite = true) {
      const text = await file.text();
      const ws = JSON.parse(text) as WorkspaceDoc;
      if (!ws || ws.version !== 1) throw new Error("UNSUPPORTED_VERSION");
      if (typeof window !== "undefined" && overwrite) {
        window.localStorage.setItem(key, JSON.stringify(ws));
      }
      return ws;
    },
  };
}

export function loadWorkspaceSynchronously(
  repo: WorkspaceRepo
): WorkspaceDoc | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(repo.storageKey);
  return raw ? (JSON.parse(raw) as WorkspaceDoc) : null;
}

