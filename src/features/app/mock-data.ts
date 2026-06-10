// Shared mock data lifted from src/routes/mobile.tsx so desktop routes can
// render the same fictional content as the mobile preview. When these
// concepts get promoted to real Supabase tables (gyms, members, saved,
// notifications), delete this file and import from the data layer instead.

export type HostItem = {
  id: string;
  name: string;
  type: "person" | "gym";
  activities: string[];
  location: string;
  distance: number;
  rating: number;
  reviews: number;
  pricePerHour: number;
  classId: string;
  image: string;
  bio: string;
  lat: number;
  lng: number;
};

export const HOSTS: HostItem[] = [
  { id: "h1", name: "Maya Calder", type: "person", activities: ["Yoga", "Mobility"], location: "Mission, SF", distance: 1.2, rating: 4.9, reviews: 184, pricePerHour: 60, classId: "1", image: "linear-gradient(135deg,#f4b942,#e07a5f)", bio: "RYT-500 yoga teacher. Sunrise flows in the park.", lat: 37.7599, lng: -122.4148 },
  { id: "h2", name: "Iron Forge Gym", type: "gym", activities: ["BJJ", "Strength", "HIIT"], location: "SoMa, SF", distance: 2.8, rating: 4.8, reviews: 96, pricePerHour: 45, classId: "2", image: "linear-gradient(135deg,#2c2c2e,#5c5c5e)", bio: "Combat sports & strength gym. Open mats nightly.", lat: 37.7785, lng: -122.4056 },
  { id: "h3", name: "Devon Walsh", type: "person", activities: ["Running", "HIIT"], location: "Marin, SF", distance: 6.4, rating: 5.0, reviews: 42, pricePerHour: 50, classId: "3", image: "linear-gradient(135deg,#84a98c,#52796f)", bio: "Endurance coach. Trail runs & threshold work.", lat: 37.8915, lng: -122.5239 },
  { id: "h4", name: "Priya Anand", type: "person", activities: ["Climbing", "Mobility"], location: "Dogpatch, SF", distance: 3.1, rating: 4.7, reviews: 58, pricePerHour: 70, classId: "1", image: "linear-gradient(135deg,#7c83fd,#96baff)", bio: "Climbing coach — bouldering technique & projecting.", lat: 37.7587, lng: -122.3884 },
  { id: "h5", name: "Mission Athletic Club", type: "gym", activities: ["Strength", "Yoga", "HIIT"], location: "Mission, SF", distance: 1.6, rating: 4.6, reviews: 212, pricePerHour: 35, classId: "2", image: "linear-gradient(135deg,#3a506b,#5bc0be)", bio: "Boutique club with daily group classes.", lat: 37.7625, lng: -122.4194 },
  { id: "h6", name: "Sam Okafor", type: "person", activities: ["Boxing", "HIIT", "Strength"], location: "SoMa, SF", distance: 4.2, rating: 4.9, reviews: 73, pricePerHour: 80, classId: "3", image: "linear-gradient(135deg,#e63946,#f1a208)", bio: "Former amateur boxer. 1-on-1 pad work & conditioning.", lat: 37.7825, lng: -122.4001 },
];

export const HOST_ACTIVITIES = ["Yoga", "BJJ", "Running", "HIIT", "Climbing", "Strength", "Boxing", "Mobility"] as const;

export type ClassItem = {
  id: string;
  title: string;
  host: string;
  hostType: "person" | "gym";
  activity: string;
  location: string;
  date: string;
  time: string;
  duration: string;
  price: number;
  rating: number;
  reviews: number;
  spots: number;
  capacity: number;
  image: string;
};

export const CLASSES: ClassItem[] = [
  { id: "1", title: "Sunrise Vinyasa Flow", host: "Maya Calder", hostType: "person", activity: "Yoga", location: "Dolores Park, SF", date: "Sat, Jun 14", time: "7:00 AM", duration: "60 min", price: 22, rating: 4.9, reviews: 184, spots: 4, capacity: 12, image: "linear-gradient(135deg,#f4b942,#e07a5f)" },
  { id: "2", title: "Iron Forge — Open Mat", host: "Iron Forge Gym", hostType: "gym", activity: "BJJ", location: "SoMa, SF", date: "Sun, Jun 15", time: "11:00 AM", duration: "90 min", price: 35, rating: 4.8, reviews: 96, spots: 8, capacity: 20, image: "linear-gradient(135deg,#2c2c2e,#5c5c5e)" },
  { id: "3", title: "Trail Run + Coffee", host: "Devon Walsh", hostType: "person", activity: "Running", location: "Marin Headlands", date: "Sat, Jun 14", time: "8:30 AM", duration: "75 min", price: 15, rating: 5.0, reviews: 42, spots: 2, capacity: 8, image: "linear-gradient(135deg,#84a98c,#52796f)" },
];

/** Local-only "saved class ids" stored in localStorage so heart toggles persist across the desktop app. */
const SAVED_KEY = "dryvon.saved.classes";
export function loadSavedIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(SAVED_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}
export function persistSavedIds(ids: Set<string>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SAVED_KEY, JSON.stringify(Array.from(ids)));
}
