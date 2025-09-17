"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { useChat } from "ai/react"
import type { GPTConfig } from "@/lib/gpt-registry"

interface GPTExperienceProps {
  config: GPTConfig
  doorTitle: string
}

export function GPTExperience({ config, doorTitle }: GPTExperienceProps) {
  const [currentTries, setCurrentTries] = useState(0)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: "/api/gpt-chat",
    body: {
      gptId: config.id,
      systemPrompt: config.systemPrompt,
    },
    initialMessages: [
      {
        id: "starter",
        role: "assistant",
        content: config.starterMessage,
      },
    ],
  })

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const onSubmit = (e: React.FormEvent) => {
    if (currentTries >= config.maxTries) return
    setCurrentTries((prev) => prev + 1)
    handleSubmit(e)
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
        <form onSubmit={onSubmit} className="p-4 border-t bg-white">
          <div className="flex space-x-2">
            <input
              value={input}
              onChange={handleInputChange}
              placeholder={currentTries >= config.maxTries ? "Maximale Versuche erreicht" : "Deine Antwort..."}
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
