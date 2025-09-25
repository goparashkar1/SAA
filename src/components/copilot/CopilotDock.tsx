import React from "react";
import { Bot, Send, Plus, Paperclip, Link2, Monitor } from "lucide-react";
import { useCopilot } from "./hooks/useCopilot";
import type { Attachment } from "./types";

export type CopilotDockProps = {
  collapsed?: boolean;
};

const createId = () =>
  typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

type MenuPosition = { bottom: number; right: number };

export default function CopilotDock({ collapsed = false }: CopilotDockProps) {
  const {
    setOpen,
    isOpen,
    sendMessage,
    loading,
    dockExpanded,
    expandDock,
    collapseDock,
    addAttachment,
  } = useCopilot();
  const [draft, setDraft] = React.useState("");
  const [showActions, setShowActions] = React.useState(false);
  const [menuPosition, setMenuPosition] = React.useState<MenuPosition>({ bottom: 56, right: 0 });
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);
  const actionsRef = React.useRef<HTMLDivElement | null>(null);
  const triggerRef = React.useRef<HTMLButtonElement | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const adjustTextareaHeight = React.useCallback(() => {
    const node = textareaRef.current;
    if (!node) return;
    node.style.height = "auto";
    if (!dockExpanded) {
      node.style.height = "40px";
      return;
    }
    const maxHeight = 160;
    node.style.height = `${Math.min(node.scrollHeight, maxHeight)}px`;
  }, [dockExpanded]);

  React.useEffect(() => {
    adjustTextareaHeight();
  }, [draft, adjustTextareaHeight]);

  React.useEffect(() => {
    if (!showActions) return;
    const handlePointer = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      if (actionsRef.current?.contains(target)) return;
      if (triggerRef.current?.contains(target)) return;
      setShowActions(false);
    };
    window.addEventListener("pointerdown", handlePointer, true);
    return () => window.removeEventListener("pointerdown", handlePointer, true);
  }, [showActions]);

  const recalcMenuPosition = React.useCallback(() => {
    const trigger = triggerRef.current;
    const container = containerRef.current;
    if (!trigger || !container) return;

    const containerRect = container.getBoundingClientRect();
    const triggerRect = trigger.getBoundingClientRect();
    setMenuPosition({
      bottom: Math.max(48, containerRect.bottom - triggerRect.top + 12),
      right: Math.max(0, containerRect.right - triggerRect.right),
    });
  }, []);

  React.useLayoutEffect(() => {
    if (!showActions) return;
    recalcMenuPosition();

    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(recalcMenuPosition);
      if (containerRef.current) {
        observer.observe(containerRef.current);
      }
    }

    window.addEventListener("resize", recalcMenuPosition);
    window.addEventListener("scroll", recalcMenuPosition, true);

    return () => {
      window.removeEventListener("resize", recalcMenuPosition);
      window.removeEventListener("scroll", recalcMenuPosition, true);
      observer?.disconnect();
    };
  }, [showActions, recalcMenuPosition]);

  const handleSubmit = React.useCallback(
    async (event?: React.FormEvent) => {
      if (event) event.preventDefault();
      const text = draft.trim();
      if (!text || loading) return;
      setShowActions(false);
      setOpen(true);
      await sendMessage({ text });
      setDraft("");
      collapseDock();
    },
    [draft, loading, sendMessage, setOpen, collapseDock]
  );

  const handleFocus = React.useCallback(() => {
    if (!dockExpanded) {
      expandDock();
    }
  }, [dockExpanded, expandDock]);

  const handleFileChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
      const attachment: Attachment = {
        kind: "file",
        id: createId(),
        name: file.name,
        mime: file.type,
        size: file.size,
      };
      addAttachment(attachment);
      setShowActions(false);
      expandDock();
      event.target.value = "";
    },
    [addAttachment, expandDock]
  );

  const handleAddUrl = React.useCallback(() => {
    const url = window.prompt("Attach URL");
    if (!url) return;
    addAttachment({ kind: "url", url, title: url });
    setShowActions(false);
    expandDock();
  }, [addAttachment, expandDock]);

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
    } catch (error) {
      console.warn("Widget snapshot failed", error);
      addAttachment({ kind: "widget", widgetId });
    } finally {
      setShowActions(false);
      expandDock();
    }
  }, [addAttachment, expandDock]);

  const expanded = dockExpanded;

  if (collapsed) {
    return (
      <button
        type="button"
        data-copilot-interactive="true"
        onClick={() => {
          collapseDock();
          setOpen(!isOpen);
        }}
        className="group relative mt-3 inline-flex h-10 w-full items-center justify-center overflow-hidden border border-white/10 bg-white/5 text-white/80 transition-all duration-200 hover:text-white focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-200/60"
        aria-label="Toggle Copilot"
      >
        <Bot className="h-4 w-4" />
      </button>
    );
  }

  return (
    <div
      ref={containerRef}
      data-copilot-interactive="true"
      aria-expanded={expanded}
      className="copilot-dock relative origin-bottom"
    >
      <div
        className={
          "overflow-hidden rounded border border-white/10 bg-white/5 text-sm text-white/70 transition-all duration-300 ease-out" +
          (expanded ? " max-h-[280px] p-3 shadow-[0_18px_34px_rgba(4,20,34,0.45)] backdrop-blur-sm opacity-100" : " max-h-[140px] p-2 opacity-95")
        }
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
          <div
            className={
              "flex items-center gap-2 text-xs uppercase tracking-wide text-white/60 transition-opacity duration-200" +
              (expanded ? " opacity-100" : " opacity-80")
            }
          >
            <Bot className="h-4 w-4 text-cyan-300" />
            Copilot
          </div>
          <div className="flex items-end gap-2">
            <textarea
              ref={textareaRef}
              rows={1}
              value={draft}
              onFocus={handleFocus}
              onChange={(event) => {
                const value = event.target.value;
                setDraft(value);
                if (value && !dockExpanded) {
                  expandDock();
                }
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  handleSubmit();
                }
              }}
              placeholder="Ask or type /command"
              className={
                "flex-1 min-h-[40px] max-h-40 resize-none rounded border border-cyan-900/40 bg-[#0B1520] px-2 py-2 text-sm leading-5 text-white/90 shadow-inner transition-all duration-200 focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-cyan-200/60" +
                (expanded ? " bg-[#0F1C2B]" : " bg-[#0B1520]")
              }
            />
            <div className="relative flex items-center gap-1">
              <button
                type="button"
                ref={triggerRef}
                onClick={() => setShowActions((prev) => !prev)}
                className={
                  "inline-flex h-9 w-9 items-center justify-center rounded border text-white transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-200/60" +
                  (showActions
                    ? " border-cyan-500/50 bg-cyan-500/20"
                    : " border-white/10 bg-white/5 hover:bg-white/10")
                }
                aria-haspopup="menu"
                aria-expanded={showActions}
              >
                <Plus className="h-4 w-4" />
              </button>
              <button
                type="submit"
                className="inline-flex h-9 w-9 items-center justify-center rounded border border-cyan-500/40 bg-cyan-500/20 text-white transition-all duration-200 hover:bg-cyan-500/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-200/60 disabled:opacity-60"
                disabled={loading}
              >
                <Send className="h-4 w-4" />
              </button>
              <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} />
            </div>
          </div>
          <div
            className={
              "text-[10px] uppercase tracking-wide text-white/45 transition-all duration-200" +
              (expanded ? " opacity-100" : " opacity-0 translate-y-1")
            }
          >
            Ctrl / ? + J to Expand
          </div>
        </form>
      </div>

      {showActions ? (
        <div
          ref={actionsRef}
          data-copilot-interactive="true"
          className="absolute z-30 w-44 overflow-hidden rounded border border-cyan-900/30 bg-[#0B1520] text-left text-sm text-white/80 shadow-xl transition-all duration-200"
          style={{ bottom: menuPosition.bottom, right: menuPosition.right }}
        >
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex w-full items-center gap-2 px-3 py-2 transition-all duration-150 hover:bg-white/5"
          >
            <Paperclip className="h-3.5 w-3.5" />
            Upload file
          </button>
          <button
            type="button"
            onClick={handleAddUrl}
            className="flex w-full items-center gap-2 px-3 py-2 transition-all duration-150 hover:bg-white/5"
          >
            <Link2 className="h-3.5 w-3.5" />
            Add link
          </button>
          <button
            type="button"
            onClick={handleAddWidget}
            className="flex w-full items-center gap-2 px-3 py-2 transition-all duration-150 hover:bg-white/5"
          >
            <Monitor className="h-3.5 w-3.5" />
            Snapshot widget
          </button>
        </div>
      ) : null}
    </div>
  );
}
