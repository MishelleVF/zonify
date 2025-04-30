"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Send, Loader2 } from "lucide-react"
import type { Message } from "ai/react"

interface ChatInterfaceProps {
  messages: Message[]
  input: string
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void
  isLoading: boolean
  placeholder?: string
}

export default function ChatInterface({
  messages,
  input,
  handleInputChange,
  handleSubmit,
  isLoading,
  placeholder = "Escribe un mensaje...",
}: ChatInterfaceProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [quickReplies, setQuickReplies] = useState<string[]>([
    "cafetería",
    "restaurante",
    "tienda de ropa",
    "gimnasio",
    "oficina",
  ])

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="p-4 bg-slate-800 text-white">
        <h1 className="text-2xl font-bold">Zonify</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <Card
            key={message.id}
            className={`p-4 max-w-[80%] ${
              message.role === "user" ? "ml-auto bg-primary text-primary-foreground" : "bg-blue-700 text-white"
            }`}
          >
            {message.content}
          </Card>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick replies - only show for first message */}
      {messages.length === 1 && (
        <div className="px-4 py-2 flex flex-wrap gap-2">
          {quickReplies.map((reply) => (
            <Button
              key={reply}
              variant="outline"
              className="rounded-full"
              onClick={() => {
                const form = document.querySelector("form")
                const input = form?.querySelector("input")
                if (input) {
                  input.value = reply
                  handleInputChange({ target: { value: reply } } as React.ChangeEvent<HTMLInputElement>)
                  form?.requestSubmit()
                }
              }}
            >
              {reply}
            </Button>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="p-4 border-t flex gap-2">
        <Input
          value={input}
          onChange={handleInputChange}
          placeholder={placeholder}
          className="flex-1"
          disabled={isLoading}
        />
        <Button type="submit" disabled={isLoading || !input.trim()}>
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </form>
    </div>
  )
}
