import React from "react";
import { ClipboardList, FileDown, Save } from "lucide-react";
import type { Thread, CopilotMessage, Attachment } from "./types";

const ROLE_LABEL: Record<CopilotMessage["role"], string> = {
  user: "You",
  assistant: "Copilot",
  tool: "Tool",
};

function escapeHtml(input: string) {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function renderMarkdown(text?: string) {
  if (!text) return null;
  const nodes: React.ReactNode[] = [];
  const parts = text.split(/```/g);
  parts.forEach((part, idx) => {
    if (idx % 2 === 1) {
      const [firstLine, ...rest] = part.split("\n");
      const language = firstLine.trim();
      const code = rest.join("\n");
      nodes.push(
        <pre
          key={`code-${idx}`}
          className="mt-2 overflow-auto rounded border border-white/10 bg-[#0E1A25] px-3 py-2 text-xs text-white/80"
        >
          <code className="block whitespace-pre text-[13px] leading-relaxed text-cyan-100">
            {code}
          </code>
        </pre>
      );
      if (language) {
        nodes.push(
          <div key={`code-lang-${idx}`} className="mt-1 text-[11px] uppercase tracking-wide text-white/40">
            {language}
          </div>
        );
      }
    } else {
      const lines = part.split(/\n{2,}/);
      lines.forEach((block, blockIdx) => {
        const trimmed = block.trim();
        if (!trimmed) return;
        const tableLines = trimmed.split("\n");
        const isTable = tableLines.length > 1 && tableLines.every((line) => line.includes("|"));
        if (isTable) {
          const rows = tableLines.map((line) => line.split("|").map((cell) => cell.trim()).filter(Boolean));
          nodes.push(
            <div key={`table-${idx}-${blockIdx}`} className="mt-3 overflow-hidden rounded border border-white/10">
              <table className="w-full text-left text-sm text-white/80">
                <tbody>
                  {rows.map((row, rowIdx) => (
                    <tr key={`row-${rowIdx}`} className={rowIdx === 0 ? "bg-white/5 text-white" : "odd:bg-white/5 even:bg-transparent"}>
                      {row.map((cell, cellIdx) => (
                        <td key={`cell-${cellIdx}`} className="px-3 py-2">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        } else if (trimmed.startsWith("- ")) {
          const items = trimmed.split("\n").map((line) => line.replace(/^\s*-\s*/, "").trim());
          nodes.push(
            <ul key={`list-${idx}-${blockIdx}`} className="mt-2 space-y-1 text-sm text-white/80">
              {items.map((item, itemIdx) => (
                <li key={`item-${itemIdx}`} className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-cyan-300/70" />
                  <span dangerouslySetInnerHTML={{ __html: escapeHtml(item).replace(/\n/g, "<br />") }} />
                </li>
              ))}
            </ul>
          );
        } else {
          nodes.push(
            <p
              key={`paragraph-${idx}-${blockIdx}`}
              className="mt-2 text-sm leading-relaxed text-white/80"
              dangerouslySetInnerHTML={{ __html: escapeHtml(trimmed).replace(/\n/g, "<br />") }}
            />
          );
        }
      });
    }
  });
  return nodes;
}

function AttachmentChips({ attachments }: { attachments?: Attachment[] }) {
  if (!attachments?.length) return null;
  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {attachments.map((attachment) => (
        <span
          key={attachment.kind === "file" ? attachment.id : attachment.kind === "url" ? attachment.url : attachment.widgetId}
          className="inline-flex items-center gap-1 rounded border border-cyan-900/30 bg-white/5 px-2 py-1 text-xs text-white/70"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-cyan-400/70" />
          {attachment.kind === "file" && `${attachment.name}`}
          {attachment.kind === "url" && `${attachment.title ?? attachment.url}`}
          {attachment.kind === "widget" && `Widget: ${attachment.widgetId}`}
        </span>
      ))}
    </div>
  );
}

function AssistantActions({ message }: { message: CopilotMessage }) {
  const actions = [
    { label: "Save to Report", icon: Save },
    { label: "Add to Case", icon: ClipboardList },
    { label: "Export", icon: FileDown },
  ];
  return (
    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-white/60">
      {actions.map(({ label, icon: Icon }) => (
        <button
          key={label}
          type="button"
          className="inline-flex items-center gap-1 rounded border border-white/10 bg-white/5 px-2 py-1 transition-all duration-150 hover:bg-white/10"
          onClick={() => console.info(`${label} clicked for`, message.id)}
        >
          <Icon className="h-3.5 w-3.5" />
          {label}
        </button>
      ))}
    </div>
  );
}

export type MessageStreamProps = {
  thread: Thread | null;
  loading?: boolean;
};

export default function MessageStream({ thread, loading }: MessageStreamProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const el = containerRef.current;
    if (el) {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    }
  }, [thread?.messages?.length, loading]);

  if (!thread) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-white/60">
        Select a thread to get started.
      </div>
    );
  }

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto pr-3">
      <div className="space-y-6">
        {thread.messages.map((message) => {
          const isUser = message.role === "user";
          const alignment = isUser ? "items-end" : "items-start";
          const bubbleClasses = isUser
            ? "bg-cyan-500/20 border-cyan-500/40"
            : message.role === "tool"
            ? "bg-white/5 border-cyan-900/30"
            : "bg-white/8 border-cyan-900/30";
          return (
            <div key={message.id} className={`flex flex-col ${alignment}`}>
              <div className="mb-1 text-xs uppercase tracking-wide text-white/50">
                {ROLE_LABEL[message.role]}
              </div>
              <div className={`w-full max-w-3xl rounded border px-4 py-3 text-sm text-white/90 ${bubbleClasses}`}>
                {renderMarkdown(message.text)}
                <AttachmentChips attachments={message.attachments} />
                {message.role === "assistant" && <AssistantActions message={message} />}
              </div>
            </div>
          );
        })}
        {loading && (
          <div className="flex items-center gap-2 text-xs text-cyan-200/70">
            <span className="h-2 w-2 animate-pulse rounded-full bg-cyan-300" /> Streaming response...
          </div>
        )}
      </div>
    </div>
  );
}

