import React, { useMemo, useState } from "react";

type TargetFormat = "docx" | "pdf";
type LoadingStage = "idle" | "extract" | "translate" | "render";

const DOCILING_API_BASE = "http://localhost:8000/docling";
const LANG_OPTIONS = [
  { value: "fa", label: "Persian (fa)" },
  { value: "en", label: "English (en)" },
  { value: "ar", label: "Arabic (ar)" },
  { value: "de", label: "German (de)" },
];

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

      {loadingStage === "extract" && <div className="text-sm text-white/60">Extracting with Docling...</div>}
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
              className="min-h-[320px] w-full rounded-md border border-white/10 bg-black/40 p-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/20"
            />
          ) : (
            <pre className="min-h-[320px] whitespace-pre-wrap rounded-md border border-white/10 bg-black/40 p-2 text-sm text-white/80">
              {originalPreview || "Upload a document to view its Markdown."}
            </pre>
          )}
        </section>
        <section className="flex flex-col gap-2 rounded-md border border-white/10 bg-black/20 p-3">
          <header className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white/80">Translated</h3>
            {apiError && <span className="text-xs text-red-300">{apiError}</span>}
          </header>
          <pre className="min-h-[320px] whitespace-pre-wrap rounded-md border border-white/10 bg-black/40 p-2 text-sm text-white/80">
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

