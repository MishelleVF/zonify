import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function extractCoordinates(text: string): { lat: number; lng: number } | null {
  // Match patterns like "coordinates: 12.345, -67.890" or "lat: 12.345, lng: -67.890"
  const coordRegex =
    /(?:coordinates:|lat(?:itude)?:?)\s*([-+]?\d+\.\d+)[,\s]+(?:lng|lon|long(?:itude)?:?)?\s*([-+]?\d+\.\d+)/i
  const match = text.match(coordRegex)

  if (match && match.length >= 3) {
    const lat = Number.parseFloat(match[1])
    const lng = Number.parseFloat(match[2])

    if (!isNaN(lat) && !isNaN(lng)) {
      return { lat, lng }
    }
  }

  return null
}
