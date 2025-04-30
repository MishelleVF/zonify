"use client"

import { useState, useEffect } from "react"
import dynamic from "next/dynamic"
import ChatInterface from "@/components/chat-interface"
import { useChat } from "@ai-sdk/react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

// Dynamically import the Map component to avoid SSR issues with Leaflet
const MapWithNoSSR = dynamic(() => import("@/components/map"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full w-full">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <span className="ml-2">Loading map...</span>
    </div>
  ),
})

export default function Home() {
  const [selectedLocation, setSelectedLocation] = useState<{
    lat: number
    lng: number
  } | null>(null)
  const [userLocation, setUserLocation] = useState<{
    lat: number
    lng: number
  } | null>(null)
  const [businessType, setBusinessType] = useState<string>("")
  const [showRecommendButton, setShowRecommendButton] = useState<boolean>(false)

  const { messages, input, handleInputChange, handleSubmit, isLoading, append } = useChat({
    api: "/api/chat",
    initialMessages: [
      {
        id: "1",
        role: "assistant",
        content:
          "Hola, soy Eva de Zonify, tu asistente para encontrar y analizar el mejor lugar para posicionar el local de tu negocio ¿Qué tipo de negocio tienes?",
      },
    ],
  })

  // Get user's location on component mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          })
        },
        (error) => {
          console.error("Error getting location:", error)
          // Default to a fallback location if geolocation fails
          setUserLocation({ lat: -12.123166, lng: -77.034845 })
        },
      )
    } else {
      // Fallback for browsers that don't support geolocation
      setUserLocation({ lat: -12.123166, lng: -77.034845 })
    }
  }, [])

  // Update business type when user submits a message
  useEffect(() => {
    const userMessages = messages.filter((msg) => msg.role === "user")
    if (userMessages.length > 0) {
      const lastUserMessage = userMessages[userMessages.length - 1].content
      setBusinessType(lastUserMessage)

      // Show recommendation button if we also have a location
      if (selectedLocation) {
        setShowRecommendButton(true)
      }
    }
  }, [messages])

  // Update recommendation button visibility when location is selected
  useEffect(() => {
    if (selectedLocation && businessType) {
      setShowRecommendButton(true)
    }
  }, [selectedLocation, businessType])

  // Function to request recommendations
  const requestRecommendations = () => {
    if (!selectedLocation || !businessType) return

    const locationMessage = `Quiero recibir recomendaciones para mi ${businessType} en las coordenadas: ${selectedLocation.lat.toFixed(6)}, ${selectedLocation.lng.toFixed(6)}.`

    append({
      role: "user",
      content: locationMessage,
    })

    setShowRecommendButton(false)
  }

  return (
    <main className="flex flex-col md:flex-row h-screen w-full">
      <div className="w-full md:w-1/3 h-1/2 md:h-screen overflow-hidden flex flex-col">
        <ChatInterface
          messages={messages}
          input={input}
          handleInputChange={handleInputChange}
          handleSubmit={handleSubmit}
          isLoading={isLoading}
          placeholder="Escribe tu tipo de negocio"
        />

        {/* Recommendation Button */}
        {showRecommendButton && (
          <div className="p-4 border-t bg-white">
            <Button
              onClick={requestRecommendations}
              className="w-full bg-blue-700 hover:bg-blue-800"
              disabled={isLoading}
            >
              Recibir recomendaciones
            </Button>
          </div>
        )}
      </div>

      <div className="w-full md:w-2/3 h-1/2 md:h-screen relative">
        {userLocation && (
          <>
            <MapWithNoSSR
              userLocation={userLocation}
              selectedLocation={selectedLocation}
              setSelectedLocation={setSelectedLocation}
            />

            {/* Location selection indicator */}
            {selectedLocation && (
              <div className="absolute top-4 right-4 bg-white p-3 rounded-md shadow-md z-[1000] max-w-xs">
                <p className="font-medium text-sm">Ubicación seleccionada:</p>
                <p className="text-xs text-gray-600">
                  {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  )
}
