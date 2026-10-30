/**
 * CampusScene.tsx – Phase 1 + Phase 2
 *
 * Visual quality (Phase 1): per-material overrides, golden-hour lighting,
 *   atmospheric fog, isometric camera, PCF shadows, logarithmic depth buffer.
 *
 * Interactive buildings (Phase 2):
 *   - Click any building mesh → select it
 *   - Selected building gets emissive highlight
 *   - Camera flies to the selected building
 *   - Nearest-building matching uses model coordinates from database
 *   - Search → focusBuilding prop drives camera + selection externally
 */
import {
  useRef,
  useEffect,
  useState,
  useCallback,
  startTransition,
} from "react";
import { Canvas, useThree, useFrame } from "@react-three/fiber";
import {
  OrbitControls,
  useGLTF,
  Environment,
  useProgress,
} from "@react-three/drei";
import * as THREE from "three";
import { CAMPUS_STATS } from "./campus-data";
import type { BuildingRecord } from "./BuildingPanel";
import { modelDistance } from "./buildingUtils";

// ─── Asset path ───────────────────────────────────────────────
const MODEL_BASE = "/campus3d/gen-map_Export_13.024_76.104_500x400/";
const GLB_PATH   = `${MODEL_BASE}Meshes_GLB/Tile_X0_Y0.glb`;

// ─── Material overrides (keyed on OSM material name fragments) ─
interface MatOverride {
  color?: THREE.ColorRepresentation;
  roughness?: number;
  metalness?: number;
  envMapIntensity?: number;
}

const MAT_OVERRIDES: Array<{ pattern: RegExp; override: MatOverride }> = [
  { pattern: /terrain/i,         override: { color: 0x8aaf6e, roughness: 0.95, metalness: 0, envMapIntensity: 0.1 } },
  { pattern: /building_wall/i,   override: { color: 0xe8dcc8, roughness: 0.70, metalness: 0, envMapIntensity: 0.2 } },
  { pattern: /building_roof_plain/i, override: { color: 0xd97341, roughness: 0.75, metalness: 0, envMapIntensity: 0.15 } },
  { pattern: /building_roof/i,   override: { color: 0xc0522a, roughness: 0.70, metalness: 0, envMapIntensity: 0.15 } },
  { pattern: /road/i,            override: { color: 0x555555, roughness: 0.90, metalness: 0 } },
  { pattern: /path/i,            override: { color: 0x8b7355, roughness: 0.95, metalness: 0 } },
  { pattern: /leaves_conifer/i,  override: { color: 0x2d6a2f, roughness: 0.85, metalness: 0 } },
  { pattern: /leaves_poplar/i,   override: { color: 0x4d8c3a, roughness: 0.82, metalness: 0 } },
  { pattern: /leaves_bush/i,     override: { color: 0x5a9245, roughness: 0.88, metalness: 0 } },
  { pattern: /leaves/i,          override: { color: 0x56922d, roughness: 0.84, metalness: 0 } },
  { pattern: /tree_trunk/i,      override: { color: 0x6b4a28, roughness: 0.95, metalness: 0 } },
  { pattern: /hedge/i,           override: { color: 0x3d7a2c, roughness: 0.90, metalness: 0 } },
  { pattern: /water/i,           override: { color: 0x2a7aad, roughness: 0.10, metalness: 0.05, envMapIntensity: 0.8 } },
  { pattern: /pitch_grass/i,     override: { color: 0x3a7d28, roughness: 0.90, metalness: 0 } },
  { pattern: /pitch_court/i,     override: { color: 0x6b9bc0, roughness: 0.75, metalness: 0 } },
  { pattern: /plaza/i,           override: { color: 0xbcb09a, roughness: 0.85, metalness: 0 } },
  { pattern: /parking/i,         override: { color: 0x666666, roughness: 0.88, metalness: 0 } },
  { pattern: /marking/i,         override: { color: 0xf5f0e8, roughness: 0.70, metalness: 0 } },
  { pattern: /curb/i,            override: { color: 0xa09882, roughness: 0.90, metalness: 0 } },
  { pattern: /pool/i,            override: { color: 0x1e8ec0, roughness: 0.08, metalness: 0.05, envMapIntensity: 0.9 } },
  { pattern: /field/i,           override: { color: 0x76a84b, roughness: 0.92, metalness: 0 } },
  { pattern: /metal/i,           override: { color: 0x888888, roughness: 0.55, metalness: 0.6 } },
  { pattern: /bridge/i,          override: { color: 0x999999, roughness: 0.70, metalness: 0.1 } },
  { pattern: /concrete/i,        override: { color: 0xaaaaaa, roughness: 0.85, metalness: 0 } },
  { pattern: /sand/i,            override: { color: 0xd4b483, roughness: 0.95, metalness: 0 } },
  { pattern: /rail/i,            override: { color: 0x7a7a7a, roughness: 0.60, metalness: 0.4 } },
];

function applyMaterialOverrides(scene: THREE.Object3D) {
  scene.traverse((child) => {
    if (!(child as THREE.Mesh).isMesh) return;
    const mesh = child as THREE.Mesh;
    mesh.castShadow    = true;
    mesh.receiveShadow = true;

    const apply = (mat: THREE.Material) => {
      if (!(mat instanceof THREE.MeshStandardMaterial)) return;
      const entry = MAT_OVERRIDES.find(({ pattern }) => pattern.test(mat.name ?? ""));
      if (entry) {
        const o = entry.override;
        if (o.color !== undefined)          mat.color.set(o.color);
        if (o.roughness !== undefined)      mat.roughness        = o.roughness;
        if (o.metalness !== undefined)      mat.metalness        = o.metalness;
        if (o.envMapIntensity !== undefined) mat.envMapIntensity = o.envMapIntensity;
      } else {
        mat.roughness       = Math.max(mat.roughness, 0.4);
        mat.envMapIntensity = Math.min(mat.envMapIntensity ?? 1, 0.6);
      }
      mat.needsUpdate = true;
    };

    if (Array.isArray(mesh.material)) mesh.material.forEach(apply);
    else apply(mesh.material);
  });
}

// ─── Types ────────────────────────────────────────────────────
interface ModelInfo {
  radius: number;
  sceneOffset: THREE.Vector3; // how much we shifted the scene (= -bboxCenter)
}

// ─── Highlight colours ────────────────────────────────────────
const HIGHLIGHT_EMISSIVE    = new THREE.Color(0x38bdf8); // sky-400
const HIGHLIGHT_INTENSITY   = 0.6;
const NO_EMISSIVE           = new THREE.Color(0x000000);

// ─── Store original emissive per material (for undo) ──────────
const origEmissive = new WeakMap<THREE.MeshStandardMaterial, THREE.Color>();

function setEmissive(mat: THREE.Material, color: THREE.Color, intensity: number) {
  if (!(mat instanceof THREE.MeshStandardMaterial)) return;
  if (!origEmissive.has(mat)) origEmissive.set(mat, mat.emissive.clone());
  mat.emissive.copy(color);
  mat.emissiveIntensity = intensity;
  mat.needsUpdate = true;
}

function resetEmissive(mat: THREE.Material) {
  if (!(mat instanceof THREE.MeshStandardMaterial)) return;
  const orig = origEmissive.get(mat);
  if (orig) mat.emissive.copy(orig);
  mat.emissiveIntensity = 0;
  mat.needsUpdate = true;
}

// ═══════════════════════════════════════════════════════════════
// CampusModel
// ═══════════════════════════════════════════════════════════════
function CampusModel({
  onReady,
  selectedBuilding,
  buildings,
  onBuildingClick,
}: {
  onReady: (info: ModelInfo) => void;
  selectedBuilding: BuildingRecord | null;
  buildings: BuildingRecord[];
  onBuildingClick: (b: BuildingRecord | null) => void;
}) {
  const { scene } = useGLTF(GLB_PATH);
  const didInit        = useRef(false);
  const sceneOffsetRef = useRef(new THREE.Vector3());
  const prevSelected   = useRef<BuildingRecord | null>(null);

  // ------ Initialise once ------
  useEffect(() => {
    if (!scene || didInit.current) return;
    didInit.current = true;

    const box    = new THREE.Box3().setFromObject(scene);
    const center = new THREE.Vector3();
    const size   = new THREE.Vector3();
    box.getCenter(center);
    box.getSize(size);
    const radius = size.length() / 2;

    const offset = center.clone().negate();
    scene.position.set(offset.x, offset.y, offset.z);
    sceneOffsetRef.current.copy(offset);

    applyMaterialOverrides(scene);
    onReady({ radius, sceneOffset: offset.clone() });
  }, [scene, onReady]);

  // ------ Highlight ------
  useEffect(() => {
    if (!scene || !didInit.current) return;

    // Un-highlight previous
    if (prevSelected.current) {
      const prevCoords = prevSelected.current.modelCoordinates;
      scene.traverse((child) => {
        if (!(child as THREE.Mesh).isMesh) return;
        const mesh = child as THREE.Mesh;
        const wp = new THREE.Vector3();
        mesh.getWorldPosition(wp);
        const d = modelDistance(wp.x, wp.z, prevCoords.x, prevCoords.z);
        if (d < 50) {
          const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          mats.forEach(resetEmissive);
        }
      });
    }

    // Highlight new
    if (selectedBuilding) {
      const coords = selectedBuilding.modelCoordinates;
      scene.traverse((child) => {
        if (!(child as THREE.Mesh).isMesh) return;
        const mesh = child as THREE.Mesh;
        const wp = new THREE.Vector3();
        mesh.getWorldPosition(wp);
        const d = modelDistance(wp.x, wp.z, coords.x, coords.z);
        if (d < 40) {
          const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          mats.forEach((m) => setEmissive(m, HIGHLIGHT_EMISSIVE, HIGHLIGHT_INTENSITY));
        }
      });
    }

    prevSelected.current = selectedBuilding;
  }, [scene, selectedBuilding, buildings]);

  // ------ Click handler ------
  const handleClick = useCallback(
    (e: any) => {
      e.stopPropagation();
      if (!e.point || buildings.length === 0) return;

      const hitX = e.point.x as number;
      const hitZ = e.point.z as number;

      // Find nearest building record
      let bestDist = Infinity;
      let best: BuildingRecord | null = null;
      for (const b of buildings) {
        const d = modelDistance(hitX, hitZ, b.modelCoordinates.x, b.modelCoordinates.z);
        if (d < bestDist) { bestDist = d; best = b; }
      }

      // Only select if we're within 60 m of a known centroid
      onBuildingClick(bestDist < 60 ? best : null);
    },
    [buildings, onBuildingClick]
  );

  return (
    <primitive
      object={scene}
      onClick={handleClick}
      onPointerMissed={() => onBuildingClick(null)}
    />
  );
}

// ═══════════════════════════════════════════════════════════════
// SceneLighting
// ═══════════════════════════════════════════════════════════════
function SceneLighting({ radius }: { radius: number }) {
  const sunRef = useRef<THREE.DirectionalLight>(null);
  const d = radius * 2;

  useEffect(() => {
    if (!sunRef.current) return;
    const s = radius * 0.65;
    const cam = sunRef.current.shadow.camera;
    cam.left = -s; cam.right = s; cam.top = s; cam.bottom = -s;
    cam.near = 1;  cam.far = radius * 5;
    sunRef.current.shadow.mapSize.set(4096, 4096);
    sunRef.current.shadow.bias       = -0.0002;
    sunRef.current.shadow.normalBias = 0.02;
    (sunRef.current.shadow as any).radius = 2;
    cam.updateProjectionMatrix();
  }, [radius]);

  return (
    <>
      <directionalLight ref={sunRef} position={[d*.55, d*.85, d*.7]} intensity={3.2} color="#ffe4a0" castShadow />
      <directionalLight position={[-d*.4, d*.5, -d*.5]} intensity={0.9} color="#b0ccee" />
      <hemisphereLight color="#d0e8ff" groundColor="#4a5c30" intensity={0.85} />
      <ambientLight intensity={0.35} color="#c4d4f0" />
    </>
  );
}

// ═══════════════════════════════════════════════════════════════
// CameraRig — initial framing + smooth fly-to on selection
// ═══════════════════════════════════════════════════════════════
function CameraRig({
  radius,
  focusTarget,
}: {
  radius: number | null;
  focusTarget: THREE.Vector3 | null;
}) {
  const controlsRef = useRef<any>(null);
  const { camera }  = useThree();
  const prevRadius  = useRef<number | null>(null);

  // Animated lerp targets
  const lerpPos    = useRef<THREE.Vector3 | null>(null);
  const lerpTarget = useRef<THREE.Vector3 | null>(null);

  // Initial framing
  useEffect(() => {
    if (radius === null || radius === prevRadius.current) return;
    prevRadius.current = radius;
    const dist = radius * 1.25;
    const elev = (40 * Math.PI) / 180;
    const az   = (225 * Math.PI) / 180;
    camera.position.set(
      dist * Math.cos(elev) * Math.sin(az),
      dist * Math.sin(elev),
      dist * Math.cos(elev) * Math.cos(az)
    );
    camera.lookAt(0, 0, 0);
    camera.near = 0.5;
    camera.far  = radius * 14;
    camera.updateProjectionMatrix();
    if (controlsRef.current) {
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
    }
  }, [radius, camera]);

  // Fly to selected building
  useEffect(() => {
    if (!focusTarget || !radius) return;
    const r = radius * 0.25;
    const el = (35 * Math.PI) / 180;
    const az = (225 * Math.PI) / 180;
    lerpPos.current = new THREE.Vector3(
      focusTarget.x + r * Math.cos(el) * Math.sin(az),
      focusTarget.y + r * Math.sin(el),
      focusTarget.z + r * Math.cos(el) * Math.cos(az)
    );
    lerpTarget.current = focusTarget.clone();
  }, [focusTarget, radius]);

  // Smooth lerp every frame
  useFrame(() => {
    if (!lerpPos.current || !lerpTarget.current || !controlsRef.current) return;
    camera.position.lerp(lerpPos.current, 0.06);
    controlsRef.current.target.lerp(lerpTarget.current, 0.06);
    controlsRef.current.update();
    // Stop lerping when close enough
    if (camera.position.distanceTo(lerpPos.current) < 0.5) {
      lerpPos.current    = null;
      lerpTarget.current = null;
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.07}
      minDistance={radius ? radius * 0.04 : 5}
      maxDistance={radius ? radius * 7 : 3000}
      maxPolarAngle={(85 * Math.PI) / 180}
      minPolarAngle={(5  * Math.PI) / 180}
      zoomSpeed={1.0}
      rotateSpeed={0.55}
      panSpeed={0.75}
      enablePan
      screenSpacePanning={false}
      touches={{ ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN }}
    />
  );
}

// ═══════════════════════════════════════════════════════════════
// LoadingBridge
// ═══════════════════════════════════════════════════════════════
function LoadingBridge({ onProgress }: { onProgress: (pct: number, active: boolean) => void }) {
  const { progress, active } = useProgress();
  useEffect(() => {
    startTransition(() => onProgress(progress, active));
  }, [progress, active, onProgress]);
  return null;
}

// ═══════════════════════════════════════════════════════════════
// Overlays & Toolbar
// ═══════════════════════════════════════════════════════════════
function LoadingOverlay({ progress }: { progress: number }) {
  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#0a0f1a]/96 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-6">
        <div className="relative h-20 w-20">
          <div className="absolute inset-0 animate-ping rounded-full bg-sky-500/15" />
          <div className="absolute inset-2 animate-spin rounded-full border border-sky-500/20 border-t-sky-400/70" />
          <div className="relative flex h-20 w-20 items-center justify-center rounded-full border border-sky-500/25 bg-[#0d1a2e]">
            <svg className="h-9 w-9 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3h.008v.008h-.008V10.5Zm0 3h.008v.008h-.008V13.5Zm0 3h.008v.008h-.008V16.5Z" />
            </svg>
          </div>
        </div>
        <div className="text-center">
          <p className="font-display text-xl font-semibold text-white">MCE Digital Twin</p>
          <p className="mt-1 text-sm text-sky-300/70">
            {progress < 40 ? "Streaming 3D model…" : progress < 80 ? "Processing geometry…" : "Applying materials…"}
          </p>
        </div>
        <div className="h-1 w-60 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${Math.max(progress, 4)}%`,
              background: "linear-gradient(90deg,#38bdf8 0%,#818cf8 50%,#38bdf8 100%)",
              backgroundSize: "200% 100%",
            }}
          />
        </div>
        <p className="text-xs tabular-nums text-white/40">{Math.round(progress)}%</p>
      </div>
    </div>
  );
}

function ErrorOverlay({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#0a0f1a]/96 backdrop-blur-sm">
      <div className="max-w-sm text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-red-500/30 bg-red-500/10">
          <svg className="h-7 w-7 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
        </div>
        <h3 className="font-display text-lg font-semibold text-white">Failed to load campus model</h3>
        <p className="mt-2 text-sm text-white/50">{message}</p>
        <button onClick={onRetry} className="mt-5 inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500 transition-colors">
          Try again
        </button>
      </div>
    </div>
  );
}

function Toolbar({ onReset }: { onReset: () => void }) {
  return (
    <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-0.5 rounded-xl border border-white/10 bg-black/50 px-2 py-1.5 shadow-2xl backdrop-blur-xl">
      {[["⟳","Rotate","Left drag"],["⊕","Zoom","Scroll"],["⊠","Pan","Right drag"]].map(([icon, label, hint], i) => (
        <span key={label} className="flex items-center">
          {i > 0 && <span className="mx-1.5 inline-block h-4 w-px bg-white/15" />}
          <span className="inline-flex items-center gap-1.5 px-2 py-1">
            <span className="text-xs text-white/50">{icon}</span>
            <span className="hidden text-xs sm:block">
              <span className="font-medium text-white/70">{label}</span>{" "}
              <span className="text-[10px] text-white/30">{hint}</span>
            </span>
          </span>
        </span>
      ))}
      <span className="mx-1.5 inline-block h-4 w-px bg-white/15" />
      <button onClick={onReset} className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-white/50 transition-colors hover:bg-white/10 hover:text-white">
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" />
        </svg>
        Reset
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// CampusScene — main export
// ═══════════════════════════════════════════════════════════════
interface CampusSceneProps {
  buildings: BuildingRecord[];
  selectedBuilding: BuildingRecord | null;
  onBuildingSelect: (b: BuildingRecord | null) => void;
}

export default function CampusScene({
  buildings,
  selectedBuilding,
  onBuildingSelect,
}: CampusSceneProps) {
  const [progress,    setProgress]    = useState(0);
  const [loaderDone,  setLoaderDone]  = useState(false);
  const [modelRadius, setModelRadius] = useState<number | null>(null);
  const [error,       setError]       = useState<string | null>(null);
  const [resetKey,    setResetKey]    = useState(0);
  const [focusTarget, setFocusTarget] = useState<THREE.Vector3 | null>(null);

  const isReady = loaderDone && modelRadius !== null && !error;
  const radius  = modelRadius ?? 350;

  const handleProgress = useCallback((pct: number, active: boolean) => {
    setProgress(pct);
    if (!active && pct >= 99) setLoaderDone(true);
  }, []);

  const handleModelReady = useCallback((info: ModelInfo) => {
    setModelRadius(info.radius);
    setLoaderDone(true);
  }, []);

  const handleReset = useCallback(() => {
    setResetKey((k) => k + 1);
    setModelRadius(null);
    setLoaderDone(false);
    setProgress(0);
    setError(null);
    setFocusTarget(null);
    onBuildingSelect(null);
  }, [onBuildingSelect]);

  // When a building is selected (from click or search), compute fly-to target
  useEffect(() => {
    if (selectedBuilding) {
      setFocusTarget(
        new THREE.Vector3(
          selectedBuilding.modelCoordinates.x,
          0,
          selectedBuilding.modelCoordinates.z
        )
      );
    } else {
      setFocusTarget(null);
    }
  }, [selectedBuilding]);

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#080d16]">
      {!isReady && !error && <LoadingOverlay progress={progress} />}
      {error && <ErrorOverlay message={error} onRetry={handleReset} />}
      {isReady && <Toolbar onReset={handleReset} />}

      {/* Status badge */}
      {isReady && (
        <div className="absolute left-3 bottom-14 z-10 hidden sm:flex items-center gap-2 rounded-lg border border-white/10 bg-black/50 px-3 py-1.5 text-xs text-white/60 shadow backdrop-blur-xl">
          <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
          <span className="font-medium text-white/80">Digital Twin</span>
          <span className="text-white/30">·</span>
          {CAMPUS_STATS.buildings}B · {CAMPUS_STATS.roads}R · {CAMPUS_STATS.trees} trees
        </div>
      )}

      {/* Coordinates badge */}
      {isReady && (
        <div className="absolute right-3 bottom-14 z-10 hidden sm:flex items-center gap-1.5 rounded-lg border border-white/10 bg-black/50 px-3 py-1.5 text-[11px] text-white/40 shadow backdrop-blur-xl">
          <svg className="h-3.5 w-3.5 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
          </svg>
          {CAMPUS_STATS.originLat}°N, {CAMPUS_STATS.originLon}°E
        </div>
      )}

      {/* Click hint */}
      {isReady && !selectedBuilding && (
        <div className="absolute left-1/2 top-14 z-10 -translate-x-1/2 rounded-lg border border-white/8 bg-black/40 px-3 py-1 text-[11px] text-white/35 backdrop-blur-md pointer-events-none">
          Click a building to explore · Search above to find a facility
        </div>
      )}

      <Canvas
        key={resetKey}
        shadows={{ type: THREE.PCFShadowMap }}
        dpr={[1, Math.min(2, typeof window !== "undefined" ? window.devicePixelRatio : 1)]}
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.15,
          outputColorSpace: THREE.SRGBColorSpace,
          logarithmicDepthBuffer: true,
        }}
        camera={{ fov: 48, near: 0.5, far: 8000, position: [0, 100, 300] }}
        style={{ width: "100%", height: "100%" }}
        onError={() => setError("WebGL error — your browser may not support 3D graphics.")}
      >
        <LoadingBridge onProgress={handleProgress} />
        <color attach="background" args={["#090e1a"]} />
        <fog attach="fog" args={["#0c1525", radius * 3.5, radius * 9]} />

        <SceneLighting radius={radius} />

        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
          <planeGeometry args={[CAMPUS_STATS.areaW * 4, CAMPUS_STATS.areaH * 4]} />
          <shadowMaterial opacity={0.3} />
        </mesh>

        <CampusModel
          onReady={handleModelReady}
          selectedBuilding={selectedBuilding}
          buildings={buildings}
          onBuildingClick={onBuildingSelect}
        />

        <CameraRig radius={modelRadius} focusTarget={focusTarget} />
        <Environment preset="dawn" environmentIntensity={0.35} />
      </Canvas>
    </div>
  );
}

useGLTF.preload(GLB_PATH);
