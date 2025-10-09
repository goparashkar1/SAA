import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3";
import { feature } from "topojson-client";
import type { FeatureCollection } from "geojson";
import type { Topology } from "topojson-specification";
import { Filter, MapPin, X, ZoomIn, ZoomOut } from "lucide-react";

// Enumerates the event categories tracked across the heatmap and filter controls.
type EventType =
  | "cybersecurity"
  | "geopolitical"
  | "technology"
  | "environment"
  | "economic"
  | "social";

// Shape of each plotted incident, combining geospatial coordinates with descriptive metadata.
type EventEntry = {
  id: number;
  lat: number;
  lng: number;
  intensity: number;
  type: EventType;
  title: string;
  description: string;
  date: string;
};

// Mock dataset used for demo rendering; real integrations can swap this for live intelligence feeds.
const sampleEvents: EventEntry[] = [
  { id: 1, lat: 40.7128, lng: -74.006, intensity: 0.8, type: "cybersecurity", title: "Data Breach", description: "Major corporation data breach affecting millions", date: "2023-10-15" },
  { id: 2, lat: 51.5074, lng: -0.1278, intensity: 0.6, type: "geopolitical", title: "Diplomatic Meeting", description: "Leaders meet to discuss trade agreements", date: "2023-10-14" },
  { id: 3, lat: 35.6762, lng: 139.6503, intensity: 0.9, type: "technology", title: "Tech Conference", description: "Annual technology innovation conference", date: "2023-10-13" },
  { id: 4, lat: -33.8688, lng: 151.2093, intensity: 0.4, type: "environment", title: "Climate Research", description: "New findings on ocean temperature rise", date: "2023-10-12" },
  { id: 5, lat: -14.235, lng: -51.9253, intensity: 0.7, type: "geopolitical", title: "Election Results", description: "Presidential election concludes", date: "2023-10-11" },
  { id: 6, lat: 55.7558, lng: 37.6173, intensity: 0.5, type: "cybersecurity", title: "Network Disruption", description: "Internet services disrupted in region", date: "2023-10-10" },
  { id: 7, lat: 39.9042, lng: 116.4074, intensity: 0.8, type: "technology", title: "5G Expansion", description: "New 5G infrastructure announced", date: "2023-10-09" },
  { id: 8, lat: 43.6532, lng: -79.3832, intensity: 0.3, type: "economic", title: "Market Analysis", description: "Financial markets show volatility", date: "2023-10-08" },
  { id: 9, lat: 28.6139, lng: 77.209, intensity: 0.9, type: "social", title: "Protests", description: "Demonstrations over policy changes", date: "2023-10-07" },
  { id: 10, lat: -1.2921, lng: 36.8219, intensity: 0.6, type: "economic", title: "Trade Deal", description: "New international trade agreement signed", date: "2023-10-06" },
];

// Centralized palette that aligns map pins, badges, and details panel for each sentiment type.
const eventTypeColors: Record<EventType, string> = {
  cybersecurity: "#ff4d4f",
  geopolitical: "#1890ff",
  technology: "#52c41a",
  environment: "#13c2c2",
  economic: "#722ed1",
  social: "#fa8c16",
};

// Minimal topojson typing to safely extract the country features from the downloaded world atlas payload.
type WorldAtlas = Topology & {
  objects: {
    countries: {
      type: "GeometryCollection";
      geometries: unknown[];
    };
  };
};

// Converts a normalized intensity score into a pin radius so higher impact events read larger on the map.
const getPinRadius = (intensity: number) => 4 + intensity * 6;

// Generates the triangular tail path for each map pin so hover animations can reuse consistent geometry.
const pinTailPath = (radius: number) => {
  const tailHeight = radius * 1.6;
  const tailWidth = radius * 0.8;
  const tipY = -radius;
  const baseY = tipY - tailHeight;
  return `M0,${tipY} L${tailWidth},${baseY} L${-tailWidth},${baseY} Z`;
};

// Main dashboard widget responsible for rendering the interactive globe heatmap and auxiliary controls.
export default function HeatmapWidget() {
  // DOM and D3 handles persisted across renders for imperative map updates.
  const mapRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const mapGroupRef = useRef<d3.Selection<SVGGElement, unknown, null, undefined> | null>(null);
  const pointsGroupRef = useRef<d3.Selection<SVGGElement, unknown, null, undefined> | null>(null);
  const projectionRef = useRef<d3.GeoMercatorProjection | null>(null);
  const zoomBehaviorRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const filtersRef = useRef<EventType[]>([]);

  // React state drives UI feedback (loading overlays, zoom label, filter selections, and selected event disclosure).
  const [isLoading, setIsLoading] = useState(true);
  const [zoomDisplay, setZoomDisplay] = useState(100);
  const [activeFilters, setActiveFilters] = useState<EventType[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<EventEntry | null>(null);

  // Memoized view of events that respects the currently toggled filters without re-filtering on every render.
  const visibleEvents = useMemo(() => {
    if (activeFilters.length === 0) {
      return sampleEvents;
    }
    return sampleEvents.filter((event) => activeFilters.includes(event.type));
  }, [activeFilters]);

  // Toggle handler keeps the filter array in sync with button state while sharing the reference with D3 callbacks via filtersRef.
  const toggleFilter = useCallback((type: EventType) => {
    setActiveFilters((prev) =>
      prev.includes(type) ? prev.filter((entry) => entry !== type) : [...prev, type]
    );
  }, []);

  // Projects each event into screen coordinates so zooming/resizing can reflow the pins without recreating them.
  const positionPins = useCallback(() => {
    const projection = projectionRef.current;
    const pointsGroup = pointsGroupRef.current;
    if (!projection || !pointsGroup) {
      return;
    }

    pointsGroup
      .selectAll<SVGGElement, EventEntry>("g.event-pin")
      .attr("transform", (datum) => {
        const [x, y] = projection([datum.lng, datum.lat]) ?? [Number.NaN, Number.NaN];
        if (!Number.isFinite(x) || !Number.isFinite(y)) {
          return "translate(-9999,-9999)";
        }
        return `translate(${x},${y})`;
      });
  }, []);

  // Rebuilds the D3 selection to reflect filter changes, hover animations, coloring, and click handlers.
  const redrawPins = useCallback(() => {
    const pointsGroup = pointsGroupRef.current;
    if (!pointsGroup) {
      return;
    }

    // Read filters from the ref so hover handlers always see synchronized state.
    const filters = filtersRef.current;
    // Derive the working dataset according to the active filter selection.
    const data = filters.length === 0 ? sampleEvents : sampleEvents.filter((event) => filters.includes(event.type));

    // Join the filtered dataset to existing pin nodes so D3 can diff enter/update/exit states.
    const pins = pointsGroup
      .selectAll<SVGGElement, EventEntry>("g.event-pin")
      .data(data, (datum: EventEntry) => datum.id);

    // Drop any stale pins that no longer match the filtered dataset.
    pins.exit().remove();

    // Create new pin containers for events entering the viewport or filter scope.
    const pinsEnter = pins
      .enter()
      .append("g")
      .attr("class", "event-pin")
      .attr("pointer-events", "visiblePainted")
      .style("cursor", "pointer");

    // Each pin consists of a tail path and circular head appended to the new group.
    pinsEnter.append("path").attr("class", "event-pin-tail");
    pinsEnter.append("circle").attr("class", "event-pin-head");

    // Merge enter and existing selections so interactions apply to every visible pin.
    const merged = pinsEnter.merge(pins as d3.Selection<SVGGElement, EventEntry, SVGGElement, unknown>);

    // Register hover and click interactions that scale pins and surface details.
    merged
      .on("mouseover", function (_, datum) {
        const baseRadius = getPinRadius(datum.intensity);
        const hoverRadius = baseRadius * 1.25;
        const group = d3.select<SVGGElement, EventEntry>(this);
        group
          .select<SVGCircleElement>("circle.event-pin-head")
          .transition()
          .duration(200)
          .attr("r", hoverRadius);
        group
          .select<SVGPathElement>("path.event-pin-tail")
          .transition()
          .duration(200)
          .attr("d", pinTailPath(hoverRadius));
      })
      .on("mouseout", function (_, datum) {
        const baseRadius = getPinRadius(datum.intensity);
        const group = d3.select<SVGGElement, EventEntry>(this);
        group
          .select<SVGCircleElement>("circle.event-pin-head")
          .transition()
          .duration(200)
          .attr("r", baseRadius);
        group
          .select<SVGPathElement>("path.event-pin-tail")
          .transition()
          .duration(200)
          .attr("d", pinTailPath(baseRadius));
      })
      .on("click", (_, datum) => setSelectedEvent(datum));

    // On every render pass, style the pin head and tail based on the event metadata.
    merged.each(function (datum) {
      const baseRadius = getPinRadius(datum.intensity);
      const baseColor = eventTypeColors[datum.type];
      const tailFill = d3.color(baseColor)?.darker(0.4)?.toString() ?? baseColor;
      const strokeColor = d3.color(baseColor)?.brighter(0.8)?.toString() ?? "#ffffff";

      const group = d3.select<SVGGElement, EventEntry>(this);
      group
        .select<SVGCircleElement>("circle.event-pin-head")
        .attr("r", baseRadius)
        .attr("fill", baseColor)
        .attr("stroke", strokeColor)
        .attr("stroke-width", 1);

      group
        .select<SVGPathElement>("path.event-pin-tail")
        .attr("d", pinTailPath(baseRadius))
        .attr("fill", tailFill)
        .attr("stroke", d3.color(tailFill)?.darker(0.6)?.toString() ?? tailFill)
        .attr("stroke-width", 0.5);
    });

    // Ensure pins render above the base map layer before computing their positions.
    pointsGroup.raise();
    positionPins();
  }, [positionPins]);

  // Bootstrap the SVG canvas, load geographic data, and manage lifecycle cleanup.
  useEffect(() => {
    const container = mapRef.current;
    if (!container) {
      return undefined;
    }

    // Seed projection math with the container dimensions, falling back to sensible defaults.
    const initialWidth = container.clientWidth || 800;
    const initialHeight = container.clientHeight || 480;

    // Create the root SVG and layer groups that D3 will mutate during map interactions.
    const svg = d3
      .select(container)
      .append("svg")
      .attr("width", "100%")
      .attr("height", "100%")
      .attr("viewBox", `0 0 ${initialWidth} ${initialHeight}`)
      .attr("class", "world-map-svg");

    const mapGroup = svg.append("g").attr("class", "map-group");
    const pointsGroup = mapGroup.append("g").attr("class", "points-group");

    svgRef.current = svg.node();
    mapGroupRef.current = mapGroup;
    pointsGroupRef.current = pointsGroup;

    // Configure a Mercator projection centered for a balanced world view inside the card.
    const projection = d3
      .geoMercator()
      .scale(initialWidth / (2 * Math.PI))
      .translate([initialWidth / 2, initialHeight / 1.8]);

    projectionRef.current = projection;

    // Pre-build a reusable path generator to convert geo features into SVG paths.
    const path = d3.geoPath(projection);

    // Attach pan/zoom gestures so the map can be explored while keeping the zoom label synchronized.
    const zoomBehavior = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.8, 8])
      .on("zoom", (event) => {
        mapGroup.attr("transform", event.transform.toString());
        setZoomDisplay(Math.round(event.transform.k * 100));
      });

    zoomBehaviorRef.current = zoomBehavior;
    svg.call(zoomBehavior as any);

    setIsLoading(true);

    const abortController = new AbortController();

    // Fetch world geometry asynchronously; abort controller prevents updates after unmount.
    d3.json<WorldAtlas>("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json", {
      signal: abortController.signal,
    })
      .then((topology) => {
        if (!topology) {
          throw new Error("Missing world topology data");
        }

        // Convert topojson into geojson features so D3 can render country paths.
        const collection = feature(topology, topology.objects.countries) as FeatureCollection;

        mapGroup
          .append("g")
          .attr("class", "country-layer")
          .selectAll("path")
          .data(collection.features)
          .enter()
          .append("path")
          .attr("class", "country")
          .attr("d", path)
          .attr("fill", "#2a3f5d")
          .attr("stroke", "#3c5068")
          .attr("stroke-width", 0.5);

        // Ensure pins render above the base map layer before computing their positions.
    pointsGroup.raise();
        setIsLoading(false);
        redrawPins();
      })
      .catch((error) => {
        if (error.name === "AbortError") {
          return;
        }
        setIsLoading(false);
        svg
          .append("text")
          .attr("x", initialWidth / 2)
          .attr("y", initialHeight / 2)
          .attr("text-anchor", "middle")
          .attr("fill", "#cccccc")
          .text("Failed to load map data.");
      });

    // Keep the visualization responsive by recalculating the projection whenever the container resizes.
    const resizeObserver = new ResizeObserver(() => {
      const nextWidth = container.clientWidth || initialWidth;
      const nextHeight = container.clientHeight || initialHeight;
      svg.attr("viewBox", `0 0 ${nextWidth} ${nextHeight}`);
      projection
        .scale(nextWidth / (2 * Math.PI))
        .translate([nextWidth / 2, nextHeight / 1.8]);
      mapGroup.selectAll<SVGPathElement, any>(".country").attr("d", path);
      positionPins();
    });

    resizeObserver.observe(container);

    // Tear down observers and SVG artifacts to avoid leaks when the widget unmounts.
    return () => {
      abortController.abort();
      resizeObserver.disconnect();
      svg.selectAll("*").remove();
      svg.remove();
      svgRef.current = null;
      mapGroupRef.current = null;
      pointsGroupRef.current = null;
      projectionRef.current = null;
      zoomBehaviorRef.current = null;
    };
  }, [positionPins, redrawPins]);

  // Mirror the filter array into the ref so D3 handlers stay in sync without re-registering listeners.
  useEffect(() => {
    filtersRef.current = activeFilters;
    redrawPins();
  }, [activeFilters, redrawPins]);

  useEffect(() => {
    positionPins();
  }, [positionPins, visibleEvents.length]);

  // UI callbacks delegate zoom behavior to D3 while keeping transitions smooth.
  const handleZoomIn = useCallback(() => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    d3.select(svgRef.current).transition().duration(200).call(zoomBehaviorRef.current.scaleBy, 1.3);
  }, []);

  const handleZoomOut = useCallback(() => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    d3.select(svgRef.current).transition().duration(200).call(zoomBehaviorRef.current.scaleBy, 1 / 1.3);
  }, []);

  // Reset shortcut snaps the zoom/pan transform back to the default orientation.
  const handleResetView = useCallback(() => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    d3.select(svgRef.current).transition().duration(250).call(zoomBehaviorRef.current.transform, d3.zoomIdentity);
  }, []);

  useEffect(() => {
    if (selectedEvent && !visibleEvents.some((event) => event.id === selectedEvent.id)) {
      setSelectedEvent(null);
    }
  }, [visibleEvents, selectedEvent]);

  return (
    <div className="globe-fade flex h-full flex-col text-white">
      {/* Header conveys widget identity and dynamic zoom/event counts. */}
    <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-cyan-400" />
          <h2 className="text-lg font-semibold">Global Events Heatmap</h2>
        </div>
        <div className="flex items-center gap-2 text-xs text-white/60">
          <span className="rounded-full border border-white/15 bg-white/10 px-2 py-1">Zoom {zoomDisplay}%</span>
          <span className="rounded-full border border-white/15 bg-white/10 px-2 py-1">{visibleEvents.length} events</span>
        </div>
      </div>

      {/* Filter toolbar exposes per-type toggles tied directly to the event dataset. */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1 text-sm text-white/70">
          <Filter className="h-4 w-4" />
          <span>Filter by type:</span>
        </div>
        {Object.entries(eventTypeColors).map(([type, color]) => {
          const eventType = type as EventType;
          const isActive = activeFilters.includes(eventType);
          return (
            <button
              key={type}
              type="button"
              onClick={() => toggleFilter(eventType)}
              className={`rounded-full px-2.5 py-1 text-xs font-medium transition-all ${
                isActive ? "bg-white/20" : "bg-white/5 hover:bg-white/10"
              }`}
              style={{
                border: `1px solid ${color}${isActive ? "ff" : "40"}`,
                color: isActive ? "#ffffff" : "#ffffffaa",
              }}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          );
        })}
      </div>

      {/* Map viewport hosts the D3-rendered globe and overlays loading state plus controls. */}
      <div className="relative overflow-hidden rounded-md border border-white/10 bg-slate-900/70" style={{ height: "22rem" }}>
        {/* Overlay spinner keeps the user informed while fetching base topology. */}
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-900/80">
            <div className="flex flex-col items-center">
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-cyan-500" />
              <p className="mt-3 text-sm text-cyan-200">Loading map data...</p>
            </div>
          </div>
        )}

        {/* Root element where the D3-managed SVG is injected and manipulated. */}
        <div ref={mapRef} className="h-full w-full cursor-grab" />

        {/* Corner control stack mirrors common map UX for zoom and reset tools. */}
        <div className="absolute bottom-4 left-4 flex flex-col gap-2 rounded-lg border border-white/10 bg-slate-900/70 p-2 backdrop-blur-sm">
          <button
            type="button"
            onClick={handleZoomIn}
            className="rounded-md bg-white/5 p-1.5 transition-colors hover:bg-white/10"
            title="Zoom in"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            className="rounded-md bg-white/5 p-1.5 transition-colors hover:bg-white/10"
            title="Zoom out"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={handleResetView}
            className="rounded-md bg-white/5 px-2 py-1 text-xs transition-colors hover:bg-white/10"
            title="Reset view"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Details card surfaces metadata for the currently selected pin. */}
      {selectedEvent && (
        <div className="mt-4 rounded-md border border-white/10 bg-slate-800/50 p-3">
          <div className="mb-2 flex items-start justify-between">
            <h3 className="font-semibold text-cyan-300">{selectedEvent.title}</h3>
            <button
              type="button"
              onClick={() => setSelectedEvent(null)}
              className="rounded p-0.5 transition-colors hover:bg-white/10"
              title="Close details"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="mb-2 flex items-center gap-2">
            <span className="h-3 w-3 rounded-full" style={{ backgroundColor: eventTypeColors[selectedEvent.type] }} />
            <span className="text-sm capitalize">{selectedEvent.type}</span>
            <span className="text-sm text-white/50">- {selectedEvent.date}</span>
          </div>
          <p className="text-sm text-white/80">{selectedEvent.description}</p>
        </div>
      )}

      {/* Footer hint reminds users how to interact with the visualization. */}
      <div className="mt-3 flex justify-between text-xs text-white/50">
        <span>Click pins for event details</span>
        <span>Drag to pan - Buttons to zoom</span>
      </div>
    </div>
  );
}







