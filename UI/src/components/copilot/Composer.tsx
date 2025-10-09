import React from "react";
import { Paperclip, Send, Link2, Monitor, Sparkles } from "lucide-react";
import type { Attachment } from "./types";
import { useCopilot, commandHints } from "./hooks/useCopilot";

const MODES = [
  { key: "answer", label: "Answer" },
  { key: "plan", label: "Plan" },
  { key: "write", label: "Write" },
  { key: "translate", label: "Translate" },
] as const;

const createId = () =>
  typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

export default function Composer() {
  const {
    composerValue,
    setComposerValue,
    sendMessage,
    attachments,
    addAttachment,
    removeAttachment,
    mode,
    setMode,
    loading,
  } = useCopilot();
  const [showHints, setShowHints] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const handleSend = React.useCallback(async () => {
    await sendMessage();
  }, [sendMessage]);

  const onSubmit = React.useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      if (loading) return;
      await handleSend();
    },
    [handleSend, loading]
  );

  const handleKeyDown = React.useCallback(
    async (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        if (!loading) {
          await handleSend();
        }
      }
    },
    [handleSend, loading]
  );

  const filteredHints = React.useMemo(() => {
    if (!showHints) return [] as string[];
    const value = composerValue.trim().toLowerCase();
    if (!value.startsWith("/")) return [];
    return commandHints.filter((hint) => hint.toLowerCase().startsWith(value));
  }, [composerValue, showHints]);

  const addFileAttachment = React.useCallback((file: File) => {
    const attachment: Attachment = {
      kind: "file",
      id: createId(),
      name: file.name,
      mime: file.type,
      size: file.size,
    };
    addAttachment(attachment);
  }, [addAttachment]);

  const handleFileChange = React.useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      addFileAttachment(file);
      event.target.value = "";
    }
  }, [addFileAttachment]);

  const handleAddUrl = React.useCallback(() => {
    const url = window.prompt("Attach URL");
    if (!url) return;
    addAttachment({ kind: "url", url, title: url });
  }, [addAttachment]);

  const handleAddWidget = React.useCallback(async () => {
    const widgetId = window.prompt("Widget ID for snapshot");
    if (!widgetId) return;
    try {
      const res = await fetch("/api/copilot/snapshot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ widgetId }),
      });
      const data = res.ok ? await res.json() : null;
      addAttachment({ kind: "widget", widgetId, snapshotPath: data?.snapshotPath });
    } catch (err) {
      console.warn("Widget snapshot failed", err);
      addAttachment({ kind: "widget", widgetId });
    }
  }, [addAttachment]);

  return (
    <form onSubmit={onSubmit} className="border-t border-cyan-900/30 bg-[#0E1A25] px-4 py-4">
      <div className="mb-3 flex items-center gap-2 text-xs text-white/60">
        {MODES.map((entry) => (
          <button
            key={entry.key}
            type="button"
            onClick={() => setMode(entry.key)}
            className={`inline-flex items-center gap-1 rounded border px-2 py-1 transition-all duration-150 ${
              mode === entry.key
                ? "border-cyan-400/40 bg-cyan-500/20 text-white"
                : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
            }`}
          >
            {entry.key === "plan" ? <Sparkles className="h-3.5 w-3.5" /> : null}
            {entry.label}
          </button>
        ))}
      </div>

      <div className="relative">
        <textarea
          value={composerValue}
          onChange={(event) => {
            setComposerValue(event.target.value);
            setShowHints(event.target.value.trim().startsWith("/"));
          }}
          onKeyDown={handleKeyDown}
          placeholder="Ask Copilot or type / for commands"
          className="h-28 w-full resize-none rounded border border-cyan-900/30 bg-[#0B1520] px-3 py-3 text-sm text-white/90 focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-cyan-200/60"
        />
        {filteredHints.length > 0 && (
          <div className="absolute bottom-24 left-0 w-64 rounded border border-cyan-900/40 bg-[#0B1520] text-sm text-white/80 shadow-lg">
            {filteredHints.map((hint) => (
              <button
                key={hint}
                type="button"
                onClick={() => {
                  setComposerValue(hint + " ");
                  setShowHints(false);
                }}
                className="flex w-full items-center justify-between px-3 py-2 text-left transition-all duration-150 hover:bg-white/5"
              >
                <span>{hint}</span>
                <span className="text-[10px] uppercase tracking-wide text-white/40">Tab</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {attachments.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {attachments.map((attachment) => (
            <span
              key={attachment.kind === "file" ? attachment.id : attachment.kind === "url" ? attachment.url : attachment.widgetId}
              className="inline-flex items-center gap-2 rounded border border-cyan-900/30 bg-white/5 px-2 py-1 text-xs text-white/70"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-300/80" />
              {attachment.kind === "file" && attachment.name}
              {attachment.kind === "url" && (attachment.title ?? attachment.url)}
              {attachment.kind === "widget" && `Widget ${attachment.widgetId}`}
              <button
                type="button"
                onClick={() => removeAttachment(attachment.id ?? attachment.widgetId ?? attachment.url)}
                className="text-white/40 transition-colors duration-150 hover:text-white"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="mt-4 flex items-center justify-between text-sm text-white/70">
        <div className="flex items-center gap-2">
          <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1 rounded border border-white/10 bg-white/5 px-2 py-1 transition-all duration-150 hover:bg-white/10"
          >
            <Paperclip className="h-3.5 w-3.5" />
            File
          </button>
          <button
            type="button"
            onClick={handleAddUrl}
            className="inline-flex items-center gap-1 rounded border border-white/10 bg-white/5 px-2 py-1 transition-all duration-150 hover:bg-white/10"
          >
            <Link2 className="h-3.5 w-3.5" />
            URL
          </button>
          <button
            type="button"
            onClick={handleAddWidget}
            className="inline-flex items-center gap-1 rounded border border-white/10 bg-white/5 px-2 py-1 transition-all duration-150 hover:bg-white/10"
          >
            <Monitor className="h-3.5 w-3.5" />
            Snapshot
          </button>
        </div>
        <button
          type="submit"
          className="inline-flex items-center gap-2 rounded border border-cyan-500/40 bg-cyan-500/20 px-3 py-1.5 text-white transition-all duration-150 hover:bg-cyan-500/30 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={loading}
        >
          <Send className="h-4 w-4" />
          Send
        </button>
      </div>
    </form>
  );
}


