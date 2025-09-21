import React, { useRef, useState } from "react";

// If you set up the Vite proxy (see note), keep API = "/api".
// Otherwise: const API = "http://127.0.0.1:8000";
const API = "/api";

const API_EXTRACT_URL = `${API}/extract/url`;
const API_EXTRACT_FILE = `${API}/extract/file`;
const API_TRANSLATE = `${API}/translate`;
const API_REPORT = `${API}/report`;

type ExtractResponse = { content_html: string; lang: string };
type TranslateResponse = { translated_html: string; src_lang: string };

async function extractFromUrl(url: string): Promise<ExtractResponse> {
  const r = await fetch(API_EXTRACT_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });
  if (!r.ok) {
    try {
      const data = await r.json();
      throw new Error(data?.detail || JSON.stringify(data));
    } catch {
      throw new Error(await r.text());
    }
  }
  return r.json();
}

async function extractFromFile(file: File): Promise<ExtractResponse> {
  const form = new FormData();
  form.append("file", file);
  const r = await fetch(API_EXTRACT_FILE, { method: "POST", body: form });
  if (!r.ok) {
    try {
      const data = await r.json();
      throw new Error(data?.detail || JSON.stringify(data));
    } catch {
      throw new Error(await r.text());
    }
  }
  return r.json();
}

async function translateHtml(
  content_html: string,
  model?: string,
  glossary?: Record<string, string>
): Promise<TranslateResponse> {
  const r = await fetch(API_TRANSLATE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content_html, model, glossary }),
  });
  if (!r.ok) {
    try {
      const data = await r.json();
      throw new Error(data?.detail || JSON.stringify(data));
    } catch {
      throw new Error(await r.text());
    }
  }
  return r.json();
}

async function exportDocx(
  original_html: string,
  translated_html: string,
  fileName = "TranslationReport.docx"
) {
  const r = await fetch(API_REPORT, {
    method: "POST",
    
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      original_html,
      translated_html,
      filename: fileName.endsWith(".docx") ? fileName : `${fileName}.docx`,
    }),
  });
  if (!r.ok) {
    try {
      const data = await r.json();
      throw new Error(data?.detail || JSON.stringify(data));
    } catch {
      throw new Error(await r.text());
    }
  }
  const blob = await r.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName.endsWith(".docx") ? fileName : `${fileName}.docx`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function TranslationReportPage() {
  const [inputMode, setInputMode] = useState<"url" | "file">("url");
  const [url, setUrl] = useState("");
  const fileRef = useRef<HTMLInputElement | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // NOTE: these hold HTML strings (not plain text)
  const [extractedHtml, setExtractedHtml] = useState("");
  const [translatedHtml, setTranslatedHtml] = useState("");
  const [detectedLang, setDetectedLang] = useState("");

  async function onExtract() {
    try {
      setIsLoading(true);
      setError(null);

      let data: ExtractResponse;
      if (inputMode === "url") {
        if (!url) throw new Error("Please enter a URL");
        data = await extractFromUrl(url);
      } else {
        const f = fileRef.current?.files?.[0];
        if (!f) throw new Error("Please select a file");
        data = await extractFromFile(f);
      }

      setExtractedHtml(data.content_html || "");
      setDetectedLang(data.lang || "");
      setTranslatedHtml(""); // reset previous translation
    } catch (e: any) {
      setError(e?.message || "Unexpected error");
    } finally {
      setIsLoading(false);
    }
  }

  function parseGlossary(input: string): Record<string, string> | undefined {
    const trimmed = input.trim();
    if (!trimmed) return undefined;
    try {
      const asJson = JSON.parse(trimmed);
      if (asJson && typeof asJson === "object") return asJson as Record<string, string>;
    } catch {
      // ignore JSON parse error, try line format
    }
    const map: Record<string, string> = {};
    trimmed
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean)
      .forEach((line) => {
        const idx = line.search(/[:=]/);
        if (idx > 0) {
          const k = line.slice(0, idx).trim();
          const v = line.slice(idx + 1).trim();
          if (k && v) map[k] = v;
        }
      });
    return Object.keys(map).length ? map : undefined;
  }

  const [model, setModel] = useState<string>("");
  const [glossaryText, setGlossaryText] = useState<string>("");

  async function onTranslate() {
    try {
      setIsLoading(true);
      setError(null);
      if (!extractedHtml) throw new Error("Nothing to translate. Extract first.");
      const glossary = parseGlossary(glossaryText);
      const res = await translateHtml(extractedHtml, model || undefined, glossary);
      setTranslatedHtml(res.translated_html || "");
      if (res.src_lang) setDetectedLang(res.src_lang);
    } catch (e: any) {
      setError(e?.message || "Unexpected error");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Translation Report</h1>

      {/* Input mode + controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex rounded-md border border-white/10 overflow-hidden">
          <button
            type="button"
            className={`px-3 py-1 text-sm ${inputMode === "url" ? "bg-white/20" : "bg-white/5 hover:bg-white/10"}`}
            onClick={() => setInputMode("url")}
          >
            From URL
          </button>
          <button
            type="button"
            className={`px-3 py-1 text-sm ${inputMode === "file" ? "bg-white/20" : "bg-white/5 hover:bg-white/10"}`}
            onClick={() => setInputMode("file")}
          >
            From File
          </button>
        </div>

        {inputMode === "url" ? (
          <input
            type="url"
            placeholder="https://example.com/article"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="min-w-[320px] flex-1 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/20"
          />
        ) : (
          <input ref={fileRef} type="file" className="text-sm" accept=".html,.htm,.md,.txt,.pdf,.docx" />
        )}

        <button
          type="button"
          onClick={onExtract}
          disabled={isLoading}
          className="rounded-md bg-emerald-500/80 hover:bg-emerald-500 disabled:opacity-60 px-4 py-2 text-sm"
        >
          {isLoading ? "Working..." : "Extract"}
        </button>
      </div>

      {error && (
        <div className="rounded-md border border-red-400/40 bg-red-500/10 text-red-200 px-3 py-2 text-sm">{error}</div>
      )}

      {(extractedHtml || translatedHtml) && (
        <div className="flex items-center justify-between text-sm opacity-80">
          <div>Detected language: {detectedLang || "unknown"}</div>
        </div>
      )}

      {extractedHtml && (
        <div className="rounded-lg border border-white/10 bg-white/5 p-3 flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="Optional model (e.g., gpt-4o-mini)"
              className="min-w-[240px] rounded-md border border-white/10 bg-black/20 px-3 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/20"
            />
            <button
              type="button"
              onClick={onTranslate}
              disabled={isLoading}
              className="rounded-md bg-sky-500/80 hover:bg-sky-500 disabled:opacity-60 px-4 py-2 text-sm"
            >
              {isLoading ? "Translating..." : "Translate"}
            </button>
            <button
              type="button"
              onClick={() => exportDocx(extractedHtml, translatedHtml)}
              disabled={!translatedHtml || isLoading}
              className="rounded-md bg-indigo-500/80 hover:bg-indigo-500 disabled:opacity-60 px-4 py-2 text-sm"
            >
              Export DOCX
            </button>
          </div>
          <textarea
            value={glossaryText}
            onChange={(e) => setGlossaryText(e.target.value)}
            rows={3}
            placeholder="Optional glossary: JSON or 'term=translation' per line"
            className="w-full rounded-md border border-white/10 bg-black/20 px-3 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/20"
          />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-lg border border-white/10 bg-white/5 overflow-hidden">
          <div className="px-3 py-2 text-sm border-b border-white/10 bg-black/20">Original</div>
          <div
            className="max-h-[520px] overflow-auto bg-white text-black p-4"
            dangerouslySetInnerHTML={{ __html: extractedHtml || "<em>No content yet</em>" }}
          />
        </div>
        <div className="rounded-lg border border-white/10 bg-white/5 overflow-hidden">
          <div className="px-3 py-2 text-sm border-b border-white/10 bg-black/20">Translated</div>
          <div
            className="max-h-[520px] overflow-auto bg-white text-black p-4"
            dangerouslySetInnerHTML={{ __html: translatedHtml || "<em>No translation yet</em>" }}
          />
        </div>
      </div>
    </section>
  );
}

