import React from "react";
import { X, Sparkles } from "lucide-react";
import { useCopilot } from "./hooks/useCopilot";
import ThreadList from "./ThreadList";
import MessageStream from "./MessageStream";
import Composer from "./Composer";
import SettingsPopover from "./SettingsPopover";

type CopilotPanelProps = {
  sidebarCollapsed: boolean;
};

export default function CopilotPanel({ sidebarCollapsed }: CopilotPanelProps) {
  const {
    isOpen,
    setOpen,
    threads,
    activeThread,
    selectThread,
    createThread,
    deleteThread,
    pinThread,
    loading,
  } = useCopilot();
  const [model, setModel] = React.useState("gpt-4o-mini");
  const [temperature, setTemperature] = React.useState(0.2);
  const [includeContext, setIncludeContext] = React.useState(true);
  const panelRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (isOpen && panelRef.current) {
      panelRef.current.focus();
    }
  }, [isOpen]);

  const expandedWidth = sidebarCollapsed ? 560 : 640;
  const baseClasses =
    "copilot-panel relative flex h-full min-h-0 flex-col overflow-hidden border-l border-cyan-900/30 bg-[#0B1520]/95 text-white shadow-[0_0_28px_rgba(5,15,30,0.55)] transition-[width,opacity] duration-300 ease-out";
  const stateClasses = isOpen ? " opacity-100 pointer-events-auto" : " opacity-0 pointer-events-none";

  return (
    <div
      ref={panelRef}
      data-copilot-interactive="true"
      tabIndex={isOpen ? 0 : -1}
      className={baseClasses + stateClasses}
      style={{ width: isOpen ? expandedWidth : 0 }}
      aria-hidden={!isOpen}
    >
      <div className="flex h-full min-h-0">
        <div className="flex min-h-0 flex-1 flex-col backdrop-blur-[2px]">
          <header className="flex items-center justify-between border-b border-cyan-900/30 px-6 py-4">
            <div>
              <div className="flex items-center gap-2 text-sm text-white/60">
                <Sparkles className="h-4 w-4 text-cyan-300" />
                Microsint Copilot
              </div>
              <h1 className="text-lg font-semibold text-white/90">
                {activeThread?.title ?? "New Conversation"}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <SettingsPopover
                model={model}
                onModelChange={setModel}
                temperature={temperature}
                onTemperatureChange={setTemperature}
                includeContext={includeContext}
                onIncludeContextChange={setIncludeContext}
              />
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded border border-white/10 bg-white/5 text-white/70 transition-all duration-150 hover:bg-white/10"
                aria-label="Close Copilot"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </header>

          <div className="flex min-h-0 flex-1 flex-col px-6 py-4">
            <MessageStream thread={activeThread} loading={loading} />
          </div>

          <Composer />
        </div>

        <ThreadList
          threads={threads}
          activeId={activeThread?.id ?? null}
          onSelect={selectThread}
          onNewThread={createThread}
          onDelete={deleteThread}
          onTogglePin={pinThread}
          side="right"
        />
      </div>
    </div>
  );
}

