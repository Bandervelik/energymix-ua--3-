'use client';

import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Custom icon to avoid Next.js/Leaflet default icon issues
const customIcon = L.divIcon({
  className: 'custom-leaflet-icon',
  html: `<div style="background-color: #10B981; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 6px rgba(0,0,0,0.3); position: relative; top: -12px; left: -12px;"></div>`,
  iconSize: [0, 0],
  iconAnchor: [0, 0],
});

function LocationMarker({ 
  position, 
  setPosition 
}: { 
  position: [number, number], 
  setPosition: (pos: [number, number]) => void 
}) {
  const map = useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
      map.flyTo(e.latlng, map.getZoom());
    },
  });

  // Center map on initial load if position changes externally
  useEffect(() => {
    if (position) {
      map.flyTo(position, map.getZoom());
    }
  }, [position, map]);

  return position === null ? null : (
    <Marker 
      position={position} 
      icon={customIcon} 
      draggable={true} 
      eventHandlers={{
        dragend: (e) => {
          const marker = e.target;
          const pos = marker.getLatLng();
          setPosition([pos.lat, pos.lng]);
        }
      }} 
    />
  );
}

export default function MapPicker({ 
  coordinates, 
  setCoordinates 
}: { 
  coordinates: [number, number], 
  setCoordinates: (c: [number, number]) => void 
}) {
  return (
    <MapContainer 
      center={coordinates} 
      zoom={6} 
      scrollWheelZoom={true} 
      style={{ height: '100%', width: '100%', zIndex: 10 }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
      />
      <LocationMarker position={coordinates} setPosition={setCoordinates} />
    </MapContainer>
  );
}
