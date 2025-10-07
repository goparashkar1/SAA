import React, { useEffect, useRef, useCallback } from "react";
import { PanelKey } from "../types";
import { ChevronRight } from "lucide-react";
import { createLightSweepVars, SIDEBAR_LIGHT_SWEEP_SETTINGS } from "../ui/shimmer";

// Constants for flyout configuration
const FLYOUT_WIDTH = 280;
const FLYOUT_OVERLAP = 10;
const ANIMATION_DURATION = 200;

type SidebarSubItem = { type?: "item"; id: string; label: string; icon: React.ReactNode };
type SidebarGroup = { type: "group"; id: string; label: string; icon?: React.ReactNode; items: SidebarSubItem[] };
type SidebarEntry = SidebarSubItem | SidebarGroup;

interface FlyoutPanelProps {
  isOpen: boolean;
  onClose: () => void;
  activeKey: PanelKey | null;
  subItems: SidebarEntry[];
  anchorWidth: number;
  onItemClick: (key: PanelKey, subId?: string) => void;
  activeSub: Partial<Record<PanelKey, string | null>>;
  openSubGroups: Record<string, boolean>;
  onSubGroupToggle: (groupKey: string) => void;
  onSubItemClick: (key: PanelKey, itemId: string) => void;
}

export default function FlyoutPanel({
  isOpen,
  onClose,
  activeKey,
  subItems,
  anchorWidth,
  onItemClick,
  activeSub,
  openSubGroups,
  onSubGroupToggle,
  onSubItemClick,
}: FlyoutPanelProps) {
  const flyoutRef = useRef<HTMLDivElement>(null);
  const mouseLeaveTimeoutRef = useRef<number | null>(null);

  // Focus management
  useEffect(() => {
    if (isOpen && flyoutRef.current) {
      flyoutRef.current.focus();
    }
  }, [isOpen]);

  // ESC key handler
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Click outside handler
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (flyoutRef.current && !flyoutRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    // Add slight delay to prevent immediate close on open
    const timeoutId = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Mouse leave handler with debounce
  const handleMouseLeave = useCallback(() => {
    if (mouseLeaveTimeoutRef.current) {
      clearTimeout(mouseLeaveTimeoutRef.current);
    }
    
    mouseLeaveTimeoutRef.current = window.setTimeout(() => {
      onClose();
    }, 300); // 300ms delay to prevent accidental closes
  }, [onClose]);

  const handleMouseEnter = useCallback(() => {
    if (mouseLeaveTimeoutRef.current) {
      clearTimeout(mouseLeaveTimeoutRef.current);
      mouseLeaveTimeoutRef.current = null;
    }
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (mouseLeaveTimeoutRef.current) {
        clearTimeout(mouseLeaveTimeoutRef.current);
      }
    };
  }, []);

  if (!isOpen || !activeKey) return null;

  const sweepStyle = createLightSweepVars(SIDEBAR_LIGHT_SWEEP_SETTINGS);

  return (
    <div
      ref={flyoutRef}
      role="dialog"
      aria-label={`${activeKey} submenu`}
      aria-modal="false"
      tabIndex={-1}
      className="fixed z-50 bg-[#263B4C]/65 backdrop-blur-sm border border-white/10 shadow-[4px_4px_4px_rgba(0,0,0,0.25)] text-white overflow-hidden"
      style={{
        left: anchorWidth - FLYOUT_OVERLAP,
        top: 0,
        width: FLYOUT_WIDTH,
        height: "100vh",
        transform: isOpen ? "translateX(0)" : "translateX(-20px)",
        opacity: isOpen ? 1 : 0,
        transition: `transform ${ANIMATION_DURATION}ms ease-out, opacity ${ANIMATION_DURATION}ms ease-out`,
      }}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={handleMouseEnter}
    >
      {/* Responsive scrim for small screens */}
      <div className="absolute inset-0 bg-black/10 backdrop-blur-[1px] md:hidden" />
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <h2 className="text-sm font-semibold text-white/90" style={{ letterSpacing: "0.5px" }}>
            {activeKey}
          </h2>
          <button
            onClick={onClose}
            className="inline-flex h-6 w-6 items-center justify-center rounded border border-white/10 bg-white/5 text-white/70 transition-all duration-150 hover:bg-white/10 focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-200/60"
            aria-label="Close submenu"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto sidebar-scroll px-2 py-3">
          <div className="space-y-2">
            {subItems.map((entry) => {
              if (entry.type === "group") {
                const groupKey = `${activeKey}:${entry.id}`;
                const isOpen = Boolean(openSubGroups[groupKey]);
                const hasActiveChild = entry.items.some((item) => item.id === activeSub[activeKey] ?? null);

                return (
                  <div key={entry.id} className="w-full">
                    <button
                      type="button"
                      onClick={() => onSubGroupToggle(groupKey)}
                      className={`sidebar-button light-sweep-surface relative flex h-8 w-full items-center justify-start gap-1.5 px-2 text-white/90 border-t border-white/10 transition-all duration-200 ease-in-out focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-200/60 ${
                        isOpen || hasActiveChild ? "bg-cyan-600/20 text-white" : "bg-white/5"
                      }`}
                      data-light-sweep="sidebar"
                      style={sweepStyle}
                    >
                      <span className="inline-flex items-center justify-center h-4 w-4 text-white/80 transition-transform duration-200">
                        <ChevronRight
                          className={`h-4 w-4 transition-transform duration-200 ${
                            isOpen ? "rotate-90" : ""
                          }`}
                        />
                      </span>
                      {entry.icon && (
                        <span className="grid place-items-center h-4 w-4 shrink-0 opacity-90">
                          {entry.icon}
                        </span>
                      )}
                      <span
                        className="text-xs leading-tight whitespace-nowrap"
                        style={{ letterSpacing: "0.5px" }}
                      >
                        {entry.label}
                      </span>
                    </button>

                    <div
                      className={`relative w-full pl-5 flex flex-col gap-2 transition-all duration-200 ease-in-out ${
                        isOpen
                          ? "max-h-[960px] opacity-100 mt-2 overflow-visible"
                          : "max-h-0 opacity-0 mt-0 pointer-events-none overflow-hidden"
                      }`}
                      aria-hidden={!isOpen}
                    >
                      {entry.items.map((item) => (
                        <div key={item.id} className="relative">
                          <button
                            type="button"
                            onClick={() => onSubItemClick(activeKey, item.id)}
                            className={`sidebar-button light-sweep-surface relative flex h-8 w-full items-center justify-start gap-2 px-2 select-none cursor-pointer border-t border-white/10 transition-all duration-200 ease-in-out text-white/90 focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-200/60 ${
                              activeSub[activeKey] === item.id ? "bg-cyan-600/20 text-white" : "bg-white/5"
                            }`}
                            data-light-sweep="sidebar"
                            style={sweepStyle}
                          >
                            <span
                              className={`absolute -left-3 top-1/2 -translate-y-1/2 h-2.5 w-2.5 rounded-full border z-10 ${
                                activeSub[activeKey] === item.id
                                  ? "border-cyan-300/70 bg-[#22d3ee]"
                                  : "border-white/40 bg-[#999999]"
                              }`}
                            />
                            <span className="grid place-items-center h-4 w-4 shrink-0 opacity-90">
                              {item.icon}
                            </span>
                            <span
                              className="text-xs leading-tight whitespace-nowrap"
                              style={{ letterSpacing: "0.5px" }}
                            >
                              {item.label}
                            </span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }

              // Direct subitem (not in a group)
              const sub = entry as SidebarSubItem;
              return (
                <div key={sub.id} className="relative">
                  <button
                    type="button"
                    onClick={() => onSubItemClick(activeKey, sub.id)}
                    className={`sidebar-button light-sweep-surface relative flex h-8 w-full items-center justify-start gap-2 px-2 select-none cursor-pointer border-t border-white/10 transition-all duration-200 ease-in-out text-white/90 focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-200/60 ${
                      activeSub[activeKey] === sub.id ? "bg-cyan-600/20 text-white" : "bg-white/5"
                    }`}
                    data-light-sweep="sidebar"
                    style={sweepStyle}
                  >
                    <span
                      className={`absolute -left-3 top-1/2 -translate-y-1/2 h-2.5 w-2.5 rounded-full border z-10 ${
                        activeSub[activeKey] === sub.id
                          ? "border-cyan-300/70 bg-[#22d3ee]"
                          : "border-white/40 bg-[#999999]"
                      }`}
                    />
                    <span className="grid place-items-center h-4 w-4 shrink-0 opacity-90">
                      {sub.icon}
                    </span>
                    <span
                      className="text-xs leading-tight whitespace-nowrap"
                      style={{ letterSpacing: "0.5px" }}
                    >
                      {sub.label}
                    </span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
