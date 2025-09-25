// Importing React and necessary hooks for state management, side effects, and DOM references
import React, { useState, useEffect, useRef } from "react";
// Importing various icons from lucide-react for header navigation elements
import { Bell, Database, Settings, UserCircle2, Sun, Moon, Search } from "lucide-react";
// Importing the application logo image
import logo from "../assets/logo.png";
import SecretHub from "./SecretHub";

// Main Header component with props for sidebar state management
export default function Header({
  sidebarCollapsed, // Used to line the header logo up with the sidebar midpoint
  onToggleSidebar: _onToggleSidebar,    // Destructured prop (currently unused but available for future expansion)
}: {
  sidebarCollapsed: boolean;   // Type definition for sidebar collapsed state
  onToggleSidebar: () => void; // Type definition for sidebar toggle function
}) {
  // State management for active navigation item
  const [activeNav, setActiveNav] = useState<
    "data" | "settings" | "notifications" | "profile" | null
  >(null);
  
  // State management for dark/light mode toggle (defaults to dark mode)
  const [isDarkMode, setIsDarkMode] = useState(true);
  
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
  const timeIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Compute the current sidebar width so the logo aligns with its center point
  const sidebarWidth = sidebarCollapsed ? 64 : 320;

  // Effect hook for setting up time updates and click-outside detection
  useEffect(() => {
    // Set up interval to update current time every second (1000ms)
    timeIntervalRef.current = setInterval(() => {
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
      // Clear the time update interval to prevent memory leaks
      if (timeIntervalRef.current) {
        clearInterval(timeIntervalRef.current);
      }
      // Remove all event listeners
      document.removeEventListener("mousedown", handlePointerDown, true);
      document.removeEventListener("touchstart", handlePointerDown, true);
      document.removeEventListener("focusin", handleFocusIn, true);
    };
  }, []); // Empty dependency array ensures this effect runs only once on mount

  // Function to toggle between dark and light mode
  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    // Note: Placeholder for actual theme switching logic implementation
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
      hour: '2-digit',   // 2-digit hour format (00-23)
      minute: '2-digit', // 2-digit minute format (00-59)
      second: '2-digit'  // 2-digit second format (00-59)
    });
  };

  // Helper function to format date as "Day, Month Date, Year"
  const formatDate = (date: Date) => {
    return date.toLocaleDateString([], {
      weekday: 'short',  // Abbreviated weekday name (e.g., "Mon")
      day: 'numeric',    // Numeric day of month (1-31)
      month: 'short',    // Abbreviated month name (e.g., "Jan")
      year: 'numeric'    // Full numeric year (e.g., 2024)
    });
  };

  return (
    // Header container with semi-transparent background and shadow
    <header className="w-full bg-[#263B4C]/65 shadow-header pl-0 pr-4 py-1 text-white">
      {/* Inner container for header content with flex layout */}
      <div className="relative flex items-center justify-between gap-4">
        {/* Logo Section - Matches sidebar width to keep the mark centered */}
        <div
          className="flex-shrink-0 flex items-center justify-center transition-[width] duration-200"
          style={{ width: sidebarWidth }}
        >
          <img src={logo} alt="Logo" className="h-16 max-w-full object-contain drop-shadow-[3px_4px_4px_rgba(0,0,0,0.25)]" />
        </div>

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
          ref={navRef} // Reference for click-outside detection
          className="flex items-center gap-2 flex-shrink-0" 
          aria-label="Header actions" // Accessibility label for the navigation region
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
                className="pl-3 pr-10 py-1.5 w-64 bg-white/10 border border-white/20 rounded-md text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400/30 transition-colors duration-200 text-sm h-9"
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
            aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
            title={isDarkMode ? "Light mode" : "Dark mode"}
          >
            {/* Conditionally render sun or moon icon based on current mode */}
            {isDarkMode ? (
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
        // Conditional styling based on active state
        (active
          ? "border-cyan-300/30 bg-cyan-600/20 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06),inset_-8px_0_16px_rgba(0,0,0,0.25)]"
          : "border-white/10")
      }
      aria-label={ariaLabel}
      aria-pressed={active}       // Accessibility attribute indicating pressed state
      title={label}               // Browser tooltip text
    >
      {/* Active state indicator bar at the top of the button */}
      {active && (
        <span className="absolute left-0 right-0 top-0 h-1.5 bg-cyan-400/90 shadow-[0_0_8px_rgba(34,211,238,0.6)] rounded-t-md" />
      )}
      {children}
      {/* Screen reader only text for accessibility */}
      <span className="sr-only">{label || ariaLabel}</span>
    </button>
  );
}















