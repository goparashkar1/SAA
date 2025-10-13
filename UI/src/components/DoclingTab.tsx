import React, { useEffect, useMemo, useRef, useState } from "react";

type TargetFormat = "docx" | "pdf";
type LoadingStage = "idle" | "extract" | "translate" | "render";

const DOCILING_API_BASE = "http://localhost:8000/docling";
const LANG_OPTIONS = [
  { value: "fa", label: "Persian (fa)" },
  { value: "en", label: "English (en)" },
  { value: "ar", label: "Arabic (ar)" },
  { value: "de", label: "German (de)" },
];

const STAGE_LABELS: Record<Exclude<LoadingStage, "idle">, string> = {
  extract: "Extracting document",
  translate: "Translating content",
  render: "Rendering output",
};

const STAGE_ESTIMATE_MS: Record<LoadingStage, number> = {
  idle: 0,
  extract: 20000,
  translate: 30000,
  render: 15000,
};

export default function DoclingTab(): JSX.Element {
  const [jobId, setJobId] = useState<string | null>(null);
  const [assetsBase, setAssetsBase] = useState<string | null>(null);
  const [originalMd, setOriginalMd] = useState<string>("");
  const [editedMd, setEditedMd] = useState<string>("");
  const [translatedMd, setTranslatedMd] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [target, setTarget] = useState<TargetFormat>("docx");
  const [langTarget, setLangTarget] = useState<string>("fa");
  const [rtl, setRtl] = useState<boolean>(true);
  const [loadingStage, setLoadingStage] = useState<LoadingStage>("idle");
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [progressStart, setProgressStart] = useState<number | null>(null);
  const [elapsedMs, setElapsedMs] = useState<number>(0);
  const [lastTask, setLastTask] = useState<{ stage: LoadingStage; durationMs: number } | null>(null);
  const previousStageRef = useRef<LoadingStage>("idle");

  const isBusy = loadingStage !== "idle";
  const translatedPreview = useMemo(() => {
    if (translatedMd) return translatedMd;
    if (apiError) return apiError;
    return "Run Translate to populate this panel.";
  }, [translatedMd, apiError]);

  const originalPreview = useMemo(() => {
    if (!assetsBase) return editedMd || originalMd;
    const base = assetsBase.endsWith("/") ? assetsBase : `${assetsBase}/`;
    return (editedMd || originalMd).replace(/(\!\[[^\]]*\]\()assets\//g, `$1${base}`);
  }, [editedMd, originalMd, assetsBase]);

  useEffect(() => {
    const previous = previousStageRef.current;
    if (loadingStage !== "idle" && previous !== loadingStage) {
      setProgressStart(Date.now());
      setElapsedMs(0);
    }
    if (loadingStage === "idle" && previous !== "idle") {
      const duration = progressStart ? Date.now() - progressStart : 0;
      setLastTask({ stage: previous, durationMs: duration });
      setProgressStart(null);
      setElapsedMs(0);
    }
    previousStageRef.current = loadingStage;
  }, [loadingStage, progressStart]);

  useEffect(() => {
    if (loadingStage === "idle" || progressStart == null) {
      return;
    }
    const interval = window.setInterval(() => {
      setElapsedMs(Date.now() - progressStart);
    }, 200);
    return () => window.clearInterval(interval);
  }, [loadingStage, progressStart]);

  const formatDuration = (ms: number) => {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const activeEstimateMs = loadingStage !== "idle" ? STAGE_ESTIMATE_MS[loadingStage] ?? 0 : 0;
  const progressPercent =
    loadingStage === "idle" || progressStart == null || activeEstimateMs === 0
      ? 0
      : Math.min(100, Math.floor((elapsedMs / activeEstimateMs) * 100));
  const remainingMs = Math.max(activeEstimateMs - elapsedMs, 0);
  const activeStageLabel =
    loadingStage !== "idle" ? STAGE_LABELS[loadingStage as Exclude<LoadingStage, "idle">] ?? "Processing" : null;
  const describeStage = (stage: LoadingStage) =>
    stage === "idle" ? "Idle" : STAGE_LABELS[stage as Exclude<LoadingStage, "idle">] ?? stage;

  async function handleExtract(selectedFile: File) {
    const formData = new FormData();
    formData.append("file", selectedFile);
    setLoadingStage("extract");
    setApiError(null);
    setTranslatedMd(null);
    setDownloadUrl(null);

    try {
      const response = await fetch(`${DOCILING_API_BASE}/extract`, {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        const detail = await response.text();
        throw new Error(detail || "Docling extraction failed.");
      }
      const payload = await response.json();
      setJobId(payload.job_id);
      setAssetsBase(payload.assets_base ?? null);
      setOriginalMd(payload.original_md ?? "");
      setEditedMd(payload.original_md ?? "");
      setTranslatedMd(null);
      setApiError(null);
      setIsEditing(false);
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Docling extraction failed.");
      setJobId(null);
      setAssetsBase(null);
      setOriginalMd("");
      setEditedMd("");
    } finally {
      setLoadingStage("idle");
    }
  }

  async function handleTranslate() {
    if (!jobId) {
      setApiError("Upload a file before translating.");
      return;
    }

    setLoadingStage("translate");
    setApiError(null);

    try {
      const response = await fetch(`${DOCILING_API_BASE}/translate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          job_id: jobId,
          md: editedMd,
          lang_target: langTarget,
        }),
      });
      if (!response.ok) {
        const detail = await response.text();
        throw new Error(detail || "Translation failed.");
      }
      const payload = await response.json();
      if (payload.error || !payload.translated_md) {
        setTranslatedMd(null);
        setApiError(payload.error || "NO credible API");
      } else {
        setTranslatedMd(payload.translated_md);
        setApiError(null);
      }
    } catch (err) {
      setTranslatedMd(null);
      setApiError("NO credible API");
    } finally {
      setLoadingStage("idle");
    }
  }

  async function handleRender() {
    if (!jobId) {
      setApiError("Upload a file before rendering.");
      return;
    }

    setLoadingStage("render");
    setDownloadUrl(null);
    setApiError(null);

    try {
      const response = await fetch(`${DOCILING_API_BASE}/render`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          job_id: jobId,
          target,
          original_md: editedMd,
          translated_md: translatedMd,
          rtl,
        }),
      });
      if (!response.ok) {
        const detail = await response.text();
        throw new Error(detail || "Render failed.");
      }
      const payload = await response.json();
      if (!payload?.download) {
        throw new Error("Render did not return a download link.");
      }
      setDownloadUrl(`http://localhost:8000${payload.download}`);
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Render failed.");
    } finally {
      setLoadingStage("idle");
    }
  }

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-white/10 bg-white/5 p-4">
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="file"
          className="text-sm text-white"
          onChange={(event) => {
            const selected = event.target.files?.[0];
            if (selected) {
              handleExtract(selected);
            }
          }}
        />
        <button
          type="button"
          className="rounded-md border border-white/10 px-3 py-2 text-sm text-white hover:bg-white/10"
          onClick={() => setIsEditing((prev) => !prev)}
          disabled={!editedMd}
        >
          {isEditing ? "View Original" : "Edit Mode"}
        </button>
        <select
          value={target}
          onChange={(event) => setTarget(event.target.value as TargetFormat)}
          className="rounded-md border border-white/10 bg-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/20"
        >
          <option value="docx">DOCX</option>
          <option value="pdf">PDF</option>
        </select>
        <select
          value={langTarget}
          onChange={(event) => setLangTarget(event.target.value)}
          className="rounded-md border border-white/10 bg-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/20"
        >
          {LANG_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm text-white/80">
          <input
            type="checkbox"
            className="h-4 w-4 accent-emerald-500"
            checked={rtl}
            onChange={(event) => setRtl(event.target.checked)}
          />
          RTL layout
        </label>
        {jobId && (
          <span className="text-xs text-white/50">
            Job ID: <code className="bg-white/10 px-1 py-0.5 rounded">{jobId}</code>
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleTranslate}
          disabled={isBusy || !jobId}
          className="rounded-md bg-sky-500/80 px-4 py-2 text-sm text-white hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loadingStage === "translate" ? "Translating..." : "Translate"}
        </button>
        <button
          type="button"
          onClick={handleRender}
          disabled={isBusy || !jobId}
          className="rounded-md bg-emerald-500/80 px-4 py-2 text-sm text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loadingStage === "render" ? "Rendering..." : `Render ${target.toUpperCase()}`}
        </button>
        {assetsBase && (
          <span className="text-xs text-white/50">
            Assets served from: <code className="bg-white/10 px-1 py-0.5 rounded">{assetsBase}</code>
          </span>
        )}
      </div>

      {loadingStage !== "idle" && (
        <div className="flex flex-col gap-2 rounded-md border border-white/10 bg-white/5 p-4 text-white/80">
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <span className="font-medium">{activeStageLabel}</span>
            <span className="text-xs uppercase tracking-wide text-white/50">
              {formatDuration(elapsedMs)} elapsed
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-200 ease-out"
              style={{ width: `${Math.min(100, Math.max(5, progressPercent))}%` }}
            />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-white/60">
            <span>Est. total: {activeEstimateMs ? formatDuration(activeEstimateMs) : "N/A"}</span>
            <span>Est. remaining: {activeEstimateMs ? formatDuration(remainingMs) : "Calculating..."}</span>
          </div>
        </div>
      )}
      {lastTask && loadingStage === "idle" && (
        <div className="rounded-md border border-white/10 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200">
          {describeStage(lastTask.stage)} completed in {formatDuration(lastTask.durationMs)}.
        </div>
      )}
      {apiError && loadingStage !== "translate" && loadingStage !== "render" && (
        <div className="rounded border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">{apiError}</div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section className="flex flex-col gap-2 rounded-md border border-white/10 bg-black/20 p-3">
          <header className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white/80">Original</h3>
            {isEditing && <span className="text-xs text-white/50">Editing enabled</span>}
          </header>
          {isEditing ? (
            <textarea
              value={editedMd}
              onChange={(event) => {
                setEditedMd(event.target.value);
                setTranslatedMd(null);
                setApiError(null);
              }}
              className="min-h-[320px] max-h-[520px] w-full overflow-y-auto rounded-md border border-white/10 bg-black/40 p-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/20"
            />
          ) : (
            <pre className="min-h-[320px] max-h-[520px] whitespace-pre-wrap overflow-y-auto rounded-md border border-white/10 bg-black/40 p-2 text-sm text-white/80">
              {originalPreview || "Upload a document to view its Markdown."}
            </pre>
          )}
        </section>
        <section className="flex flex-col gap-2 rounded-md border border-white/10 bg-black/20 p-3">
          <header className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white/80">Translated</h3>
            {apiError && <span className="text-xs text-red-300">{apiError}</span>}
          </header>
          <pre className="min-h-[320px] max-h-[520px] whitespace-pre-wrap overflow-y-auto rounded-md border border-white/10 bg-black/40 p-2 text-sm text-white/80">
            {translatedPreview}
          </pre>
        </section>
      </div>

      {downloadUrl && (
        <div className="flex flex-col gap-1 rounded-md border border-white/10 bg-emerald-500/10 p-3 text-sm text-white/90">
          <span>Export ready.</span>
          <a href={downloadUrl} className="text-emerald-300 underline" target="_blank" rel="noreferrer">
            Download result
          </a>
        </div>
      )}
    </div>
  );
}
