export const tools = {
  translate: async (args: any) => ({
    kind: "tool",
    text: `[translate:${args.lang}] ${String(args.text ?? "").slice(0, 400)}`,
  }),
  timeline: async (args: any) => ({
    kind: "tool",
    text: `[timeline built for ${args.query ?? "n/a"}]`,
  }),
  extractIOCs: async (args: any) => ({
    kind: "tool",
    text: `Found ${args.sampleCount ?? 0} IOCs`,
  }),
};

export const commandHints = [
  "/summarize",
  "/timeline",
  "/entity-map",
  "/translate fa",
  "/extract IOCs",
  "/export md",
];
