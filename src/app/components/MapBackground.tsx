import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { getCoordinates, haversineKm } from '../../data/cityCoordinates';
import { useTheme } from './ThemeProvider';

// ── Tile-layer URLs ──────────────────────────────────────
const TILES = {
    dark:  'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    light: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
};

// Fix Leaflet default icon paths broken by bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Build a pin-shaped SVG marker
function createSvgIcon(color: string, label: string) {
    const svg = `<svg width="32" height="44" viewBox="0 0 32 44" xmlns="http://www.w3.org/2000/svg">
    <filter id="sh"><feDropShadow dx="0" dy="2" stdDeviation="2" flood-opacity="0.4"/></filter>
    <path d="M16 0C7.163 0 0 7.163 0 16c0 12 16 28 16 28S32 28 32 16C32 7.163 24.837 0 16 0z"
          fill="${color}" filter="url(#sh)"/>
    <circle cx="16" cy="16" r="8" fill="white" opacity="0.9"/>
    <text x="16" y="20" text-anchor="middle" font-size="9" font-weight="bold"
          fill="${color}" font-family="system-ui">${label}</text>
  </svg>`;
    return L.divIcon({
        html: svg,
        className: '',
        iconSize: [32, 44],
        iconAnchor: [16, 44],
        popupAnchor: [0, -44],
    });
}

const originIcon      = createSvgIcon('#10b981', 'A');
const destinationIcon = createSvgIcon('#ef4444', 'B');
const stopIcon        = (n: number) => createSvgIcon('#f59e0b', String(n));

/** Floating distance label placed at the midpoint of the direct line */
function createDistanceLabel(km: number, theme: 'light' | 'dark') {
    const bg     = theme === 'dark' ? 'rgba(10,12,28,0.85)' : 'rgba(255,255,255,0.93)';
    const color  = theme === 'dark' ? '#e2e8f0' : '#1e293b';
    const border = theme === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)';
    const html = `<div style="
        background:${bg};
        border:1px solid ${border};
        color:${color};
        padding:3px 10px;
        border-radius:20px;
        font-size:11px;
        font-weight:700;
        font-family:system-ui,sans-serif;
        white-space:nowrap;
        backdrop-filter:blur(8px);
        box-shadow:0 2px 8px rgba(0,0,0,0.25);
        pointer-events:none;
        transform:translateX(-50%);
    ">✈ ${km.toLocaleString('en-IN')} km</div>`;
    return L.divIcon({ html, className: '', iconSize: [0, 0] as any, iconAnchor: [0, 0] });
}

export interface MapBackgroundProps {
    origin?:             string;
    destination?:        string;
    stops?:              string[];
    /** Show crow-flies dotted line with km label */
    showDirectDistance?: boolean;
    /** Pre-computed curved arc paths for flight routes ([lat,lng][]) */
    flightPaths?:        [number, number][][];
    /** Pre-computed straight paths for train routes ([lat,lng][]) */
    trainPaths?:         [number, number][][];
}

export default function MapBackground({
    origin,
    destination,
    stops = [],
    showDirectDistance = false,
    flightPaths = [],
    trainPaths  = [],
}: MapBackgroundProps) {
    const containerRef   = useRef<HTMLDivElement>(null);
    const mapRef         = useRef<L.Map | null>(null);
    const tileRef        = useRef<L.TileLayer | null>(null);
    const layersRef      = useRef<L.Layer[]>([]);
    const routeLayersRef = useRef<L.Layer[]>([]);

    const { theme } = useTheme();

    // ── Initialise map once ─────────────────────────────────────────────────
    useEffect(() => {
        if (!containerRef.current || mapRef.current) return;

        mapRef.current = L.map(containerRef.current, {
            center: [22.5, 80.0],
            zoom: 5,
            zoomControl: false,
            attributionControl: false,
        });

        tileRef.current = L.tileLayer(
            theme === 'dark' ? TILES.dark : TILES.light,
            { subdomains: 'abcd', maxZoom: 19 }
        ).addTo(mapRef.current);

        return () => {
            mapRef.current?.remove();
            mapRef.current = null;
            tileRef.current = null;
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── Swap tile layer when theme changes ─────────────────────────────────
    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;
        if (tileRef.current) map.removeLayer(tileRef.current);
        tileRef.current = L.tileLayer(
            theme === 'dark' ? TILES.dark : TILES.light,
            { subdomains: 'abcd', maxZoom: 19 }
        ).addTo(map);
    }, [theme]);

    // ── Update markers, direct distance line & main route polyline ──────────
    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;

        layersRef.current.forEach(l => l.remove());
        layersRef.current = [];

        const allPositions: L.LatLngExpression[] = [];

        const originCoords      = origin      ? getCoordinates(origin)      : null;
        const destinationCoords = destination ? getCoordinates(destination) : null;
        const stopCoords = stops
            .map(s => getCoordinates(s))
            .filter(Boolean) as [number, number][];

        if (originCoords) {
            allPositions.push(originCoords);
            layersRef.current.push(
                L.marker(originCoords, { icon: originIcon }).addTo(map)
            );
        }

        stopCoords.forEach((coords, i) => {
            allPositions.push(coords);
            layersRef.current.push(
                L.marker(coords, { icon: stopIcon(i + 1) }).addTo(map)
            );
        });

        if (destinationCoords) {
            allPositions.push(destinationCoords);
            layersRef.current.push(
                L.marker(destinationCoords, { icon: destinationIcon }).addTo(map)
            );
        }

        // Main route polyline (through stops)
        if (allPositions.length >= 2) {
            layersRef.current.push(
                L.polyline(allPositions, {
                    color: '#3b82f6',
                    weight: 3,
                    opacity: 0.75,
                    dashArray: '8 6',
                }).addTo(map)
            );
        }

        // ── Direct distance dotted line & floating label ───────────────────
        if (showDirectDistance && originCoords && destinationCoords) {
            const km = haversineKm(originCoords, destinationCoords);
            const midLat = (originCoords[0] + destinationCoords[0]) / 2;
            const midLng = (originCoords[1] + destinationCoords[1]) / 2;

            layersRef.current.push(
                L.polyline([originCoords, destinationCoords], {
                    color: '#94a3b8',
                    weight: 1.5,
                    opacity: 0.6,
                    dashArray: '4 9',
                }).addTo(map)
            );

            const labelIcon = createDistanceLabel(km, theme);
            layersRef.current.push(
                L.marker([midLat, midLng], { icon: labelIcon, interactive: false }).addTo(map)
            );
        }

        // Fly to fit all markers
        if (allPositions.length === 1) {
            map.flyTo(allPositions[0] as L.LatLngExpression, 7, { duration: 1.2 });
        } else if (allPositions.length > 1) {
            const bounds = L.latLngBounds(allPositions as L.LatLngExpression[]);
            map.flyToBounds(bounds, { padding: [80, 80], duration: 1.4 });
        }
    }, [origin, destination, stops, showDirectDistance, theme]);

    // ── Transport route overlays (flights + trains) ────────────────────────
    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;

        routeLayersRef.current.forEach(l => l.remove());
        routeLayersRef.current = [];

        // Flight arcs – sky-blue curved, semi-transparent
        flightPaths.forEach(path => {
            if (path.length < 2) return;
            routeLayersRef.current.push(
                L.polyline(path as L.LatLngExpression[], {
                    color: '#38bdf8',
                    weight: 2.5,
                    opacity: 0.72,
                }).addTo(map)
            );
        });

        // Train routes – amber/orange straight lines
        trainPaths.forEach(path => {
            if (path.length < 2) return;
            routeLayersRef.current.push(
                L.polyline(path as L.LatLngExpression[], {
                    color: '#fb923c',
                    weight: 3,
                    opacity: 0.75,
                    dashArray: '10 4',
                }).addTo(map)
            );
        });
    }, [flightPaths, trainPaths]);

    return (
        <div
            ref={containerRef}
            className="absolute inset-0 z-0"
            style={{ background: theme === 'dark' ? '#1a1b2e' : '#dde2ea' }}
        />
    );
}
