// Importing React and necessary hooks for state management, side effects, and DOM references
import React, { useState, useEffect, useRef } from "react";
// Importing various icons from lucide-react for header navigation elements
import { Bell, Database, Settings, UserCircle2, Sun, Moon, Search, ChevronLeft } from "lucide-react";
import SecretHub from "./SecretHub";
import { useTheme } from "../lib/theme/ThemeContext";

// Main Header component with props for sidebar state management
export default function Header({
  sidebarCollapsed, // Used to line the header logo up with the sidebar midpoint
  onToggleSidebar,  // Sidebar toggle handler sourced from app shell
}: {
  sidebarCollapsed: boolean;   // Type definition for sidebar collapsed state
  onToggleSidebar: () => void; // Type definition for sidebar toggle function
}) {
  // State management for active navigation item
  const [activeNav, setActiveNav] = useState<
    "data" | "settings" | "notifications" | "profile" | null
  >(null);
  
  // Theme management
  const { theme, toggleTheme } = useTheme();
  
  // State management for search input value
  const [searchQuery, setSearchQuery] = useState("");
  
  // State management for current time display (updates every second)
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Local state for the secret hub panel
  const [hubOpen, setHubOpen] = useState(false);

  // Reference for navigation container to detect outside clicks
  const navRef = useRef<HTMLElement | null>(null);

  // Reference to the time toggle button for focus management
  const timeButtonRef = useRef<HTMLButtonElement | null>(null);

  // Reference to store the interval ID for time updates (for cleanup)
  const timeIntervalRef = useRef<number | null>(null);

  // Compute the current sidebar width so the logo aligns with its center point
  const sidebarWidth = sidebarCollapsed ? 64 : 320;

  // Effect hook for setting up time updates and click-outside detection
  useEffect(() => {
    // Set up interval to update current time every second (1000ms)
    timeIntervalRef.current = window.setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    // Event handler to detect clicks/touches outside the navigation area
    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setActiveNav(null); // Close any open navigation menus
      }
    };
    
    // Event handler to detect focus changes outside the navigation area
    const handleFocusIn = (e: FocusEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setActiveNav(null); // Close any open navigation menus
      }
    };
    
    // Add event listeners for pointer and focus events
    document.addEventListener("mousedown", handlePointerDown, true);
    document.addEventListener("touchstart", handlePointerDown, true);
    document.addEventListener("focusin", handleFocusIn, true);
    
    // Cleanup function to remove event listeners and clear interval
    return () => {
      if (timeIntervalRef.current) {
        clearInterval(timeIntervalRef.current);
      }
      document.removeEventListener("mousedown", handlePointerDown, true);
      document.removeEventListener("touchstart", handlePointerDown, true);
      document.removeEventListener("focusin", handleFocusIn, true);
    };
  }, []); // Empty dependency array ensures this effect runs only once on mount

  // Function to toggle between dark and light mode
  const toggleDarkMode = () => {
    toggleTheme();
  };

  // Form submission handler for search functionality
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault(); // Prevent default form submission behavior
    // Placeholder for actual search implementation
    console.log("Searching for:", searchQuery);
  };

  // Helper function to format time as HH:MM:SS
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { 
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // Helper function to format date as "Day, Month Date, Year"
  const formatDate = (date: Date) => {
    return date.toLocaleDateString([], {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const sidebarToggleLabel = sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar";
  const sidebarToggleTitle = sidebarToggleLabel;
  const sidebarToggleIconClassName =
    "h-5 w-5 transition-transform duration-[200ms] ease-in-out text-white/90 " +
    (sidebarCollapsed ? "rotate-180" : "rotate-0");
  const sidebarToggleButtonClassName = [
    "relative order-2 inline-flex h-9 w-9 items-center justify-center rounded-full flex-shrink-0",
    "border border-white/15 bg-white/10 text-white/90",
    "hover:bg-white/15 hover:border-white/25",
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/70 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent",
    "transition-colors duration-[200ms]",
  ].join(" ");

  return (
    // Header container with semi-transparent background and a gradient shadow that fades right→left
    <header
      className="relative w-full pl-0 pr-4 py-1 text-white"
      style={{
        // Color gradient: right (opaque) → left (transparent)
        backgroundImage:
          "linear-gradient(270deg, rgba(38,59,76,0.65) 0%, rgba(38,59,76,0.55) 40%, rgba(38,59,76,0.25) 75%, rgba(38,59,76,0.00) 95%)",
      }}
    >
      {/* Inner container for header content with flex layout */}
      <div className="relative flex items-center justify-between gap-4">
        {/* Date and Time Display - Centered with responsive design */}
        <div className="relative mx-4 flex min-w-0 flex-grow items-center justify-center">
          <button
            ref={timeButtonRef}
            type="button"
            onClick={() => setHubOpen((prev) => !prev)}
            aria-haspopup="dialog"
            aria-expanded={hubOpen}
            aria-controls="secret-control-hub"
            className="group flex flex-col items-center justify-center rounded-lg border border-transparent px-4 py-1 transition-colors duration-200 hover:border-cyan-400/30 hover:bg-white/5 focus:outline-none focus-visible:border-cyan-400/50 focus-visible:ring-2 focus-visible:ring-cyan-400/40"
          >
            <span className="whitespace-nowrap text-lg font-semibold tracking-wide text-white group-hover:text-cyan-100">
              {formatTime(currentTime)}
            </span>
            <span className="whitespace-nowrap text-xs tracking-wide text-white/80 group-hover:text-cyan-200/90">
              {formatDate(currentTime)}
            </span>
          </button>
        </div>

        {/* Navigation Section - Fixed width to prevent squeezing */}
        <nav 
          ref={navRef}
          className="flex items-center gap-2 flex-shrink-0"
          aria-label="Header actions"
        >
          {/* Search Form */}
          <form onSubmit={handleSearch} className="relative">
            <div className="relative flex items-center">
              {/* Search input field with styling for dark theme */}
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-3 pr-10 py-1.5 w-80 bg-white/10 border border-white/20 rounded-md text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400/30 transition-colors duration-200 text-sm h-9"
              />
              {/* Search submit button */}
              <button
                type="submit"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 flex items-center justify-center rounded-md text-white/70 hover:text-white hover:bg-white/10 transition-colors duration-150 focus:outline-none"
                aria-label="Search"
              >
                <Search className="h-4 w-4" />
              </button>
            </div>
          </form>

          {/* Day/Night Mode Toggle Button */}
          <button
            type="button"
            onClick={toggleDarkMode}
            className="relative overflow-hidden inline-flex items-center justify-center h-9 w-9 rounded-md border border-white/10 bg-white/5 hover:bg-white/10 text-white/90 transition-colors duration-150 focus:outline-none"
            aria-label={theme === 'dark' ? "Switch to light mode" : "Switch to dark mode"}
            title={theme === 'dark' ? "Light mode" : "Dark mode"}
          >
            {theme === 'dark' ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </button>

          {/* Navigation buttons using the custom IconCircleButton component */}
          <IconCircleButton
            label="Data"
            ariaLabel="Open data"
            active={activeNav === "data"}
            onClick={() => setActiveNav((v) => (v === "data" ? null : "data"))}
          >
            <Database className="h-5 w-5" />
          </IconCircleButton>
          <IconCircleButton
            label="Settings"
            ariaLabel="Open settings"
            active={activeNav === "settings"}
            onClick={() => setActiveNav((v) => (v === "settings" ? null : "settings"))}
          >
            <Settings className="h-5 w-5" />
          </IconCircleButton>
          <IconCircleButton
            label="Notifications"
            ariaLabel="Open notifications"
            active={activeNav === "notifications"}
            onClick={() => setActiveNav((v) => (v === "notifications" ? null : "notifications"))}
          >
            <Bell className="h-5 w-5" />
          </IconCircleButton>
          <IconCircleButton
            label="Profile"
            ariaLabel="Open profile"
            active={activeNav === "profile"}
            onClick={() => setActiveNav((v) => (v === "profile" ? null : "profile"))}
          >
            <UserCircle2 className="h-6 w-6" />
          </IconCircleButton>
        </nav>

        <SecretHub
          id="secret-control-hub"
          open={hubOpen}
          onClose={() => setHubOpen(false)}
          anchorRef={timeButtonRef}
        />
      </div>

      {/* Gradient shadow that fades right→left, matching header’s fade */}
      <span
        aria-hidden
        className="pointer-events-none absolute left-0 right-0 -bottom-1 h-4"
        style={{
          backgroundImage:
            "linear-gradient(270deg, rgba(0,0,0,0.28) 0%, rgba(0,0,0,0.22) 40%, rgba(0,0,0,0.10) 75%, rgba(0,0,0,0.00) 95%)",
          filter: "blur(6px)",
          transform: "translateY(2px)",
        }}
      />
    </header>
  );
}

// Reusable component for circular icon buttons with active state indication
function IconCircleButton({
  children,
  ariaLabel,
  label,
  active = false,
  onClick,
}: {
  children: React.ReactNode;      // Icon to display inside the button
  ariaLabel: string;              // Accessibility label for screen readers
  label?: string;                 // Optional visible label (used for title attribute)
  active?: boolean;               // Whether the button is in active state
  onClick?: () => void;           // Click handler function
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "relative overflow-hidden inline-flex items-center justify-center h-9 w-9 rounded-md border bg-white/5 hover:bg-white/10 text-white/90 transition-colors duration-150 focus:outline-none " +
        (active
          ? "border-cyan-300/30 bg-cyan-600/20 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06),inset_-8px_0_16px_rgba(0,0,0,0.25)]"
          : "border-white/10")
      }
      aria-label={ariaLabel}
      aria-pressed={active}
      title={label}
    >
      {active && (
        <span className="absolute left-0 right-0 top-0 h-1.5 bg-cyan-400/90 shadow-[0_0_8px_rgba(34,211,238,0.6)] rounded-t-md" />
      )}
      {children}
      <span className="sr-only">{label || ariaLabel}</span>
    </button>
  );
}
