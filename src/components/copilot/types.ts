export type Attachment =
  | { kind: "file"; id: string; name: string; mime: string; size: number }
  | { kind: "url"; url: string; title?: string }
  | { kind: "widget"; widgetId: string; snapshotPath?: string };

export type ToolCall = { name: string; args: Record<string, any> };

export type CopilotMessage = {
  id: string;
  role: "user" | "assistant" | "tool";
  text?: string;
  attachments?: Attachment[];
  toolCalls?: ToolCall[];
  createdAt: string;
  meta?: Record<string, any>;
};

export type Thread = {
  id: string;
  title: string;
  messages: CopilotMessage[];
  pinned?: boolean;
  updatedAt: string;
};
