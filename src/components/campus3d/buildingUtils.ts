/**
 * buildingUtils.ts
 *
 * CRS coordinate transformation for the Gen-Map MCE campus model.
 *
 * Model CRS (from scene_manifest.json):
 *   proj4: +proj=tmerc +lat_0=13.0239 +lon_0=76.10352 +k=1 +x_0=0 +y_0=0
 *   axis:  glTF y-up: x=east, y=up, z=-north
 *
 * The GLB scene is recentred at load time:
 *   scene.position.set(-bbox.center.x, -bbox.center.y, -bbox.center.z)
 * So world-space x/z ≈ local-space x/z (the bounding box centre xz ≈ 0
 * because the campus is centred on the projection origin).
 */

// Projection origin
const ORIGIN_LAT = 13.0239;
const ORIGIN_LON = 76.10352;
// Metres per degree at this latitude (WGS84 approximation)
const M_PER_DEG_LON = Math.cos((ORIGIN_LAT * Math.PI) / 180) * 111320; // ≈ 108,485 m/°
const M_PER_DEG_LAT = 110540; // ≈ 110,540 m/°

/** Convert WGS84 → model local XZ coordinates (metres from origin). */
export function gpsToModel(lat: number, lon: number): { x: number; z: number } {
  return {
    x:  (lon - ORIGIN_LON) * M_PER_DEG_LON,
    z: -(lat - ORIGIN_LAT) * M_PER_DEG_LAT,
  };
}

/** Horizontal distance (metres) between two GPS points. */
export function gpsDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const dx = (lon1 - lon2) * M_PER_DEG_LON;
  const dz = (lat1 - lat2) * M_PER_DEG_LAT;
  return Math.sqrt(dx * dx + dz * dz);
}

/** 2-D distance in model space (XZ only). */
export function modelDistance(
  ax: number, az: number,
  bx: number, bz: number
): number {
  return Math.sqrt((ax - bx) ** 2 + (az - bz) ** 2);
}
