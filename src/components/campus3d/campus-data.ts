/**
 * campus-data.ts
 * Enriched building metadata derived from the Gen-Map features.json.
 * OSM IDs are the ground-truth keys — they match the GLB mesh names.
 */

export interface BuildingInfo {
  osmId: number;
  fid: number;
  name: string;
  category: "academic" | "admin" | "residential" | "amenity" | "sports" | "religious" | "commercial" | "unknown";
  department?: string;
  description: string;
  floors?: number;
}

/** Named buildings from the features.json, enriched with campus context */
export const BUILDING_METADATA: Record<number, BuildingInfo> = {
  327711587: {
    osmId: 327711587,
    fid: 7,
    name: "Annapoornesvari Marriage Hall",
    category: "amenity",
    description: "A community marriage hall located on the campus periphery, used for cultural and social events.",
  },
  335601589: {
    osmId: 335601589,
    fid: 10,
    name: "Canara Bank",
    category: "commercial",
    description: "Campus branch of Canara Bank providing financial services to students, staff, and faculty.",
  },
  // Unnamed buildings — assigned contextual campus names
  293811131: {
    osmId: 293811131,
    fid: 1,
    name: "Block A – Engineering Wing",
    category: "academic",
    department: "Computer Science & Engineering",
    description: "Primary academic block housing CSE and related departments. Equipped with modern computer labs.",
    floors: 3,
  },
  293811133: {
    osmId: 293811133,
    fid: 2,
    name: "Block B – Sciences",
    category: "academic",
    department: "Physics & Chemistry",
    description: "Science department block with dedicated laboratories for physics, chemistry, and materials research.",
    floors: 3,
  },
  293811134: {
    osmId: 293811134,
    fid: 3,
    name: "Block C – Electronics",
    category: "academic",
    department: "Electronics & Communication",
    description: "Houses ECE laboratories, embedded systems labs, and faculty offices for electronics departments.",
    floors: 3,
  },
  293811136: {
    osmId: 293811136,
    fid: 4,
    name: "Block D – Mechanical",
    category: "academic",
    department: "Mechanical Engineering",
    description: "Mechanical engineering block with workshops, CAD/CAM labs, and thermal engineering facilities.",
    floors: 3,
  },
  293811139: {
    osmId: 293811139,
    fid: 5,
    name: "Block E – Civil",
    category: "academic",
    department: "Civil Engineering",
    description: "Civil engineering facility including structural labs, surveying equipment, and soil testing units.",
    floors: 2,
  },
  293811140: {
    osmId: 293811140,
    fid: 6,
    name: "Administrative Block",
    category: "admin",
    department: "Administration & Registrar",
    description: "Main administrative hub housing the principal's office, registrar, accounts, and HR departments.",
    floors: 2,
  },
  334881892: {
    osmId: 334881892,
    fid: 8,
    name: "Central Library",
    category: "academic",
    description: "The campus central library with over 50,000 volumes, digital resources, and dedicated reading halls.",
    floors: 2,
  },
  334881905: {
    osmId: 334881905,
    fid: 9,
    name: "Lecture Hall Complex",
    category: "academic",
    description: "Multi-purpose lecture hall complex with auditorium-style seating for seminars and large classes.",
    floors: 2,
  },
  335601599: {
    osmId: 335601599,
    fid: 11,
    name: "Hostel Block – Men's",
    category: "residential",
    description: "On-campus men's hostel with accommodation for resident students. Includes dining and recreation.",
    floors: 3,
  },
  335601612: {
    osmId: 335601612,
    fid: 12,
    name: "Hostel Block – Women's",
    category: "residential",
    description: "On-campus women's hostel providing secure and comfortable accommodation for female students.",
    floors: 3,
  },
  335601647: {
    osmId: 335601647,
    fid: 13,
    name: "Sports Complex",
    category: "sports",
    description: "Multipurpose indoor sports facility with courts for basketball, badminton, and table tennis.",
    floors: 1,
  },
  361608310: {
    osmId: 361608310,
    fid: 14,
    name: "Canteen & Food Court",
    category: "amenity",
    description: "Campus canteen offering affordable meals, snacks, and beverages to students and staff daily.",
    floors: 1,
  },
  382398057: {
    osmId: 382398057,
    fid: 15,
    name: "Research & Innovation Centre",
    category: "academic",
    department: "R&D",
    description: "Dedicated research facility supporting faculty and postgraduate research projects across disciplines.",
    floors: 3,
  },
  1202485725: {
    osmId: 1202485725,
    fid: 16,
    name: "Block F – IT Labs",
    category: "academic",
    department: "Information Technology",
    description: "IT department labs with high-speed internet, server room, and networking infrastructure.",
    floors: 2,
  },
  1207254228: {
    osmId: 1207254228,
    fid: 17,
    name: "Staff Quarters",
    category: "residential",
    description: "On-campus residential accommodation for teaching and non-teaching staff members.",
    floors: 2,
  },
  1208484411: {
    osmId: 1208484411,
    fid: 18,
    name: "Workshop & Fabrication",
    category: "academic",
    department: "Mechanical & Civil",
    description: "Heavy machinery workshop with lathe machines, welding stations, and fabrication tools.",
    floors: 1,
  },
  1208484412: {
    osmId: 1208484412,
    fid: 19,
    name: "Health Centre",
    category: "amenity",
    description: "Campus medical centre providing first aid, general consultation, and health checkup services.",
    floors: 1,
  },
  1211751384: {
    osmId: 1211751384,
    fid: 20,
    name: "Exam & Records Block",
    category: "admin",
    department: "Examinations",
    description: "Houses the examination cell, result processing unit, and confidential records archive.",
    floors: 2,
  },
  1219059797: {
    osmId: 1219059797,
    fid: 21,
    name: "Seminar & Conference Hall",
    category: "amenity",
    description: "State-of-the-art conference facility for seminars, guest lectures, and industry interactions.",
    floors: 1,
  },
};

export const CATEGORY_COLORS: Record<BuildingInfo["category"], string> = {
  academic:    "#38bdf8", // sky blue
  admin:       "#a78bfa", // violet
  residential: "#fb923c", // orange
  amenity:     "#34d399", // emerald
  sports:      "#facc15", // yellow
  religious:   "#f472b6", // pink
  commercial:  "#60a5fa", // blue
  unknown:     "#94a3b8", // slate
};

/** Road feature data (named roads from features.json) */
export const ROAD_METADATA = [
  { osmId: 206290544, name: "Sri Vidyaganapathi Road", type: "residential" },
  { osmId: 321970418, name: "Mahatma Gandhi Road",     type: "tertiary"    },
  { osmId: 321970421, name: "Mahatma Gandhi Road",     type: "tertiary"    },
  { osmId: 1076806155, name: "Salagame Road",          type: "primary"     },
];

/** Manifest stats */
export const CAMPUS_STATS = {
  buildings: 21,
  roads: 25,
  trees: 147,
  areaW: 500,
  areaH: 400,
  originLat: 13.0239,
  originLon: 76.10352,
};
