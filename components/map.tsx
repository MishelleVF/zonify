"use client"

import { useEffect, useState } from "react"
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, Circle } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

// Fix Leaflet icon issues
const fixLeafletIcon = () => {
  delete (L.Icon.Default.prototype as any)._getIconUrl
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
  })
}

// Custom marker icons
const userIcon = new L.Icon({
  iconUrl: "https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

const selectedIcon = new L.Icon({
  iconUrl: "https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

interface MapProps {
  userLocation: { lat: number; lng: number }
  selectedLocation: { lat: number; lng: number } | null
  setSelectedLocation: (location: { lat: number; lng: number }) => void
}

// Component to handle map clicks
function LocationMarker({
  setSelectedLocation,
}: { setSelectedLocation: (location: { lat: number; lng: number }) => void }) {
  const map = useMapEvents({
    click(e) {
      setSelectedLocation(e.latlng)
      map.flyTo(e.latlng, map.getZoom())
    },
  })
  return null
}

// Heat map layer component using Circle markers
function HeatmapLayer({ points }: { points: number[][] }) {
  return (
    <>
      {points.map((point, index) => {
        const [lat, lng, intensity] = point
        // Scale the intensity (0-1) to a radius (20-100)
        const radius = 20 + intensity * 80
        // Scale the intensity to opacity (0.1-0.6)
        const opacity = 0.1 + intensity * 0.5

        return (
          <Circle
            key={`heat-${index}`}
            center={[lat, lng]}
            radius={radius}
            pathOptions={{
              fillColor: "red",
              fillOpacity: opacity,
              stroke: false,
            }}
          />
        )
      })}
    </>
  )
}

export default function Map({ userLocation, selectedLocation, setSelectedLocation }: MapProps) {
  const [heatmapData, setHeatmapData] = useState<number[][]>([])

  // Fix Leaflet icon issues on component mount
  useEffect(() => {
    fixLeafletIcon()
  }, [])

  // Generate heatmap data when location changes
  useEffect(() => {
    if (selectedLocation) {
      const points: number[][] = []
      const centerLat = selectedLocation.lat
      const centerLng = selectedLocation.lng

      // Generate points with varying intensity
      for (let i = 0; i < 50; i++) {
        const lat = centerLat + (Math.random() - 0.5) * 0.01
        const lng = centerLng + (Math.random() - 0.5) * 0.01
        const intensity = Math.random()
        points.push([lat, lng, intensity])
      }

      setHeatmapData(points)
    }
  }, [selectedLocation])

  return (
    <MapContainer center={[userLocation.lat, userLocation.lng]} zoom={15} style={{ height: "100%", width: "100%" }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* User's current location */}
      <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
        <Popup>
          Tu ubicación actual
          <br />
          {userLocation.lat.toFixed(6)}, {userLocation.lng.toFixed(6)}
        </Popup>
      </Marker>

      {/* Selected location */}
      {selectedLocation && (
        <Marker position={[selectedLocation.lat, selectedLocation.lng]} icon={selectedIcon}>
          <Popup>
            Ubicación seleccionada
            <br />
            {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
          </Popup>
        </Marker>
      )}

      {/* Heatmap layer - only show when location is selected */}
      {selectedLocation && <HeatmapLayer points={heatmapData} />}

      {/* Circle around selected location */}
      {selectedLocation && (
        <Circle
          center={[selectedLocation.lat, selectedLocation.lng]}
          radius={500}
          pathOptions={{ fillColor: "blue", fillOpacity: 0.1, color: "blue" }}
        />
      )}

      {/* Component to handle map clicks */}
      <LocationMarker setSelectedLocation={setSelectedLocation} />
    </MapContainer>
  )
}
