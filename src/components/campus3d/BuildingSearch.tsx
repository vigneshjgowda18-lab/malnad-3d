import { useState, useCallback, useRef, useEffect } from "react";
import { Search, X } from "lucide-react";
import type { BuildingRecord } from "./BuildingPanel";

interface BuildingSearchProps {
  buildings: BuildingRecord[];
  onSelect: (building: BuildingRecord) => void;
  onClear: () => void;
}

export function BuildingSearch({ buildings, onSelect, onClear }: BuildingSearchProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const results = query.trim().length < 1
    ? []
    : buildings.filter((b) => {
        const q = query.toLowerCase();
        return (
          b.buildingName.toLowerCase().includes(q) ||
          b.category.toLowerCase().includes(q) ||
          b.departments.some((d) => d.toLowerCase().includes(q)) ||
          b.facilities.some((f) => f.name.toLowerCase().includes(q)) ||
          b.osmTags.name?.toLowerCase().includes(q) ||
          b.buildingId.toLowerCase().includes(q)
        );
      });

  const handleSelect = useCallback(
    (b: BuildingRecord) => {
      setQuery(b.buildingName);
      setOpen(false);
      onSelect(b);
    },
    [onSelect]
  );

  const handleClear = useCallback(() => {
    setQuery("");
    setOpen(false);
    inputRef.current?.focus();
    onClear();
  }, [onClear]);

  useEffect(() => {
    setHighlightIdx(0);
    setOpen(results.length > 0);
  }, [results.length]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!open || results.length === 0) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlightIdx((i) => (i + 1) % results.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlightIdx((i) => (i - 1 + results.length) % results.length);
      } else if (e.key === "Enter") {
        e.preventDefault();
        handleSelect(results[highlightIdx]);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    },
    [open, results, highlightIdx, handleSelect]
  );

  // Status pill colour
  const statusColour = (s: BuildingRecord["verificationStatus"]) =>
    s === "VERIFIED"
      ? "text-emerald-400"
      : s === "PARTIALLY_VERIFIED"
      ? "text-amber-400"
      : "text-slate-500";

  return (
    <div className="absolute left-3 top-14 z-20 w-72">
      {/* Input */}
      <div className="flex items-center gap-2 rounded-xl border border-white/12 bg-black/70 px-3 py-2 shadow-2xl backdrop-blur-xl">
        <Search className="h-4 w-4 shrink-0 text-white/30" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search buildings, labs, departments…"
          className="flex-1 bg-transparent text-sm text-white placeholder-white/25 outline-none"
          autoComplete="off"
          spellCheck={false}
        />
        {query && (
          <button
            onClick={handleClear}
            className="flex h-5 w-5 items-center justify-center rounded-full text-white/30 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Clear search"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Results dropdown */}
      {open && results.length > 0 && (
        <div
          ref={listRef}
          className="mt-1 max-h-72 overflow-y-auto rounded-xl border border-white/10 bg-black/80 shadow-2xl backdrop-blur-xl"
        >
          {results.map((b, i) => (
            <button
              key={b.buildingId}
              className={`flex w-full items-start gap-3 px-4 py-2.5 text-left transition-colors ${
                i === highlightIdx ? "bg-white/8" : "hover:bg-white/5"
              } ${i > 0 ? "border-t border-white/5" : ""}`}
              onClick={() => handleSelect(b)}
              onMouseEnter={() => setHighlightIdx(i)}
            >
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium text-white/85">
                  {b.buildingName}
                </p>
                <div className="mt-0.5 flex items-center gap-1.5">
                  <span className="text-[10px] capitalize text-white/35">{b.category}</span>
                  {b.departments.length > 0 && (
                    <>
                      <span className="text-white/20">·</span>
                      <span className="truncate text-[10px] text-white/30">
                        {b.departments[0]}
                      </span>
                    </>
                  )}
                </div>
              </div>
              <span className={`shrink-0 text-[10px] font-medium ${statusColour(b.verificationStatus)}`}>
                {b.verificationStatus === "VERIFIED"
                  ? "✓"
                  : b.verificationStatus === "PARTIALLY_VERIFIED"
                  ? "~"
                  : "?"}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* No results */}
      {open && query.trim().length > 0 && results.length === 0 && (
        <div className="mt-1 rounded-xl border border-white/8 bg-black/70 px-4 py-3 text-sm text-white/35 backdrop-blur-xl">
          No buildings matching "{query}"
        </div>
      )}
    </div>
  );
}
