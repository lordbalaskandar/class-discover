// Adapters + hooks that expose live gateway data to the mobile mock UI.
// Keep the mock UI shapes stable — swap only the data source.

import { useMemo } from "react";
import {
  useClasses,
  useGyms,
  useMyClasses,
  useMyBookings,
  useMyGym,
  useClass,
} from "./hooks";
import type { ApiClass, ApiGym, ApiBooking } from "./api";

/* ============ Types (mirror mobile.tsx local types) ============ */
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
  startAt?: string;
  gymId?: string;
};

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

export type HostClass = {
  id: string;
  title: string;
  activity: string;
  date: string;
  time: string;
  duration: string;
  price: number;
  booked: number;
  capacity: number;
  image: string;
};

/* ============ Deterministic gradients so lists look alive ============ */
const GRADIENTS = [
  "linear-gradient(135deg,#f4b942,#e07a5f)",
  "linear-gradient(135deg,#2c2c2e,#5c5c5e)",
  "linear-gradient(135deg,#84a98c,#52796f)",
  "linear-gradient(135deg,#3d5a80,#98c1d9)",
  "linear-gradient(135deg,#e63946,#f1a208)",
  "linear-gradient(135deg,#6a4c93,#b298dc)",
  "linear-gradient(135deg,#1b998b,#2ec4b6)",
  "linear-gradient(135deg,#bb3e00,#ff6b35)",
];
function gradientFor(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return GRADIENTS[h % GRADIENTS.length];
}

/* ============ Adapters ============ */

export function classToItem(c: ApiClass): ClassItem {
  const start = c.startAt ? new Date(c.startAt) : null;
  const date = start
    ? start.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })
    : "TBD";
  const time = start
    ? start.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })
    : "";
  const price = Math.round((c.priceCents ?? 0) / 100);
  const location = [c.city, c.country].filter(Boolean).join(", ") || c.gymName || "Location TBD";
  return {
    id: c.id,
    title: c.title,
    host: c.gymName ?? "Independent",
    hostType: c.gymId ? "gym" : "person",
    activity: c.activityType ?? "Other",
    location,
    date,
    time,
    duration: `${c.durationMinutes} min`,
    price,
    rating: 4.8,
    reviews: 0,
    spots: c.capacity ?? 0,
    capacity: c.capacity ?? 0,
    image: gradientFor(c.id),
    startAt: c.startAt,
    gymId: c.gymId,
  };
}

export function gymToHost(g: ApiGym): HostItem {
  const location = [g.address?.city, g.address?.country].filter(Boolean).join(", ") || "—";
  return {
    id: g.id,
    name: g.name,
    type: "gym",
    activities: ["Strength", "HIIT"],
    location,
    distance: Math.round(((g.address?.lat ?? 0) + 5) * 10) / 10 || 2.5,
    rating: g.rating ?? 4.7,
    reviews: g.totalRatings ?? 0,
    pricePerHour: 55,
    classId: g.id,
    image: gradientFor(g.id),
    bio: g.description ?? "",
    lat: g.address?.lat ?? 37.7749,
    lng: g.address?.lng ?? -122.4194,
  };
}

export function classToHostClass(c: ApiClass): HostClass {
  const start = c.startAt ? new Date(c.startAt) : null;
  const now = new Date();
  const sameDay =
    start &&
    start.getFullYear() === now.getFullYear() &&
    start.getMonth() === now.getMonth() &&
    start.getDate() === now.getDate();
  const date = sameDay
    ? "Today"
    : start
      ? start.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })
      : "TBD";
  const time = start
    ? start.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })
    : "";
  return {
    id: c.id,
    title: c.title,
    activity: c.activityType ?? "Other",
    date,
    time,
    duration: `${c.durationMinutes} min`,
    price: Math.round((c.priceCents ?? 0) / 100),
    booked: 0,
    capacity: c.capacity ?? 0,
    image: gradientFor(c.id),
  };
}

/* ============ Hooks the screens call ============ */

export function useLiveClasses(): ClassItem[] {
  const { data } = useClasses(30);
  return useMemo(() => (data ?? []).map(classToItem), [data]);
}

export function useLiveHosts(): HostItem[] {
  const { data } = useGyms(30);
  return useMemo(() => (data ?? []).map(gymToHost), [data]);
}

export function useLiveHostClasses(): HostClass[] {
  const { data } = useMyClasses();
  return useMemo(() => (data ?? []).map(classToHostClass), [data]);
}

export function useLiveMyBookings(): { booking: ApiBooking; cls?: ClassItem }[] {
  const { data: bookings } = useMyBookings();
  const { data: allClasses } = useClasses(50);
  return useMemo(() => {
    const byId = new Map((allClasses ?? []).map((c) => [c.id, classToItem(c)] as const));
    return (bookings ?? []).map((b) => ({ booking: b, cls: byId.get(b.classId) }));
  }, [bookings, allClasses]);
}

export function useLiveClass(id: string | null): ClassItem | null {
  const { data } = useClass(id);
  return useMemo(() => (data ? classToItem(data) : null), [data]);
}

export function useLiveMyGym() {
  return useMyGym();
}
