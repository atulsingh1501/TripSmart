import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export interface PlacePoint {
  name: string;
  coords: [number, number];
}

function placeIcon(index: number) {
  const n = index + 1;
  const svg = `<svg width="28" height="38" viewBox="0 0 32 44" xmlns="http://www.w3.org/2000/svg">
    <path d="M16 0C7.163 0 0 7.163 0 16c0 12 16 28 16 28S32 28 32 16C32 7.163 24.837 0 16 0z" fill="#50C878"/>
    <circle cx="16" cy="16" r="9" fill="#013220"/>
    <text x="16" y="20" text-anchor="middle" font-size="10" font-weight="700" fill="#D1F2EB" font-family="system-ui">${n}</text>
  </svg>`;
  return L.divIcon({
    html: svg,
    className: '',
    iconSize: [28, 38],
    iconAnchor: [14, 38],
    popupAnchor: [0, -36],
  });
}

export default function PlacesMap({
  places,
  cityLabel,
}: {
  places: PlacePoint[];
  cityLabel?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layersRef = useRef<L.Layer[]>([]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    try {
      mapRef.current = L.map(containerRef.current, {
        center: places[0]?.coords || [22.5, 80],
        zoom: 12,
        zoomControl: true,
        attributionControl: false,
      });
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 18,
      }).addTo(mapRef.current);
      requestAnimationFrame(() => mapRef.current?.invalidateSize());
    } catch {
      mapRef.current = null;
    }
    return () => {
      try { mapRef.current?.remove(); } catch { /* ignore */ }
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !Array.isArray(places) || places.length === 0) return;
    try {
      layersRef.current.forEach(l => l.remove());
      layersRef.current = [];
      places.forEach((p, i) => {
        if (!p?.coords) return;
        layersRef.current.push(
          L.marker(p.coords, { icon: placeIcon(i) })
            .bindPopup(`<strong style="color:#013220">${String(p.name || '').replace(/</g, '&lt;')}</strong>`)
            .addTo(map)
        );
      });
      const valid = places.filter(p => p?.coords);
      if (valid.length === 0) return;
      map.invalidateSize();
      if (valid.length === 1) {
        map.flyTo(valid[0].coords, 13, { duration: 0.8 });
      } else {
        map.flyToBounds(L.latLngBounds(valid.map(p => p.coords)), { padding: [36, 36], maxZoom: 14, duration: 0.8 });
      }
    } catch { /* map fit can fail on hidden containers */ }
  }, [places]);

  return (
    <div className="relative overflow-hidden rounded-2xl places-embed-map" style={{ border: '1px solid rgba(80,200,120,0.22)' }}>
      {cityLabel && (
        <div
          className="absolute top-2 left-2 z-[400] px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
          style={{ background: 'rgba(1,50,32,0.88)', color: '#D1F2EB', border: '1px solid rgba(80,200,120,0.28)' }}
        >
          {cityLabel}
        </div>
      )}
      <div ref={containerRef} className="w-full h-[340px]" />
    </div>
  );
}
