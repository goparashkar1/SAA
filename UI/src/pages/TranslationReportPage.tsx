import React, { useRef, useState, useEffect } from "react";
import { Document, ParseResult, GlossaryEntry, ExportRequest } from "../types/irv2";
import DoclingTab from "../components/DoclingTab";

// If you set up the Vite proxy (see note), keep API = "/api".
// Otherwise: const API = "http://127.0.0.1:8000";
const API = "/api";

const API_EXTRACT_URL = `${API}/extract/url`;
const API_EXTRACT_FILE = `${API}/extract/file`;
const API_TRANSLATE = `${API}/translate`;
const API_REPORT = `${API}/report`;
const API_REPORT_IRV2 = `${API}/report/irv2`;

type ExtractResponse = { content_html: string; lang: string };
type ExtractIRv2Response = { ir: Document; lang: string; stats: any };
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

async function extractFromFileIRv2(file: File): Promise<ExtractIRv2Response> {
  const form = new FormData();
  form.append("file", file);
  const r = await fetch(`${API_EXTRACT_FILE}?mode=irv2`, { method: "POST", body: form });
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

async function exportDocxIRv2(
  source_ir: Document,
  target_ir: Document | null,
  layout: string = "sequential",
  glossary: GlossaryEntry[] = [],
  model: string = "none",
  fileName = "TranslationReport.docx"
) {
  const r = await fetch(API_REPORT_IRV2, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      source_ir,
      target_ir,
      layout,
      format: "docx",
      glossary,
      model,
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
  const [inputMode, setInputMode] = useState<"url" | "file">("file");
  const [processingMode, setProcessingMode] = useState<"legacy" | "irv2" | "docling">("legacy");
  const [url, setUrl] = useState("");
  const fileRef = useRef<HTMLInputElement | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [irv2Available, setIrv2Available] = useState<boolean | null>(null);

  // Legacy mode state
  const [extractedHtml, setExtractedHtml] = useState("");
  const [translatedHtml, setTranslatedHtml] = useState("");
  const [isExportingLegacy, setIsExportingLegacy] = useState(false);
  const [detectedLang, setDetectedLang] = useState("");

  // IR v2 mode state
  const [sourceIR, setSourceIR] = useState<Document | null>(null);
  const [targetIR, setTargetIR] = useState<Document | null>(null);
  const [irStats, setIrStats] = useState<any>(null);
  const [selectedBlock, setSelectedBlock] = useState<any>(null);
  const [glossary, setGlossary] = useState<GlossaryEntry[]>([]);
  const [model, setModel] = useState<string>("none");
  const [layout, setLayout] = useState<string>("sequential");

  // Check IR v2 availability on component mount
  useEffect(() => {
    async function checkHealth() {
      try {
        const response = await fetch(`${API}/health`);
        const data = await response.json();
        const available = data.irv2_available || false;
        setIrv2Available(available);
        
        // If IR v2 is not available and we're in IR v2 mode, switch to legacy
        if (!available && processingMode === "irv2") {
          setProcessingMode("legacy");
        }
      } catch (error) {
        console.warn("Could not check health endpoint:", error);
        setIrv2Available(false);
        if (processingMode === "irv2") {
          setProcessingMode("legacy");
        }
      }
    }
    checkHealth();
  }, [processingMode]);

  async function onExtract() {
    try {
      setIsLoading(true);
      setError(null);

      if (processingMode === "irv2" && inputMode === "file") {
        // IR v2 mode for files
        const f = fileRef.current?.files?.[0];
        if (!f) throw new Error("Please select a file");
        try {
          const data = await extractFromFileIRv2(f);
          setSourceIR(data.ir);
          setIrStats(data.stats);
          setDetectedLang(data.lang || "");
          setTargetIR(null); // reset previous translation
        } catch (e: any) {
          if (e.message?.includes("503") || e.message?.includes("not available")) {
            throw new Error("IR v2 mode is not available. Please use Legacy mode or contact administrator.");
          }
          throw e;
        }
      } else {
        // Legacy mode
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
      }
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

  const [legacyModel, setLegacyModel] = useState<string>("");
  const [glossaryText, setGlossaryText] = useState<string>("");

  async function onTranslate() {
    try {
      setIsLoading(true);
      setError(null);
      if (!extractedHtml) throw new Error("Nothing to translate. Extract first.");
      const glossary = parseGlossary(glossaryText);
      const res = await translateHtml(extractedHtml, legacyModel || undefined, glossary);
      setTranslatedHtml(res.translated_html || "");
      if (res.src_lang) setDetectedLang(res.src_lang);
    } catch (e: any) {
      setError(e?.message || "Unexpected error");
    } finally {
      setIsLoading(false);
    }
  }

  async function onExportLegacy() {
    try {
      setIsLoading(true);
      setIsExportingLegacy(true);
      setError(null);
      if (!extractedHtml) throw new Error("No extracted content to export.");
      const translationForExport = translatedHtml.trim().length > 0 ? translatedHtml : "";
      await exportDocx(extractedHtml, translationForExport);
    } catch (e: any) {
      setError(e?.message || "Unexpected error");
    } finally {
      setIsExportingLegacy(false);
      setIsLoading(false);
    }
  }

  async function onExportIRv2() {
    try {
      setIsLoading(true);
      setError(null);
      if (!sourceIR) throw new Error("No source document to export.");
      await exportDocxIRv2(sourceIR, targetIR, layout, glossary, model);
    } catch (e: any) {
      setError(e?.message || "Unexpected error");
    } finally {
      setIsLoading(false);
    }
  }

  function addGlossaryEntry() {
    setGlossary([...glossary, { source: "", target: "", case_sensitive: false, exact: false }]);
  }

  function updateGlossaryEntry(index: number, field: keyof GlossaryEntry, value: any) {
    const updated = [...glossary];
    updated[index] = { ...updated[index], [field]: value };
    setGlossary(updated);
  }

  function removeGlossaryEntry(index: number) {
    setGlossary(glossary.filter((_, i) => i !== index));
  }

  return (
    <section className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Translation Report</h1>

      {/* Processing mode selector */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex rounded-md border border-white/10 overflow-hidden">
          <button
            type="button"
            className={`px-3 py-1 text-sm ${processingMode === "legacy" ? "bg-white/20" : "bg-white/5 hover:bg-white/10"}`}
            onClick={() => setProcessingMode("legacy")}
          >
            Legacy Mode
          </button>
          <button
            type="button"
            className={`px-3 py-1 text-sm ${processingMode === "irv2" ? "bg-white/20" : "bg-white/5 hover:bg-white/10"} ${irv2Available === false ? "opacity-50 cursor-not-allowed" : ""}`}
            onClick={() => setProcessingMode("irv2")}
            disabled={irv2Available === false}
          >
            IR v2 Mode
          </button>
          <button
            type="button"
            className={`px-3 py-1 text-sm ${processingMode === "docling" ? "bg-white/20" : "bg-white/5 hover:bg-white/10"}`}
            onClick={() => setProcessingMode("docling")}
          >
            Docling
          </button>
        </div>
        {processingMode === "irv2" && (
          <div className="text-xs text-yellow-400">
            ⚠️ IR v2 mode may not be available if dependencies are missing
          </div>
        )}
        {irv2Available === false && (
          <div className="text-xs text-red-400">
            ❌ IR v2 mode is not available - using Legacy mode
          </div>
        )}
        {irv2Available === true && (
          <div className="text-xs text-green-400">
            ✅ IR v2 mode is available
          </div>
        )}
      </div>

      {processingMode !== "docling" && (
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex rounded-md border border-white/10 overflow-hidden">
            <button
              type="button"
              className={`px-3 py-1 text-sm ${inputMode === "url" ? "bg-white/20" : "bg-white/5 hover:bg-white/10"}`}
              onClick={() => setInputMode("url")}
              disabled={processingMode === "irv2"}
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
      )}

      {error && (
        <div className="rounded-md border border-red-400/40 bg-red-500/10 text-red-200 px-3 py-2 text-sm">{error}</div>
      )}

      {(extractedHtml || translatedHtml || sourceIR) && (
        <div className="flex items-center justify-between text-sm opacity-80">
          <div>Detected language: {detectedLang || "unknown"}</div>
          {irStats && (
            <div className="text-xs">
              Stats: {irStats.paragraphs || 0} paragraphs, {irStats.tables || 0} tables, {irStats.figures || 0} figures
            </div>
          )}
        </div>
      )}

      {processingMode === "docling" && <DoclingTab />}

      {/* Legacy mode interface */}
      {processingMode === "legacy" && extractedHtml && (
        <div className="rounded-lg border border-white/10 bg-white/5 p-3 flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="text"
              value={legacyModel}
              onChange={(e) => setLegacyModel(e.target.value)}
              placeholder="Optional model (e.g., gpt-4o-mini)"
              className="min-w-[240px] rounded-md border border-white/10 bg-black/20 px-3 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/20"
            />
            <button
              type="button"
              onClick={onTranslate}
              disabled={isLoading}
              className="rounded-md bg-sky-500/80 hover:bg-sky-500 disabled:opacity-60 px-4 py-2 text-sm"
            >
              {isExportingLegacy ? "Please wait..." : isLoading ? "Translating..." : "Translate"}
            </button>
            <button
              type="button"
              onClick={onExportLegacy}
              disabled={!extractedHtml || isLoading}
              className="rounded-md bg-indigo-500/80 hover:bg-indigo-500 disabled:opacity-60 px-4 py-2 text-sm"
            >
              {isExportingLegacy ? "Exporting..." : "Export DOCX"}
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

      {/* IR v2 mode interface */}
      {processingMode === "irv2" && sourceIR && (
        <div className="rounded-lg border border-white/10 bg-white/5 p-3 flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="min-w-[200px] rounded-md border border-white/10 bg-black/20 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-white/20"
            >
              <option value="none">No API (Offline)</option>
              <option value="gpt-4o-mini">GPT-4o Mini</option>
              <option value="gpt-4o">GPT-4o</option>
              <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
            </select>
            <select
              value={layout}
              onChange={(e) => setLayout(e.target.value)}
              className="min-w-[150px] rounded-md border border-white/10 bg-black/20 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-white/20"
            >
              <option value="sequential">Sequential</option>
              <option value="side_by_side">Side by Side</option>
            </select>
            <button
              type="button"
              onClick={onExportIRv2}
              disabled={isLoading}
              className="rounded-md bg-indigo-500/80 hover:bg-indigo-500 disabled:opacity-60 px-4 py-2 text-sm"
            >
              {isLoading ? "Exporting..." : "Export DOCX"}
            </button>
          </div>
          
          {/* Glossary editor */}
          <div className="border-t border-white/10 pt-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium">Glossary</h3>
              <button
                type="button"
                onClick={addGlossaryEntry}
                className="text-xs bg-white/10 hover:bg-white/20 px-2 py-1 rounded"
              >
                Add Entry
              </button>
            </div>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {glossary.map((entry, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={entry.source}
                    onChange={(e) => updateGlossaryEntry(index, 'source', e.target.value)}
                    placeholder="Source term"
                    className="flex-1 rounded border border-white/10 bg-black/20 px-2 py-1 text-sm text-white placeholder-white/50"
                  />
                  <input
                    type="text"
                    value={entry.target}
                    onChange={(e) => updateGlossaryEntry(index, 'target', e.target.value)}
                    placeholder="Target term"
                    className="flex-1 rounded border border-white/10 bg-black/20 px-2 py-1 text-sm text-white placeholder-white/50"
                  />
                  <label className="flex items-center text-xs">
                    <input
                      type="checkbox"
                      checked={entry.case_sensitive}
                      onChange={(e) => updateGlossaryEntry(index, 'case_sensitive', e.target.checked)}
                      className="mr-1"
                    />
                    Case
                  </label>
                  <label className="flex items-center text-xs">
                    <input
                      type="checkbox"
                      checked={entry.exact}
                      onChange={(e) => updateGlossaryEntry(index, 'exact', e.target.checked)}
                      className="mr-1"
                    />
                    Exact
                  </label>
                  <button
                    type="button"
                    onClick={() => removeGlossaryEntry(index)}
                    className="text-red-400 hover:text-red-300 text-xs"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Content display */}
      {processingMode === "legacy" && (
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
      )}

      {/* IR v2 content display */}
      {processingMode === "irv2" && sourceIR && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Document tree */}
          <div className="rounded-lg border border-white/10 bg-white/5 overflow-hidden">
            <div className="px-3 py-2 text-sm border-b border-white/10 bg-black/20">Document Structure</div>
            <div className="max-h-[520px] overflow-auto p-3">
              <DocumentTree document={sourceIR} onSelectBlock={setSelectedBlock} />
            </div>
          </div>
          
          {/* Block editor */}
          <div className="rounded-lg border border-white/10 bg-white/5 overflow-hidden">
            <div className="px-3 py-2 text-sm border-b border-white/10 bg-black/20">Block Editor</div>
            <div className="max-h-[520px] overflow-auto p-3">
              {selectedBlock ? (
                <BlockEditor block={selectedBlock} />
              ) : (
                <div className="text-sm text-white/60">Select a block to edit</div>
              )}
            </div>
          </div>
          
          {/* Preview */}
          <div className="rounded-lg border border-white/10 bg-white/5 overflow-hidden">
            <div className="px-3 py-2 text-sm border-b border-white/10 bg-black/20">Preview</div>
            <div className="max-h-[520px] overflow-auto bg-white text-black p-4">
              <DocumentPreview document={sourceIR} />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

// Helper components for IR v2 interface
function DocumentTree({ document, onSelectBlock }: { document: Document; onSelectBlock: (block: any) => void }) {
  return (
    <div className="space-y-2">
      <div className="text-sm font-medium text-white/80">Document: {document.meta.title || "Untitled"}</div>
      {document.sections.map((section, sectionIndex) => (
        <div key={sectionIndex} className="ml-2">
          <div className="text-sm text-white/70">Section {section.index + 1}</div>
          {section.header && (
            <div className="ml-2 text-xs text-white/60 cursor-pointer hover:text-white/80" onClick={() => onSelectBlock(section.header)}>
              📄 Header
            </div>
          )}
          {section.blocks.map((block, blockIndex) => (
            <div key={blockIndex} className="ml-2 text-xs text-white/60 cursor-pointer hover:text-white/80" onClick={() => onSelectBlock(block)}>
              {getBlockIcon(block)} {getBlockType(block)}
            </div>
          ))}
          {section.footer && (
            <div className="ml-2 text-xs text-white/60 cursor-pointer hover:text-white/80" onClick={() => onSelectBlock(section.footer)}>
              📄 Footer
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function getBlockIcon(block: any): string {
  if ('level' in block && 'spans' in block) {
    return '📝'; // Heading
  } else if ('spans' in block) {
    return '📄'; // Paragraph
  } else if ('rows' in block) {
    return '📊'; // Table
  } else if ('image_id' in block) {
    return '🖼️'; // Figure
  } else {
    return '📦'; // Other
  }
}

function getBlockType(block: any): string {
  if ('level' in block && 'spans' in block) {
    return `Heading ${block.level}`;
  } else if ('spans' in block) {
    return 'Paragraph';
  } else if ('rows' in block) {
    return `Table (${block.rows.length} rows)`;
  } else if ('image_id' in block) {
    return 'Figure';
  } else {
    return 'Block';
  }
}

function BlockEditor({ block }: { block: any }) {
  if (!block) return null;

  if ('spans' in block) {
    return (
      <div className="space-y-2">
        <div className="text-sm font-medium">{getBlockType(block)}</div>
        <textarea
          value={block.spans.map((span: any) => span.text).join('')}
          onChange={(e) => {
            // Update the block with new text
            const newText = e.target.value;
            // Split into spans (simplified - in full implementation, preserve formatting)
            block.spans = [{ text: newText, bold: false, italic: false, underline: false }];
            console.log('Text changed:', newText);
          }}
          className="w-full h-32 rounded border border-white/10 bg-black/20 px-3 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/20"
        />
        <div className="text-xs text-white/60">
          {block.spans.length} span(s)
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              // Add bold formatting
              const currentText = block.spans.map((s: any) => s.text).join('');
              block.spans = [{ text: currentText, bold: true, italic: false, underline: false }];
            }}
            className="text-xs bg-white/10 hover:bg-white/20 px-2 py-1 rounded"
          >
            Bold
          </button>
          <button
            onClick={() => {
              // Add italic formatting
              const currentText = block.spans.map((s: any) => s.text).join('');
              block.spans = [{ text: currentText, bold: false, italic: true, underline: false }];
            }}
            className="text-xs bg-white/10 hover:bg-white/20 px-2 py-1 rounded"
          >
            Italic
          </button>
          <button
            onClick={() => {
              // Add underline formatting
              const currentText = block.spans.map((s: any) => s.text).join('');
              block.spans = [{ text: currentText, bold: false, italic: false, underline: true }];
            }}
            className="text-xs bg-white/10 hover:bg-white/20 px-2 py-1 rounded"
          >
            Underline
          </button>
        </div>
      </div>
    );
  }

  if ('rows' in block) {
    return (
      <div className="space-y-2">
        <div className="text-sm font-medium">Table ({block.rows.length} rows)</div>
        <div className="text-xs text-white/60">
          Click on table cells to edit content
        </div>
        <div className="max-h-40 overflow-auto">
          {block.rows.map((row: any, rowIndex: number) => (
            <div key={rowIndex} className="flex gap-1 mb-1">
              {row.cells.map((cell: any, cellIndex: number) => (
                <input
                  key={cellIndex}
                  type="text"
                  value={cell.blocks.map((b: any) => b.spans?.map((s: any) => s.text).join('') || '').join('')}
                  onChange={(e) => {
                    // Update the cell content
                    const newText = e.target.value;
                    cell.blocks = [{ 
                      spans: [{ text: newText, bold: false, italic: false, underline: false }] 
                    }];
                    console.log(`Cell ${rowIndex},${cellIndex} changed:`, newText);
                  }}
                  className="flex-1 text-xs rounded border border-white/10 bg-black/20 px-2 py-1 text-white"
                  placeholder="Cell content"
                />
              ))}
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              // Add a new row
              const newRow = {
                cells: block.rows[0]?.cells.map(() => ({
                  blocks: [{ spans: [{ text: '', bold: false, italic: false, underline: false }] }]
                })) || []
              };
              block.rows.push(newRow);
            }}
            className="text-xs bg-white/10 hover:bg-white/20 px-2 py-1 rounded"
          >
            Add Row
          </button>
          <button
            onClick={() => {
              // Remove last row
              if (block.rows.length > 1) {
                block.rows.pop();
              }
            }}
            className="text-xs bg-red-500/20 hover:bg-red-500/30 px-2 py-1 rounded"
          >
            Remove Row
          </button>
        </div>
      </div>
    );
  }

  if ('image_id' in block) {
    return (
      <div className="space-y-2">
        <div className="text-sm font-medium">Figure: {block.image_id}</div>
        <div className="text-xs text-white/60 mb-2">
          Image placeholder - caption can be edited below
        </div>
        <textarea
          value={block.caption?.spans.map((span: any) => span.text).join('') || ''}
          onChange={(e) => {
            // Update the caption
            const newCaption = e.target.value;
            if (newCaption.trim()) {
              block.caption = {
                spans: [{ text: newCaption, bold: false, italic: false, underline: false }]
              };
            } else {
              block.caption = null;
            }
            console.log('Caption changed:', newCaption);
          }}
          className="w-full h-20 rounded border border-white/10 bg-black/20 px-3 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/20"
          placeholder="Figure caption"
        />
        <div className="flex gap-2">
          <button
            onClick={() => {
              // Add caption if none exists
              if (!block.caption) {
                block.caption = {
                  spans: [{ text: 'New caption', bold: false, italic: false, underline: false }]
                };
              }
            }}
            className="text-xs bg-white/10 hover:bg-white/20 px-2 py-1 rounded"
          >
            Add Caption
          </button>
          <button
            onClick={() => {
              // Remove caption
              block.caption = null;
            }}
            className="text-xs bg-red-500/20 hover:bg-red-500/30 px-2 py-1 rounded"
          >
            Remove Caption
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="text-sm text-white/60">
      Block type not supported for editing
    </div>
  );
}

function DocumentPreview({ document }: { document: Document }) {
  return (
    <div className="space-y-4">
      <div className="text-lg font-bold">{document.meta.title || "Untitled Document"}</div>
      {document.sections.map((section, sectionIndex) => (
        <div key={sectionIndex} className="space-y-2">
          {section.header && (
            <div className="text-sm font-medium text-gray-600 border-b pb-1">
              {section.header.blocks.map((block: any) => 
                block.spans?.map((span: any) => span.text).join('') || ''
              ).join(' ')}
            </div>
          )}
          {section.blocks.map((block, blockIndex) => (
            <div key={blockIndex}>
              {renderBlock(block)}
            </div>
          ))}
          {section.footer && (
            <div className="text-sm text-gray-500 border-t pt-1">
              {section.footer.blocks.map((block: any) => 
                block.spans?.map((span: any) => span.text).join('') || ''
              ).join(' ')}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function renderBlock(block: any): JSX.Element {
  if ('level' in block && 'spans' in block) {
    const Tag = `h${block.level}` as keyof JSX.IntrinsicElements;
    return (
      <Tag className="font-bold">
        {block.spans.map((span: any) => span.text).join('')}
      </Tag>
    );
  }
  
  if ('spans' in block) {
    return (
      <p className="mb-2">
        {block.spans.map((span: any, index: number) => (
          <span key={index} className={getSpanClasses(span)}>
            {span.text}
          </span>
        ))}
      </p>
    );
  }
  
  if ('rows' in block) {
    return (
      <table className="border-collapse border border-gray-300 mb-2">
        <tbody>
          {block.rows.map((row: any, rowIndex: number) => (
            <tr key={rowIndex}>
              {row.cells.map((cell: any, cellIndex: number) => (
                <td key={cellIndex} className="border border-gray-300 px-2 py-1">
                  {cell.blocks.map((b: any) => 
                    b.spans?.map((s: any) => s.text).join('') || ''
                  ).join(' ')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    );
  }
  
  if ('image_id' in block) {
    return (
      <div className="mb-2">
        <div className="text-sm text-gray-500">[Image: {block.image_id}]</div>
        {block.caption && (
          <div className="text-sm italic">
            {block.caption.spans.map((span: any) => span.text).join('')}
          </div>
        )}
      </div>
    );
  }
  
  return <div className="text-sm text-gray-500">[Unknown block type]</div>;
}

function getSpanClasses(span: any): string {
  const classes = [];
  if (span.bold) classes.push('font-bold');
  if (span.italic) classes.push('italic');
  if (span.underline) classes.push('underline');
  return classes.join(' ');
}
