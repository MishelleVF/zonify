import { streamText } from "ai"
import { openai } from "@ai-sdk/openai"
import { tool } from "ai"
import { z } from "zod"

// Allow streaming responses up to 30 seconds
export const maxDuration = 30

// Extract coordinates from a message
function extractCoordinates(message: string) {
  const regex = /coordenadas:\s*([-+]?\d+\.\d+),\s*([-+]?\d+\.\d+)/i
  const match = message.match(regex)

  if (match && match.length >= 3) {
    return {
      latitude: Number.parseFloat(match[1]),
      longitude: Number.parseFloat(match[2]),
    }
  }

  return null
}

// Extract business type from a message
function extractBusinessType(message: string) {
  // If the message contains coordinates, extract the business type before them
  if (message.includes("coordenadas:")) {
    const parts = message.split("para mi ")
    if (parts.length >= 2) {
      const businessPart = parts[1].split(" en las coordenadas")[0]
      return businessPart.trim()
    }
  }

  // Otherwise, the whole message is the business type
  return message.trim()
}

// Mock database of location data
const locationDatabase = {
  getLocationInfo: (lat: number, lng: number) => {
    // In a real app, this would query a database or external API
    return {
      population: Math.floor(Math.random() * 50000) + 10000,
      footTraffic: Math.floor(Math.random() * 5000) + 1000,
      nearbyBusinesses: Math.floor(Math.random() * 20) + 5,
      averageIncome: Math.floor(Math.random() * 50000) + 30000,
      competitorCount: Math.floor(Math.random() * 10),
    }
  },

  getBusinessRecommendation: (businessType: string, locationInfo: any) => {
    // In a real app, this would use actual algorithms to determine suitability
    const suitabilityScore = Math.random() * 100

    let recommendation = ""
    if (suitabilityScore > 80) {
      recommendation = "Excelente ubicación para tu negocio"
    } else if (suitabilityScore > 60) {
      recommendation = "Buena ubicación para tu negocio"
    } else if (suitabilityScore > 40) {
      recommendation = "Ubicación aceptable para tu negocio"
    } else {
      recommendation = "No recomendamos esta ubicación para tu negocio"
    }

    return {
      score: suitabilityScore.toFixed(2),
      recommendation,
      details: {
        competitionLevel: locationInfo.competitorCount < 3 ? "Baja" : "Alta",
        footTrafficRating: locationInfo.footTraffic > 3000 ? "Alto" : "Moderado",
        demographicMatch: Math.random() > 0.5 ? "Favorable" : "Mixto",
      },
    }
  },
}

export async function POST(req: Request) {
  const { messages } = await req.json()

  // Find the last user message that contains coordinates
  let coordinates = null
  let businessType = ""

  for (let i = messages.length - 1; i >= 0; i--) {
    const message = messages[i]
    if (message.role === "user") {
      // Try to extract coordinates from this message
      const extractedCoords = extractCoordinates(message.content)
      if (extractedCoords) {
        coordinates = extractedCoords
        businessType = extractBusinessType(message.content)
        break
      }

      // If no coordinates found but we don't have a business type yet, use this message
      if (!businessType) {
        businessType = message.content
      }
    }
  }

  const result = streamText({
    model: openai("gpt-4o"),
    system: `Eres Eva, una asistente virtual especializada en geomarketing y análisis de ubicaciones para negocios.
    Tu objetivo es ayudar a los usuarios a encontrar la mejor ubicación para su negocio basándote en datos geográficos y demográficos.
    Responde siempre en español de manera profesional pero amigable. Usa emojis ocasionalmente para dar un toque personal.
    Cuando analices una ubicación, menciona factores como tráfico peatonal, demografía, competencia y accesibilidad.
    Proporciona recomendaciones específicas basadas en el tipo de negocio del usuario.
    
    Si el usuario solo menciona un tipo de negocio sin coordenadas, pregúntale que seleccione una ubicación en el mapa y presione el botón "Recibir recomendaciones".
    
    Si el usuario proporciona coordenadas, usa las herramientas para analizar la ubicación y dar recomendaciones detalladas.`,
    messages,
    tools: {
      analyzeLocation: tool({
        description: "Analiza una ubicación para determinar su idoneidad para un tipo de negocio",
        parameters: z.object({
          latitude: z.number().describe("Latitud de la ubicación"),
          longitude: z.number().describe("Longitud de la ubicación"),
          businessType: z.string().describe("Tipo de negocio que el usuario quiere establecer"),
        }),
        execute: async ({ latitude, longitude, businessType }) => {
          // Get location data
          const locationInfo = locationDatabase.getLocationInfo(latitude, longitude)

          // Get business recommendation
          const recommendation = locationDatabase.getBusinessRecommendation(businessType, locationInfo)

          return {
            locationInfo,
            recommendation,
            businessType,
          }
        },
      }),
      getNearbyPOIs: tool({
        description: "Obtiene puntos de interés cercanos a una ubicación",
        parameters: z.object({
          latitude: z.number().describe("Latitud de la ubicación"),
          longitude: z.number().describe("Longitud de la ubicación"),
          radius: z.number().optional().describe("Radio de búsqueda en metros"),
        }),
        execute: async ({ latitude, longitude, radius = 500 }) => {
          // In a real app, this would call an external API like Google Places
          const poiTypes = ["restaurant", "cafe", "store", "bank", "school", "park", "gym"]
          const pois = []

          // Generate 5-10 random POIs
          const count = Math.floor(Math.random() * 6) + 5
          for (let i = 0; i < count; i++) {
            const type = poiTypes[Math.floor(Math.random() * poiTypes.length)]
            const distance = Math.floor(Math.random() * radius)
            const name = `${type.charAt(0).toUpperCase() + type.slice(1)} ${i + 1}`

            pois.push({
              name,
              type,
              distance,
            })
          }

          return pois
        },
      }),
    },
    maxSteps: 5,
  })

  return result.toDataStreamResponse()
}
