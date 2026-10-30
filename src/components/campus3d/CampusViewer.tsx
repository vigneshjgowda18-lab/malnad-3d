import { lazy, Suspense, useCallback, useRef, useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, Maximize2, Minimize2 } from "lucide-react";
import { BuildingPanel, type BuildingRecord } from "./BuildingPanel";
import { BuildingSearch } from "./BuildingSearch";
import buildingsData from "../../data/mceCampusBuildings.json";

// Lazy-load the heavy Three.js scene
const CampusScene = lazy(() => import("./CampusScene"));

// Parse database once
const ALL_BUILDINGS: BuildingRecord[] = (buildingsData as any).buildings as BuildingRecord[];

/**
 * Full-page Campus Digital Twin for MCE Hassan.
 * Integrates: 3D scene, building search, detail panel, fullscreen.
 */
export function CampusViewer() {
  const [isFullscreen,      setIsFullscreen]      = useState(false);
  const [selectedBuilding,  setSelectedBuilding]  = useState<BuildingRecord | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const toggleFullscreen = useCallback(async () => {
    if (!containerRef.current) return;
    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch { /* fullscreen not available */ }
  }, []);

  // Sync fullscreen state if user presses Esc
  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  const handleSearchSelect = useCallback((b: BuildingRecord) => {
    setSelectedBuilding(b);
  }, []);

  const handleSearchClear = useCallback(() => {
    setSelectedBuilding(null);
  }, []);

  const handlePanelClose = useCallback(() => {
    setSelectedBuilding(null);
  }, []);

  const verifiedCount     = ALL_BUILDINGS.filter(b => b.verificationStatus !== "UNIDENTIFIED").length;
  const unidentifiedCount = ALL_BUILDINGS.filter(b => b.verificationStatus === "UNIDENTIFIED").length;

  return (
    <div
      ref={containerRef}
      className="flex h-screen w-screen flex-col overflow-hidden bg-[#080d16]"
    >
      {/* ── Top bar ── */}
      <header className="relative z-30 flex shrink-0 items-center gap-3 border-b border-white/8 bg-black/60 px-4 py-2.5 backdrop-blur-xl">
        {/* Back */}
        <Link
          to="/dashboard/$role"
          params={{ role: "student" }}
          className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-white/50 transition-colors hover:bg-white/8 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Dashboard</span>
        </Link>

        <div className="h-5 w-px bg-white/10" />

        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500/30 to-indigo-500/20 ring-1 ring-white/10">
            <svg className="h-4.5 w-4.5 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3h.008v.008h-.008V10.5Zm0 3h.008v.008h-.008V13.5Zm0 3h.008v.008h-.008V16.5Z" />
            </svg>
          </div>
          <div>
            <h1 className="font-display text-sm font-semibold leading-none text-white">
              MCE Campus Digital Twin
            </h1>
            <p className="mt-0.5 text-[11px] leading-tight text-white/40">
              Malnad College of Engineering, Hassan · 13.024°N 76.104°E
            </p>
          </div>
        </div>

        {/* Live badge */}
        <div className="hidden sm:flex items-center gap-1 rounded-full border border-sky-500/20 bg-sky-500/10 px-2.5 py-0.5">
          <span className="h-1.5 w-1.5 rounded-full bg-sky-400 animate-pulse" />
          <span className="text-[10px] font-medium uppercase tracking-wider text-sky-400">Live</span>
        </div>

        {/* Building stats */}
        <div className="hidden md:flex items-center gap-3 ml-2">
          <div className="flex items-center gap-1.5 text-[11px]">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
            <span className="text-white/40">{verifiedCount} identified</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px]">
            <span className="h-1.5 w-1.5 rounded-full bg-slate-500" />
            <span className="text-white/30">{unidentifiedCount} unidentified</span>
          </div>
        </div>

        <div className="flex-1" />

        {/* Fullscreen toggle */}
        <button
          onClick={toggleFullscreen}
          className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-white/50 transition-colors hover:bg-white/8 hover:text-white"
          title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
        >
          {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          <span className="hidden sm:inline">{isFullscreen ? "Exit Fullscreen" : "Fullscreen"}</span>
        </button>
      </header>

      {/* ── 3D viewport ── */}
      <main className="relative flex-1 overflow-hidden">
        <Suspense
          fallback={
            <div className="flex h-full items-center justify-center bg-[#080d16]">
              <div className="flex flex-col items-center gap-3">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-sky-500/30 border-t-sky-400" />
                <p className="text-sm text-white/40">Initialising 3D engine…</p>
              </div>
            </div>
          }
        >
          <CampusScene
            buildings={ALL_BUILDINGS}
            selectedBuilding={selectedBuilding}
            onBuildingSelect={setSelectedBuilding}
          />
        </Suspense>

        {/* Search bar — overlaid top-left of viewport */}
        <BuildingSearch
          buildings={ALL_BUILDINGS}
          onSelect={handleSearchSelect}
          onClear={handleSearchClear}
        />

        {/* Detail panel — overlaid top-right of viewport */}
        <BuildingPanel
          building={selectedBuilding}
          onClose={handlePanelClose}
        />
      </main>
    </div>
  );
}
