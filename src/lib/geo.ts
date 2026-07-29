// Haversine distance + point-in-radius zone checks. Used by the
// Resource Agent (nearest-unit selection), the Route & Logistics
// Agent, and the map/zone views.

import type { LatLng } from './types';

export function haversineKm(a: LatLng, b: LatLng): number {
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function toRad(d: number): number {
  return (d * Math.PI) / 180;
}

export function withinRadius(point: LatLng, center: LatLng, radiusM: number): boolean {
  return haversineKm(point, center) * 1000 <= radiusM;
}
