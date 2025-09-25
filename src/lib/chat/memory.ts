import type { Thread } from "../../components/copilot/types";

const KEY = "microsint.copilot.threads";

export const loadThreads = (): Thread[] => {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
};

export const saveThreads = (threads: Thread[]) => {
  localStorage.setItem(KEY, JSON.stringify(threads));
};

export function upsertThread(threads: Thread[], thread: Thread) {
  const cloned = [...threads];
  const index = cloned.findIndex((t) => t.id === thread.id);
  if (index >= 0) {
    cloned[index] = thread;
  } else {
    cloned.unshift(thread);
  }
  saveThreads(cloned);
  return cloned;
}

export async function summarize(messages: Thread["messages"]) {
  try {
    const res = await fetch("/api/copilot/summarize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages }),
    });
    if (res.ok) {
      const data = await res.json();
      if (typeof data?.summary === "string") return data.summary;
    }
  } catch (err) {
    console.warn("Copilot summarize failed", err);
  }
  return messages.slice(-5).map((m) => `${m.role}: ${m.text ?? ""}`).join("\n");
}
