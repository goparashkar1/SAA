import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import Globe from "react-globe.gl";
import { MapPin, X, Loader2, CloudOff } from "lucide-react";

// Centralised colour palette that keeps region styling consistent between the globe and supplementary UI elements.
// This object maps region names to specific hex color codes for visual consistency throughout the application
const regionColors = {
  "North America": "#8884d8",  // Purple shade for North America
  Europe: "#82ca9d",           // Green shade for Europe
  Asia: "#ffc658",             // Yellow/Orange shade for Asia
  Africa: "#ff8042",           // Orange shade for Africa
  Oceania: "#0088FE",          // Blue shade for Oceania
  "South America": "#00C49F",  // Teal shade for South America
};

// GlobeMap renders the interactive 3D earth widget and exposes selection + removal hooks back to the dashboard.
// This component accepts props for managing region selection and widget removal functionality
const GlobeMap = ({ selectedRegion, onRegionSelect, onRemove }) => {
  // State management for various component aspects
  const [globeData, setGlobeData] = useState([]);           // Stores geographic point data for the globe markers
  const [dimensions, setDimensions] = useState({ width: 400, height: 360 });  // Container dimensions for responsive sizing
  const [isImageLoaded, setIsImageLoaded] = useState(false); // Tracks whether the globe texture image has loaded
  const [imageError, setImageError] = useState(false);      // Indicates if there was an error loading the image
  const [usingFallback, setUsingFallback] = useState(false); // Flags whether fallback image is being used

  // Refs for DOM element references and timeout management
  const containerRef = useRef(null);    // Reference to the container div for dimension calculations
  const globeEl = useRef(null);         // Reference to the Globe component instance
  const loadTimeoutRef = useRef(null);  // Reference for the image loading timeout

  // URL constants for globe textures - high quality primary and fallback backup
  const highQualityGlobeUrl = "//unpkg.com/three-globe/example/img/earth-blue-marble.jpg";
  const fallbackGlobeUrl = "//unpkg.com/three-globe/example/img/earth-blue-marble.jpg";

  // Initialization effect: sets up globe data points and auto-rotation behavior
  useEffect(() => {
    // Define geographic points for each region with coordinates, size, color, and region name
    const points = [
      { lat: 40.0, lng: -100.0, size: 0.8, color: regionColors["North America"], region: "North America" },
      { lat: 54.0, lng: 15.0, size: 0.8, color: regionColors["Europe"], region: "Europe" },
      { lat: 34.0, lng: 100.0, size: 0.8, color: regionColors["Asia"], region: "Asia" },
      { lat: 8.0, lng: 20.0, size: 0.8, color: regionColors["Africa"], region: "Africa" },
      { lat: -25.0, lng: 140.0, size: 0.8, color: regionColors["Oceania"], region: "Oceania" },
      { lat: -20.0, lng: -60.0, size: 0.8, color: regionColors["South America"], region: "South America" },
    ];
    setGlobeData(points);  // Store the points data in state

    // Configure auto-rotation for the globe if the component reference is available
    if (globeEl.current) {
      globeEl.current.controls().autoRotate = true;        // Enable continuous rotation
      globeEl.current.controls().autoRotateSpeed = 0.1;    // Set rotation speed
    }

    // Cleanup function: clears any pending timeout when component unmounts
    return () => {
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
      }
    };
  }, []);  // Empty dependency array ensures this runs only once on mount

  // Responsive dimension tracking effect: monitors container size and window resizing
  useEffect(() => {
    // Function to update dimensions based on current container size
    const updateDimensions = () => {
      if (!containerRef.current) return;  // Guard clause if container ref isn't available
      const { width, height } = containerRef.current.getBoundingClientRect();  // Get current dimensions
      setDimensions({ width, height: Math.max(height, 320) });  // Set minimum height of 320px
    };

    updateDimensions();  // Initial dimension calculation
    window.addEventListener("resize", updateDimensions);  // Listen for window resize events
    
    // Cleanup: remove resize listener when component unmounts
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);  // Empty dependency array ensures this runs only once on mount

  // Image loading effect: manages loading of globe textures with fallback handling
  useEffect(() => {
    // Helper function to load an image and return a promise
    const loadImage = (url) =>
      new Promise((resolve, reject) => {
        const img = new Image();  // Create new image element
        img.onload = () => resolve(url);  // Resolve promise on successful load
        img.onerror = () => reject(new Error(`Failed to load image from ${url}`));  // Reject on error
        img.src = url;  // Set image source to trigger loading
      });

    // Main image loading routine with timeout and fallback logic
    const attemptLoad = async () => {
      try {
        // Set timeout to handle slow loading (15 seconds)
        loadTimeoutRef.current = setTimeout(() => {
          if (!isImageLoaded) {
            setUsingFallback(true);  // Switch to fallback mode
            setImageError(true);     // Set error state
          }
        }, 15000);

        // Attempt to load high-quality image first
        await loadImage(highQualityGlobeUrl);
        if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);  // Clear timeout if successful
        setIsImageLoaded(true);    // Mark image as loaded
        setImageError(false);      // Clear error state
        setUsingFallback(false);   // Not using fallback
      } catch (error) {
        // If high-quality image fails, attempt fallback
        console.warn("High-quality image failed, trying fallback:", error);
        try {
          await loadImage(fallbackGlobeUrl);  // Try fallback image
          if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);  // Clear timeout
          setIsImageLoaded(true);    // Mark image as loaded
          setImageError(false);      // Clear error state
          setUsingFallback(true);    // Flag that fallback is being used
        } catch (fallbackError) {
          // Both image sources failed
          console.error("Fallback image also failed:", fallbackError);
          if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);  // Clear timeout
          setIsImageLoaded(true);    // Mark as loaded to stop loading indicators
          setImageError(true);       // Set error state
          setUsingFallback(false);   // Not using fallback (both failed)
        }
      }
    };

    attemptLoad();  // Execute the image loading process
  }, [highQualityGlobeUrl, fallbackGlobeUrl, isImageLoaded]);  // Dependencies: re-run if URLs change

  // Event handler for globe point clicks - triggers region selection
  const handleGlobeClick = (point) => {
    if (point?.region) {  // Check if clicked point has a region property
      onRegionSelect?.(point.region);  // Call optional callback with region name
    }
  };

  // Main component render method
  return (
    <div className="globe-fade relative flex h-full w-full flex-col gap-4 text-white">
      {/* Remove widget button - conditionally rendered if onRemove callback is provided */}
      {onRemove && (
        <button
          onClick={onRemove}
          className="absolute -top-2 -right-2 rounded-tr rounded-bl bg-red-500/80 px-2 py-1 text-white transition-colors hover:bg-red-500"
          title="Remove widget"
        >
          <X className="h-3 w-3" />
        </button>
      )}

      {/* Component header with title and icon */}
      <div className="flex items-center gap-2">
        <MapPin className="h-5 w-5 text-cyan-400 opacity-90" />
        <h2 className="text-lg font-semibold">Interactive Globe</h2>
      </div>

      {/* Main container for the globe visualization */}
      <div ref={containerRef} className="relative flex-1 min-h-[22rem]">
        {/* Loading overlay - shown while image is still loading */}
        {!isImageLoaded && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-gray-900/80">
            <div className="flex flex-col items-center">
              <div className="relative">
                <div className="h-16 w-16 rounded-full border-4 border-blue-500/20"></div>
                <div className="absolute top-0 left-0 h-16 w-16 animate-spin rounded-full border-4 border-transparent border-t-blue-500">
                  <Loader2 className="h-full w-full text-blue-500" />
                </div>
              </div>
              <p className="mt-3 text-blue-200/80 font-medium">Loading high-resolution globe...</p>
              <p className="mt-1 text-xs text-gray-400">This may take a moment</p>
            </div>
          </div>
        )}

        {/* Error overlay - shown when image loading fails */}
        {imageError && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-black/70">
            <div className="max-w-xs p-4 text-center">
              <CloudOff className="mx-auto mb-2 h-10 w-10 text-yellow-500" />
              <div className="mb-2 font-medium text-yellow-500">Image Load Issue</div>
              <p className="mb-2 text-sm text-gray-300">
                {usingFallback
                  ? "Using standard resolution due to loading issues with high-resolution imagery."
                  : "Failed to load globe imagery."}
              </p>
              <p className="text-xs text-gray-400">To fix this, upload your image to a cloud storage service.</p>
            </div>
          </div>
        )}

        {/* Main Globe component with configuration props */}
        <Globe
          ref={globeEl}  // Reference to control the globe programmatically
          globeImageUrl={imageError ? fallbackGlobeUrl : highQualityGlobeUrl}  // Dynamic image URL based on error state
          backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"  // Starfield background
          pointsData={globeData}  // Array of point data to display on the globe
          pointAltitude={0.01}    // Height above globe surface for points
          pointRadius="size"      // Property name for point size in data objects
          pointColor="color"      // Property name for point color in data objects
          pointLabel="region"     // Property name for point label/tooltip
          onPointClick={handleGlobeClick}  // Click handler for points
          pointResolution={16}    // Detail level for point rendering (higher = smoother)
          pointMaterial={(point) =>  // Custom material function for points
            new THREE.MeshBasicMaterial({
              color: new THREE.Color(point.color),  // Convert hex string to THREE color
              transparent: true,    // Enable transparency
              opacity: 0.9,         // Slightly transparent material
            })
          }
          width={dimensions.width}   // Responsive width from container
          height={dimensions.height} // Responsive height from container
        />

        {/* Selected region indicator - shows currently selected region */}
        {selectedRegion && (
          <div className="absolute bottom-2 left-2 rounded bg-white/15 px-3 py-1 text-sm shadow backdrop-blur">
            <span className="font-medium">Selected: </span>
            <span className="font-semibold" style={{ color: regionColors[selectedRegion] }}>
              {selectedRegion}
            </span>
          </div>
        )}

        {/* Fallback resolution indicator - shows when using lower quality image */}
        {usingFallback && isImageLoaded && (
          <div className="absolute top-2 right-2 rounded bg-yellow-500/20 px-2 py-1 text-xs text-yellow-300 shadow backdrop-blur">
            Standard Resolution
          </div>
        )}
      </div>
    </div>
  );
};

export default GlobeMap;  // Export the component for use in other files


