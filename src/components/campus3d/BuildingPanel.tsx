import { X, MapPin, Building2, CheckCircle2, AlertCircle, HelpCircle, ChevronRight } from "lucide-react";

export interface BuildingRecord {
  buildingId: string;
  osmId: number;
  featureFid: number;
  buildingName: string;
  category: string;
  verificationStatus: "VERIFIED" | "PARTIALLY_VERIFIED" | "UNIDENTIFIED";
  identificationConfidence: number;
  source: string;
  notes: string;
  latitude: number;
  longitude: number;
  modelCoordinates: { x: number; z: number };
  osmTags: Record<string, string>;
  facilities: Array<{
    facilityId: string;
    name: string;
    type: string;
    gpsSource?: { lat: number; lon: number };
    gpsNote?: string;
  }>;
  departments: string[];
}

const CATEGORY_BADGE: Record<string, { label: string; color: string }> = {
  academic:   { label: "Academic",    color: "bg-sky-500/20 text-sky-300 border-sky-500/30" },
  admin:      { label: "Admin",       color: "bg-violet-500/20 text-violet-300 border-violet-500/30" },
  residential:{ label: "Residential", color: "bg-orange-500/20 text-orange-300 border-orange-500/30" },
  amenity:    { label: "Amenity",     color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" },
  sports:     { label: "Sports",      color: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30" },
  commercial: { label: "Commercial",  color: "bg-blue-500/20 text-blue-300 border-blue-500/30" },
  unknown:    { label: "Unknown",     color: "bg-slate-500/20 text-slate-300 border-slate-500/30" },
};

const STATUS_CONFIG = {
  VERIFIED: {
    icon: CheckCircle2,
    color: "text-emerald-400",
    bg: "bg-emerald-500/15 border-emerald-500/25",
    label: "Verified",
  },
  PARTIALLY_VERIFIED: {
    icon: AlertCircle,
    color: "text-amber-400",
    bg: "bg-amber-500/15 border-amber-500/25",
    label: "Partially Verified",
  },
  UNIDENTIFIED: {
    icon: HelpCircle,
    color: "text-slate-400",
    bg: "bg-slate-500/15 border-slate-500/25",
    label: "Unidentified",
  },
};

interface BuildingPanelProps {
  building: BuildingRecord | null;
  onClose: () => void;
}

export function BuildingPanel({ building, onClose }: BuildingPanelProps) {
  if (!building) return null;

  const catBadge = CATEGORY_BADGE[building.category] ?? CATEGORY_BADGE.unknown;
  const statusCfg = STATUS_CONFIG[building.verificationStatus];
  const StatusIcon = statusCfg.icon;
  const pct = Math.round(building.identificationConfidence * 100);

  return (
    <div
      className="absolute right-3 top-14 z-20 w-80 overflow-hidden rounded-xl border border-white/10 bg-black/75 shadow-2xl backdrop-blur-xl"
      style={{ maxHeight: "calc(100% - 5rem)" }}
    >
      {/* Header */}
      <div className="flex items-start gap-3 border-b border-white/8 p-4 pb-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500/30 to-indigo-500/20 ring-1 ring-white/10">
          <Building2 className="h-4.5 w-4.5 text-sky-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="truncate font-display text-sm font-semibold leading-tight text-white">
            {building.buildingName}
          </h2>
          <div className="mt-1 flex items-center gap-1.5">
            <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${catBadge.color}`}>
              {catBadge.label}
            </span>
            <span className="text-[10px] text-white/30">FID {building.featureFid}</span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="ml-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-white/40 transition-colors hover:bg-white/10 hover:text-white"
          aria-label="Close panel"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Scrollable body */}
      <div className="overflow-y-auto" style={{ maxHeight: "calc(100vh - 16rem)" }}>
        {/* Verification status */}
        <div className={`mx-4 mt-4 flex items-center gap-2.5 rounded-lg border p-2.5 ${statusCfg.bg}`}>
          <StatusIcon className={`h-4 w-4 shrink-0 ${statusCfg.color}`} />
          <div className="flex-1 min-w-0">
            <p className={`text-xs font-semibold ${statusCfg.color}`}>{statusCfg.label}</p>
            {pct > 0 && (
              <div className="mt-1 flex items-center gap-1.5">
                <div className="h-1 flex-1 rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-current transition-all"
                    style={{ width: `${pct}%`, color: "currentColor", opacity: 0.6 }}
                  />
                </div>
                <span className={`text-[10px] tabular-nums ${statusCfg.color} opacity-70`}>{pct}%</span>
              </div>
            )}
          </div>
        </div>

        {/* Coordinates */}
        <div className="mx-4 mt-3 flex items-center gap-2 text-xs text-white/40">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-white/30" />
          <span className="tabular-nums">
            {building.latitude.toFixed(6)}°N, {building.longitude.toFixed(6)}°E
          </span>
        </div>
        <div className="mx-4 mt-0.5 flex items-center gap-2 text-[10px] text-white/25">
          <span className="w-3.5" />
          <span className="font-mono">
            model ({building.modelCoordinates.x.toFixed(1)}, {building.modelCoordinates.z.toFixed(1)}) m
          </span>
        </div>

        {/* OSM Tags */}
        {Object.keys(building.osmTags).length > 0 && (
          <div className="mx-4 mt-4">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-white/30">OSM Data</p>
            <div className="flex flex-wrap gap-1">
              {Object.entries(building.osmTags)
                .filter(([k]) => !["building", "name"].includes(k))
                .map(([k, v]) => (
                  <span
                    key={k}
                    className="rounded-md border border-white/8 bg-white/5 px-1.5 py-0.5 text-[10px] text-white/50"
                  >
                    {k}: <span className="text-white/70">{v}</span>
                  </span>
                ))}
              {building.osmTags.name && (
                <span className="rounded-md border border-sky-500/20 bg-sky-500/10 px-1.5 py-0.5 text-[10px] text-sky-300">
                  name: {building.osmTags.name}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Departments */}
        {building.departments.length > 0 && (
          <div className="mx-4 mt-4">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-white/30">Departments</p>
            <div className="space-y-1">
              {building.departments.map((dept) => (
                <div key={dept} className="flex items-center gap-1.5 text-xs text-white/60">
                  <ChevronRight className="h-3 w-3 text-sky-400/60" />
                  {dept}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Facilities */}
        {building.facilities.length > 0 && (
          <div className="mx-4 mt-4">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-white/30">
              Facilities ({building.facilities.length})
            </p>
            <div className="space-y-1.5">
              {building.facilities.map((f) => (
                <div
                  key={f.facilityId}
                  className="rounded-lg border border-white/8 bg-white/4 px-3 py-2"
                >
                  <p className="text-xs font-medium text-white/80">{f.name}</p>
                  <p className="mt-0.5 text-[10px] capitalize text-white/40">
                    {f.type.replace(/_/g, " ")}
                  </p>
                  {f.gpsNote && (
                    <p className="mt-1 text-[9px] text-amber-400/50">{f.gpsNote}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Source */}
        <div className="mx-4 mt-4 mb-4">
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-white/30">Source</p>
          <p className="text-[10px] leading-relaxed text-white/35">{building.source}</p>
          {building.notes && (
            <p className="mt-1.5 text-[10px] leading-relaxed text-white/25 italic">{building.notes}</p>
          )}
        </div>

        {/* OSM link */}
        <div className="mx-4 mb-4">
          <a
            href={`https://www.openstreetmap.org/way/${building.osmId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[10px] text-sky-400/60 hover:text-sky-400 transition-colors"
          >
            View on OpenStreetMap
            <ChevronRight className="h-3 w-3" />
          </a>
        </div>
      </div>
    </div>
  );
}
