"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import type { GPTConfig } from "@/lib/gpt-registry"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
}

interface GPTExperienceProps {
  config: GPTConfig
  doorTitle: string
}

export function GPTExperience({ config, doorTitle }: GPTExperienceProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "starter",
      role: "assistant",
      content: config.starterMessage,
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [currentTries, setCurrentTries] = useState(0)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading || currentTries >= config.maxTries) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)
    setCurrentTries((prev) => prev + 1)

    try {
      const response = await fetch("/api/gpt-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({ role: m.role, content: m.content })),
          gptId: config.id,
          systemPrompt: config.systemPrompt,
        }),
      })

      if (!response.ok) throw new Error("API request failed")

      const reader = response.body?.getReader()
      if (!reader) throw new Error("No response body")

      let assistantContent = ""
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "",
      }

      setMessages((prev) => [...prev, assistantMessage])

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = new TextDecoder().decode(value)
        const lines = chunk.split("\n")

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6)
            if (data === "[DONE]") break

            try {
              const parsed = JSON.parse(data)
              if (parsed.content) {
                assistantContent += parsed.content
                setMessages((prev) =>
                  prev.map((m) => (m.id === assistantMessage.id ? { ...m, content: assistantContent } : m)),
                )
              }
            } catch (e) {
              // Ignore parsing errors
            }
          }
        }
      }
    } catch (error) {
      console.error("Chat error:", error)
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "Entschuldigung, es gab einen Fehler. Bitte versuche es erneut.",
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Chat Header */}
        <div className="bg-gradient-to-r from-red-500 to-green-600 text-white p-4">
          <h2 className="text-xl font-bold text-center">{doorTitle}</h2>
          <p className="text-sm text-center opacity-90 mt-1">
            Versuche: {currentTries}/{config.maxTries}
          </p>
        </div>

        {/* Messages */}
        <div className="h-96 overflow-y-auto p-4 space-y-4 bg-gray-50">
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.role === "user" ? "bg-blue-500 text-white" : "bg-white text-gray-800 shadow-sm border"
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white text-gray-800 shadow-sm border px-4 py-2 rounded-lg">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="p-4 border-t bg-white">
          <div className="flex space-x-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                currentTries >= config.maxTries
                  ? "Maximale Versuche erreicht"
                  : "Deine Antwort... (Keine persönlichen Daten eingeben)"
              }
              disabled={isLoading || currentTries >= config.maxTries}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim() || currentTries >= config.maxTries}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? "..." : "Senden"}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center">⚠️ Keine persönlichen Daten eingeben</p>
          {currentTries >= config.maxTries && (
            <p className="text-sm text-red-600 mt-2 text-center">
              Du hast alle Versuche aufgebraucht. Das GPT wird dir die Lösung verraten! 🎄
            </p>
          )}
        </form>
      </div>
    </div>
  )
}
