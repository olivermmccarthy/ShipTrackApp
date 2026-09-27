import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getCoordinates } from '../data/cityCoordinates';

type ShipmentMapProps = {
  origin: string;
  destination: string;
  currentLocation: string;
};

function createMarkerIcon(color: string, size: number) {
  return L.divIcon({
    className: 'shipment-map-marker',
    html: `<span style="display:block;width:${size}px;height:${size}px;border-radius:50%;background:${color};border:2px solid #fff;box-shadow:0 0 4px rgba(0,0,0,0.35);"></span>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

export default function ShipmentMap({
  origin,
  destination,
  currentLocation,
}: ShipmentMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const originCoords = getCoordinates(origin);
    const destinationCoords = getCoordinates(destination);
    const currentCoords = getCoordinates(currentLocation);
    const points = [originCoords, destinationCoords, currentCoords].filter(
      (p): p is [number, number] => p !== null,
    );

    if (points.length === 0) return;

    const map = L.map(containerRef.current, { scrollWheelZoom: false });
    mapRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 18,
    }).addTo(map);

    if (originCoords) {
      L.marker(originCoords, { icon: createMarkerIcon('#888', 14) })
        .addTo(map)
        .bindPopup(`Origin: ${origin}`);
    }
    if (destinationCoords) {
      L.marker(destinationCoords, { icon: createMarkerIcon('#b7c2d6', 14) })
        .addTo(map)
        .bindPopup(`Destination: ${destination}`);
    }
    if (currentCoords) {
      L.marker(currentCoords, { icon: createMarkerIcon('#3c6e63', 18) })
        .addTo(map)
        .bindPopup(`Current location: ${currentLocation}`);
    }

    if (originCoords && destinationCoords) {
      L.polyline([originCoords, destinationCoords], {
        color: '#3c6e63',
        weight: 2,
        dashArray: '6 8',
        opacity: 0.6,
      }).addTo(map);
    }

    if (points.length === 1) {
      map.setView(points[0], 6);
    } else {
      map.fitBounds(L.latLngBounds(points), { padding: [30, 30] });
    }

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [origin, destination, currentLocation]);

  const hasAnyCoords =
    getCoordinates(origin) ||
    getCoordinates(destination) ||
    getCoordinates(currentLocation);

  if (!hasAnyCoords) {
    return (
      <p className="hint">
        Map view isn't available for this shipment's locations yet.
      </p>
    );
  }

  return <div ref={containerRef} className="shipment-map" />;
}
