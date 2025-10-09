export async function streamChat({
  model = "gpt-4o-mini",
  messages,
  tools,
}: {
  model?: string;
  messages: any[];
  tools?: any[];
}) {
  const res = await fetch("/api/copilot/stream", {
    method: "POST",
    body: JSON.stringify({ model, messages, tools }),
    headers: { "Content-Type": "application/json" },
  });

  if (!res.body) {
    throw new Error("No stream");
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();

  return {
    async *[Symbol.asyncIterator]() {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        yield decoder.decode(value, { stream: true });
      }
    },
  };
}
