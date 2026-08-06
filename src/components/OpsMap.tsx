'use client';
import { useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';
import type { OpState } from '@/lib/client/store';

interface Filters {
  incidents: boolean;
  resources: boolean;
  facilities: boolean;
  zones: boolean;
  roads: boolean;
}

const SEV: Record<string, string> = { CRITICAL: '#F0475A', HIGH: '#FB8A3C', MODERATE: '#F5C147', LOW: '#3DD68C' };

// Minimal inline SVG glyphs (stroke-based, consistent weight)
const GLYPH: Record<string, string> = {
  FIRE: '<path d="M12 3c1 3 4 4 4 8a4 4 0 1 1-8 0c0-2 1-3 2-4 0 1 1 2 2 2 0-2-1-4 0-6z"/>',
  FLOOD: '<path d="M3 8c2-1 3 1 5 0s3-1 5 0 3 1 5 0M3 13c2-1 3 1 5 0s3-1 5 0 3 1 5 0M3 18c2-1 3 1 5 0s3-1 5 0 3 1 5 0"/>',
  COLLISION: '<path d="M5 15h14l-1-4a3 3 0 0 0-3-2H9a3 3 0 0 0-3 2z"/><circle cx="8" cy="16" r="1.4"/><circle cx="16" cy="16" r="1.4"/>',
  MEDICAL: '<path d="M12 5v14M5 12h14"/>',
  DEFAULT: '<path d="M12 4l9 16H3z"/><path d="M12 10v4M12 17h.01"/>',
  H: '<path d="M7 5v14M17 5v14M7 12h10"/>',
  S: '<path d="M4 11l8-6 8 6v8H4z"/>',
  R: '<path d="M12 4c3 3 5 5 5 9a5 5 0 1 1-10 0c0-4 2-6 5-9z"/>',
  T: '<path d="M6 6h12M12 6v12"/>',
};

export function OpsMap({
  state, filters, focus, height = '100%', onSelectIncident,
}: {
  state: OpState; filters: Filters; focus?: { lat: number; lng: number } | null;
  height?: string; onSelectIncident?: (id: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const layerRef = useRef<any>(null);
  const LRef = useRef<any>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = (await import('leaflet')).default;
      if (cancelled || !ref.current || mapRef.current) return;
      LRef.current = L;
      const center = state.facilities[0] ? [state.facilities[0].lat, state.facilities[0].lng] : [12.9756, 77.6016];
      const map = L.map(ref.current, { zoomControl: false, attributionControl: true }).setView(center as any, 14);
      L.control.zoom({ position: 'bottomright' }).addTo(map);
      const tileUrl = process.env.NEXT_PUBLIC_MAP_TILE_URL || 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
      L.tileLayer(tileUrl, { maxZoom: 19, className: 'map-tiles', attribution: '&copy; OpenStreetMap' }).addTo(map);
      mapRef.current = map;
      layerRef.current = L.layerGroup().addTo(map);
      draw();
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { draw(); /* eslint-disable-next-line */ }, [state, filters]);
  useEffect(() => { if (focus && mapRef.current) mapRef.current.setView([focus.lat, focus.lng], 15, { animate: true }); }, [focus]);

  function draw() {
    const L = LRef.current, map = mapRef.current, group = layerRef.current;
    if (!L || !map || !group) return;
    group.clearLayers();

    if (filters.zones) {
      const zoneColor: Record<string, string> = { EVACUATION: '#FB8A3C', HAZARDOUS: '#F0475A', RESTRICTED: '#a855f7', RELIEF: '#3DD68C', STAGING: '#a3e635' };
      for (const z of state.zones) {
        L.circle([z.centerLat, z.centerLng], { radius: z.radiusM, color: zoneColor[z.type] || '#64748b', weight: 1.25, fillOpacity: 0.06, dashArray: '4,6' })
          .bindPopup(`<b>${z.name}</b><br/>${z.type} zone<br/>${z.note}`).addTo(group);
      }
    }
    if (filters.roads) {
      const roadColor: Record<string, string> = { OPEN: '#3DD68C', CONGESTED: '#F5C147', BLOCKED: '#F0475A' };
      for (const r of state.roads) {
        L.polyline(r.points.map((p: any) => [p.lat, p.lng]), { color: roadColor[r.status], weight: r.status === 'BLOCKED' ? 5 : 3, opacity: 0.85, dashArray: r.status === 'BLOCKED' ? '2,9' : undefined })
          .bindPopup(`<b>${r.name}</b><br/>Status: ${r.status}<br/>${r.note}`).addTo(group);
      }
    }
    if (filters.facilities) {
      const g: Record<string, string> = { HOSPITAL: 'H', SHELTER: 'S', RELIEF_CENTER: 'R', STAGING: 'T' };
      for (const f of state.facilities) {
        L.marker([f.lat, f.lng], { icon: squareIcon(L, g[f.kind] || 'T', '#a3e635') })
          .bindPopup(`<b>${f.name}</b><br/>${f.kind.replace('_', ' ')}<br/>Capacity: ${f.capacity}`).addTo(group);
      }
    }
    if (filters.resources) {
      for (const r of state.resources) {
        const color = r.status === 'AVAILABLE' ? '#3DD68C' : r.status === 'DEPLOYED' ? '#a3e635' : '#5E6B7E';
        L.circleMarker([r.lat, r.lng], { radius: 4.5, color: '#0a0f16', fillColor: color, fillOpacity: 1, weight: 1.5 })
          .bindPopup(`<b>${r.label}</b><br/>${r.type.replace(/_/g, ' ')}<br/>Status: ${r.status}`).addTo(group);
      }
    }
    if (filters.incidents) {
      for (const i of state.incidents) {
        if (['RESOLVED', 'ARCHIVED'].includes(i.status)) continue;
        const color = SEV[i.severity] || '#3DD68C';
        if (i.severity === 'CRITICAL') L.circle([i.lat, i.lng], { radius: 300, color, weight: 1, fillOpacity: 0.05 }).addTo(group);
        const marker = L.marker([i.lat, i.lng], { icon: pinIcon(L, i.type, color, i.severity === 'CRITICAL'), zIndexOffset: i.severity === 'CRITICAL' ? 1000 : 0 })
          .bindPopup(`<b>${i.title}</b><br/>${i.id} · ${i.severity}<br/>${i.status} @ ${i.locationName}`);
        if (onSelectIncident) marker.on('click', () => onSelectIncident(i.id));
        marker.addTo(group);
      }
    }
  }

  return <div ref={ref} style={{ height, width: '100%' }} />;
}

function glyphSvg(type: string, size = 13) {
  const g = GLYPH[type] || GLYPH.DEFAULT;
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${g}</svg>`;
}

function pinIcon(L: any, type: string, color: string, pulse = false) {
  return L.divIcon({
    className: '',
    html: `<div style="position:relative;display:flex;align-items:center;justify-content:center;width:30px;height:30px;">
      ${pulse ? `<span style="position:absolute;inset:0;border-radius:50%;box-shadow:0 0 0 2px ${color}66;animation:pulseRing 2s infinite;"></span>` : ''}
      <div style="display:flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:${color};border:2px solid rgba(255,255,255,0.9);box-shadow:0 3px 10px rgba(0,0,0,0.55);">
        <span style="transform:rotate(45deg);color:#0a0f16;display:flex;">${glyphSvg(type)}</span>
      </div></div>`,
    iconSize: [30, 30], iconAnchor: [15, 26], popupAnchor: [0, -24],
  });
}

function squareIcon(L: any, glyph: string, color: string) {
  return L.divIcon({
    className: '',
    html: `<div style="display:flex;align-items:center;justify-content:center;width:20px;height:20px;border-radius:5px;background:rgba(21,27,38,0.92);border:1px solid ${color};color:${color};box-shadow:0 2px 6px rgba(0,0,0,0.5);">${glyphSvg(glyph, 11)}</div>`,
    iconSize: [20, 20], iconAnchor: [10, 10], popupAnchor: [0, -10],
  });
}
