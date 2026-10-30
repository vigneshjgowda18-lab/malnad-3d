# MCE Campus OS — 3D Campus Digital Twin

> **Malnad College of Engineering, Hassan, Karnataka, India**
> An interactive 3D campus digital twin and campus management platform built with React + Three.js.

---

## Overview

Campus OS is a web application that combines a **3D interactive campus map** with practical student and staff tools. The centrepiece is a real-world Gen-Map 3D model of MCE's 500 × 400 m campus, overlaid with verified building metadata, searchable facilities, and live camera navigation.

### Key Modules

| Module | Description |
|---|---|
| 🏛️ **3D Campus Digital Twin** | Interactive Three.js viewer of the real MCE campus model (21 buildings, 25 roads, 147 trees) |
| 🔍 **FindIt** | Campus facility and service locator |
| 📋 **DocDesk** | Document management and request portal |
| 🔧 **FixIt** | Infrastructure maintenance ticket system |
| 🔐 **Auth** | Role-based login (student / staff / admin) |

---

## 3D Campus Digital Twin

### Data Sources
- **3D Model**: Gen-Map export — `500 × 400 m`, origin `13.0239°N, 76.10352°E`
- **Building metadata**: MCE NAAC 2023 laboratory records (GPS coordinates)
- **Building footprints**: OpenStreetMap Overpass API (21 OSM way IDs)

### Building Identification Status
| Status | Count |
|---|---|
| Partially Verified | 6 |
| Unidentified | 15 |

Verified buildings include: **SA Block**, **CS Department Block**, **CS/Electronics Block**, **College Block**, **Canara Bank**, **Annapoornesvari Marriage Hall**

### Features
- Click any building to select and highlight it
- Camera flies smoothly to selected buildings
- Search bar: filter by building name, department, facility, or lab
- Detail panel: name, verification status, GPS coordinates, facilities, OSM source link
- Fullscreen mode
- Atmospheric lighting with golden-hour sun, fog, and PCF shadows

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 + TypeScript |
| Routing | TanStack Router (file-based) |
| 3D Engine | Three.js via React Three Fiber |
| 3D Helpers | @react-three/drei |
| Styling | Vanilla CSS + Tailwind CSS |
| Build | Vite 8 |
| Package Manager | npm / bun |

---

## Project Structure

```
src/
├── components/
│   ├── campus3d/          # 3D Digital Twin components
│   │   ├── CampusScene.tsx        # Three.js scene (Phase 1+2)
│   │   ├── CampusViewer.tsx       # Page wrapper + overlays
│   │   ├── BuildingPanel.tsx      # Selected-building detail panel
│   │   ├── BuildingSearch.tsx     # Search bar with autocomplete
│   │   ├── buildingUtils.ts       # GPS ↔ model coordinate transforms
│   │   └── campus-data.ts         # Campus stats + building metadata
│   ├── auth/              # Login / auth forms
│   ├── fixit/             # FixIt maintenance module
│   └── ui/                # Shared UI primitives
├── data/
│   └── mceCampusBuildings.json    # Full building database (21 records)
├── routes/                # TanStack Router file-based routes
├── hooks/                 # Custom React hooks
└── styles.css             # Global styles

public/
└── campus3d/
    └── gen-map_Export_13.024_76.104_500x400/
        ├── Meshes_GLB/            # Tile_X0_Y0.glb (1.1 MB 3D model)
        ├── Heightmaps/            # Terrain heightmap PNGs + RAW
        ├── Instances/             # Tree instance data
        ├── scene_manifest.json    # CRS, bounds, feature counts
        └── LICENSE_CREDITS.txt
```

---

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:8080](http://localhost:8080) and navigate to `/campus3d` for the 3D viewer.

---

## Model Coordinates

The GLB uses a Transverse Mercator projection:

```
+proj=tmerc +lat_0=13.0239 +lon_0=76.10352 +k=1 +x_0=0 +y_0=0 +ellps=WGS84 +units=m
Axis: glTF y-up: x=east, y=up, z=-north
Area: 500 × 400 m
```

GPS → model coordinates:
```
x = (lon - 76.10352) × 108485    [metres east]
z = -(lat - 13.0239) × 110540    [metres north, negated for glTF z]
```

---

## License

Source code: MIT  
3D model data: see `public/campus3d/.../LICENSE_CREDITS.txt` (Gen-Map / OpenStreetMap contributors)
