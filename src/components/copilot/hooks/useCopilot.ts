import React from "react";
import { streamChat } from "../../../lib/chat/openaiClient";
import { loadThreads, saveThreads, summarize } from "../../../lib/chat/memory";
import type { Attachment, CopilotMessage, Thread } from "../types";
import { tools, commandHints } from "../Toolbelt";

export type CopilotMode = "answer" | "plan" | "write" | "translate";

type CopilotContextValue = {
  isOpen: boolean;
  toggleOpen: () => void;
  setOpen: (value: boolean) => void;
  threads: Thread[];
  activeThread: Thread | null;
  selectThread: (id: string) => void;
  createThread: () => void;
  deleteThread: (id: string) => void;
  pinThread: (id: string, pinned: boolean) => void;
  sendMessage: (payload?: { text?: string; attachments?: Attachment[] }) => Promise<void>;
  composerValue: string;
  setComposerValue: (value: string) => void;
  attachments: Attachment[];
  addAttachment: (attachment: Attachment) => void;
  removeAttachment: (id: string) => void;
  mode: CopilotMode;
  setMode: (mode: CopilotMode) => void;
  isPaletteOpen: boolean;
  openPalette: () => void;
  closePalette: () => void;
  commandHints: string[];
  loading: boolean;
  dockExpanded: boolean;
  expandDock: () => void;
  collapseDock: () => void;
};

const CopilotContext = React.createContext<CopilotContextValue | null>(null);

const createId = () =>
  typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

function freshThread(): Thread {
  const now = new Date().toISOString();
  return {
    id: createId(),
    title: "New Chat",
    messages: [],
    updatedAt: now,
  };
}

export function CopilotProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setOpen] = React.useState(false);
  const [threads, internalSetThreads] = React.useState<Thread[]>([]);
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [composerValue, setComposerValue] = React.useState("");
  const [attachments, setAttachments] = React.useState<Attachment[]>([]);
  const [mode, setMode] = React.useState<CopilotMode>("answer");
  const [isPaletteOpen, setPaletteOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [dockExpanded, setDockExpanded] = React.useState(false);
  const expandDock = React.useCallback(() => setDockExpanded(true), []);
  const collapseDock = React.useCallback(() => setDockExpanded(false), []);

  const setThreads = React.useCallback((updater: (prev: Thread[]) => Thread[]) => {
    internalSetThreads((prev) => {
      const next = updater(prev);
      saveThreads(next);
      return next;
    });
  }, []);

  React.useEffect(() => {
    const stored = loadThreads();
    if (stored.length) {
      internalSetThreads(stored);
      setActiveId(stored[0].id);
    } else {
      const thread = freshThread();
      internalSetThreads([thread]);
      saveThreads([thread]);
      setActiveId(thread.id);
    }
  }, []);

  const activeThread = React.useMemo(() => threads.find((t) => t.id === activeId) ?? null, [threads, activeId]);

  const ensureThread = React.useCallback(() => {
    if (activeThread) return activeThread;
    let created: Thread | null = null;
    setThreads((prev) => {
      created = freshThread();
      return [created!, ...prev];
    });
    if (created) {
      setActiveId(created.id);
      return created;
    }
    return null;
  }, [activeThread, setThreads]);

  const selectThread = React.useCallback(
    (id: string) => {
      setActiveId(id);
      setOpen(true);
    },
    []
  );

  const createThread = React.useCallback(() => {
    const thread = freshThread();
    setThreads((prev) => [thread, ...prev]);
    setActiveId(thread.id);
    setOpen(true);
  }, [setThreads]);

  const deleteThread = React.useCallback(
    (id: string) => {
      setThreads((prev) => {
        const filtered = prev.filter((thread) => thread.id !== id);
        if (!filtered.length) {
          const replacement = freshThread();
          setActiveId(replacement.id);
          return [replacement];
        }
        if (activeId === id) {
          setActiveId(filtered[0].id);
        }
        return filtered;
      });
    },
    [activeId, setThreads]
  );

  React.useEffect(() => {
    if (!isOpen) {
      setDockExpanded(false);
    }
  }, [isOpen]);

  React.useEffect(() => {
    if (!isOpen && !dockExpanded) return;
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && target.closest('[data-copilot-interactive="true"]')) {
        return;
      }
      setOpen(false);
      setDockExpanded(false);
    };
    window.addEventListener('pointerdown', handlePointerDown, true);
    return () => window.removeEventListener('pointerdown', handlePointerDown, true);
  }, [isOpen, dockExpanded, setOpen, setDockExpanded]);

  const pinThread = React.useCallback(
    (id: string, pinned: boolean) => {
      setThreads((prev) =>
        prev.map((thread) => (thread.id === id ? { ...thread, pinned, updatedAt: new Date().toISOString() } : thread))
      );
    },
    [setThreads]
  );

  const addAttachment = React.useCallback((attachment: Attachment) => {
    setAttachments((prev) => [...prev, attachment]);
  }, []);

  const removeAttachment = React.useCallback((id: string) => {
    setAttachments((prev) =>
      prev.filter((attachment) => {
        const key = attachment.kind === "file" ? attachment.id : attachment.kind === "url" ? attachment.url : attachment.widgetId;
        return key !== id;
      })
    );
  }, []);

  const resetComposer = React.useCallback(() => {
    setComposerValue("");
    setAttachments([]);
  }, []);

  const appendMessage = React.useCallback(
    (threadId: string, message: CopilotMessage) => {
      let updatedThread: Thread | null = null;
      setThreads((prev) => {
        const next = prev.map((thread) => {
          if (thread.id !== threadId) return thread;
          const updated: Thread = {
            ...thread,
            title:
              thread.messages.length === 0 && message.role === "user" && message.text
                ? message.text.length > 48
                  ? `${message.text.slice(0, 48)}...`
                  : message.text
                : thread.title,
            messages: [...thread.messages, message],
            updatedAt: message.createdAt,
          };
          updatedThread = updated;
          return updated;
        });
        return next;
      });
      return updatedThread;
    },
    [setThreads]
  );

  const updateMessage = React.useCallback(
    (threadId: string, messageId: string, updater: (message: CopilotMessage) => CopilotMessage) => {
      setThreads((prev) =>
        prev.map((thread) => {
          if (thread.id !== threadId) return thread;
          return {
            ...thread,
            messages: thread.messages.map((message) => (message.id === messageId ? updater(message) : message)),
            updatedAt: new Date().toISOString(),
          };
        })
      );
    },
    [setThreads]
  );

  const sendMessage = React.useCallback(
    async ({ text, attachments: incomingAttachments }: { text?: string; attachments?: Attachment[] } = {}) => {
      const thread = ensureThread();
      if (!thread) return;
      const trimmed = (text ?? composerValue).trim();
      const combinedAttachments = [...attachments, ...(incomingAttachments ?? [])];
      if (!trimmed && combinedAttachments.length === 0) return;

      setLoading(true);
      const createdAt = new Date().toISOString();
      const userMessage: CopilotMessage = {
        id: createId(),
        role: "user",
        text: trimmed,
        attachments: combinedAttachments,
        createdAt,
      };

      appendMessage(thread.id, userMessage);
      resetComposer();

      const firstToken = trimmed.split(" ")[0];
      if (firstToken.startsWith("/")) {
        const command = firstToken.slice(1);
        const toolEntry = Object.entries(tools).find(([name]) => name.toLowerCase() === command.toLowerCase());
        if (toolEntry) {
          const [name, handler] = toolEntry;
          try {
            const result = await handler({
              raw: trimmed,
              command: name,
              text: trimmed.slice(firstToken.length).trim(),
            });
            appendMessage(thread.id, {
              id: createId(),
              role: "tool",
              text: result.text,
              attachments: combinedAttachments,
              createdAt: new Date().toISOString(),
              meta: { tool: name },
            });
          } catch (error) {
            appendMessage(thread.id, {
              id: createId(),
              role: "assistant",
              text: `Tool error: ${error instanceof Error ? error.message : "Unknown"}`,
              createdAt: new Date().toISOString(),
            });
          } finally {
            setLoading(false);
          }
          return;
        }
      }

      const assistantId = createId();
      appendMessage(thread.id, {
        id: assistantId,
        role: "assistant",
        text: "",
        createdAt: new Date().toISOString(),
      });

      try {
        const memorySummary = await summarize(thread.messages);
        const iterator = await streamChat({
          messages: thread.messages
            .concat(userMessage)
            .map((message) => ({ role: message.role, content: message.text ?? "" })),
          tools: undefined,
          model: "gpt-4o-mini",
        });

        let buffer = "";
        for await (const chunk of iterator) {
          buffer += chunk;
          updateMessage(thread.id, assistantId, (message) => ({
            ...message,
            text: buffer,
            meta: { ...message.meta, summary: memorySummary },
          }));
        }
      } catch (error) {
        updateMessage(thread.id, assistantId, (message) => ({
          ...message,
          text: `Stream failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        }));
      } finally {
        setLoading(false);
      }
    },
    [appendMessage, attachments, composerValue, ensureThread, resetComposer, updateMessage]
  );

  const value = React.useMemo<CopilotContextValue>(
    () => ({
      isOpen,
      toggleOpen: () => setOpen((prev) => !prev),
      setOpen,
      threads,
      activeThread,
      selectThread,
      createThread,
      deleteThread,
      pinThread,
      sendMessage,
      composerValue,
      setComposerValue,
      attachments,
      addAttachment,
      removeAttachment,
      mode,
      setMode,
      isPaletteOpen,
      openPalette: () => setPaletteOpen(true),
      closePalette: () => setPaletteOpen(false),
      commandHints,
      loading,
      dockExpanded,
      expandDock,
      collapseDock,
    }),
    [
      isOpen,
      threads,
      activeThread,
      selectThread,
      createThread,
      deleteThread,
      pinThread,
      sendMessage,
      composerValue,
      attachments,
      mode,
      isPaletteOpen,
      loading,
      addAttachment,
      removeAttachment,
      dockExpanded,
      expandDock,
      collapseDock,
    ]
  );

    return React.createElement(CopilotContext.Provider, { value }, children);
}

export function useCopilot() {
  const ctx = React.useContext(CopilotContext);
  if (!ctx) {
    throw new Error("useCopilot must be used within CopilotProvider");
  }
  return ctx;
}

export function useCopilotHotkeys() {
  const { toggleOpen, setOpen, isOpen, openPalette, closePalette, isPaletteOpen, collapseDock, dockExpanded } = useCopilot();
  React.useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const isMeta = event.metaKey || event.ctrlKey;
      if (isMeta && event.key.toLowerCase() === "j") {
        event.preventDefault();
        toggleOpen();
      }
      if (isMeta && event.key.toLowerCase() === "k") {
        event.preventDefault();
        if (isPaletteOpen) {
          closePalette();
        } else {
          openPalette();
        }
      }
      if (event.key === "Escape") {
        if (isOpen) {
          setOpen(false);
          collapseDock();
        } else if (dockExpanded) {
          collapseDock();
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [toggleOpen, setOpen, isOpen, openPalette, closePalette, isPaletteOpen, collapseDock, dockExpanded]);
}

export { commandHints };


















