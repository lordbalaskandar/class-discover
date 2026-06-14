import { useEffect, useRef, useState } from "react";

export type MapHost = {
  id: string;
  name: string;
  type: "person" | "gym";
  activities: string[];
  location: string;
  rating: number;
  pricePerHour: number;
  lat: number;
  lng: number;
};

declare global {
  interface Window {
    google?: any;
    __pulstractInitMap?: () => void;
    __pulstractMapReady?: boolean;
  }
}

const SCRIPT_ID = "pulstract-gmaps-js";

function loadGoogleMaps(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.__pulstractMapReady && window.google?.maps) return Promise.resolve();
  return new Promise((resolve, reject) => {
    if (document.getElementById(SCRIPT_ID)) {
      const check = () =>
        window.__pulstractMapReady ? resolve() : setTimeout(check, 80);
      check();
      return;
    }
    window.__pulstractInitMap = () => {
      window.__pulstractMapReady = true;
      resolve();
    };
    const key = import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY;
    const channel = import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_TRACKING_ID;
    if (!key) {
      reject(new Error("Google Maps key missing"));
      return;
    }
    const s = document.createElement("script");
    s.id = SCRIPT_ID;
    s.async = true;
    s.defer = true;
    s.src = `https://maps.googleapis.com/maps/api/js?key=${key}&loading=async&callback=__pulstractInitMap${channel ? `&channel=${channel}` : ""}`;
    s.onerror = () => reject(new Error("Failed to load Google Maps"));
    document.head.appendChild(s);
  });
}

export function HostsMap({
  hosts,
  selectedId,
  onSelect,
}: {
  hosts: MapHost[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<Record<string, any>>({});
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  // Load and init map once
  useEffect(() => {
    let cancelled = false;
    loadGoogleMaps()
      .then(() => {
        if (cancelled || !containerRef.current || !window.google?.maps) return;
        const center = hosts.length
          ? { lat: hosts[0].lat, lng: hosts[0].lng }
          : { lat: 37.7749, lng: -122.4194 };
        mapRef.current = new window.google.maps.Map(containerRef.current, {
          center,
          zoom: 12,
          disableDefaultUI: true,
          zoomControl: true,
          gestureHandling: "greedy",
          styles: [
            { featureType: "poi", stylers: [{ visibility: "off" }] },
            { featureType: "transit", stylers: [{ visibility: "off" }] },
          ],
        });
        setStatus("ready");
      })
      .catch(() => !cancelled && setStatus("error"));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync markers
  useEffect(() => {
    if (status !== "ready" || !mapRef.current || !window.google?.maps) return;
    const g = window.google.maps;
    // Remove stale
    Object.keys(markersRef.current).forEach((id) => {
      if (!hosts.find((h) => h.id === id)) {
        markersRef.current[id].setMap(null);
        delete markersRef.current[id];
      }
    });
    // Add / update
    hosts.forEach((h) => {
      const active = h.id === selectedId;
      const color = h.type === "gym" ? "#2c2c2e" : "#e07a5f";
      const icon = {
        path: g.SymbolPath.CIRCLE,
        scale: active ? 12 : 8,
        fillColor: color,
        fillOpacity: 1,
        strokeColor: "#ffffff",
        strokeWeight: active ? 3 : 2,
      };
      const existing = markersRef.current[h.id];
      if (existing) {
        existing.setIcon(icon);
        existing.setPosition({ lat: h.lat, lng: h.lng });
      } else {
        const marker = new g.Marker({
          position: { lat: h.lat, lng: h.lng },
          map: mapRef.current,
          title: h.name,
          icon,
        });
        marker.addListener("click", () => onSelect(h.id));
        markersRef.current[h.id] = marker;
      }
    });
    // Fit bounds when host set changes
    if (hosts.length > 1) {
      const bounds = new g.LatLngBounds();
      hosts.forEach((h) => bounds.extend({ lat: h.lat, lng: h.lng }));
      mapRef.current.fitBounds(bounds, 60);
    } else if (hosts.length === 1) {
      mapRef.current.setCenter({ lat: hosts[0].lat, lng: hosts[0].lng });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, hosts.map((h) => h.id).join(","), selectedId]);

  // Pan to selected
  useEffect(() => {
    if (status !== "ready" || !mapRef.current || !selectedId) return;
    const h = hosts.find((x) => x.id === selectedId);
    if (h) mapRef.current.panTo({ lat: h.lat, lng: h.lng });
  }, [selectedId, status, hosts]);

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="absolute inset-0 bg-muted" />
      {status === "loading" && (
        <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground bg-muted">
          Loading map…
        </div>
      )}
      {status === "error" && (
        <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground bg-muted px-6 text-center">
          Map unavailable
        </div>
      )}
    </div>
  );
}
