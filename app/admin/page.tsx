"use client"

import type React from "react"

import { useEffect, useState } from "react"
import type { CalendarDoor } from "@/types/calendar"
import { GPT_REGISTRY, type GPTConfig } from "@/lib/gpt-registry"

export default function AdminPage() {
  const [doors, setDoors] = useState<CalendarDoor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [rawData, setRawData] = useState<any>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState("")
  const [allStories, setAllStories] = useState<any[]>([])
  const [xmasDoorsChildren, setXmasDoorsChildren] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<"overview" | "gpts">("overview")
  const [gpts, setGpts] = useState<GPTConfig[]>([])
  const [editingGpt, setEditingGpt] = useState<GPTConfig | null>(null)
  const [showGptForm, setShowGptForm] = useState(false)

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault()
    // Simple password protection - in production use proper auth
    if (password === "admin123") {
      setIsAuthenticated(true)
    } else {
      alert("Falsches Passwort")
    }
  }

  useEffect(() => {
    if (!isAuthenticated) return

    setGpts(Object.values(GPT_REGISTRY))

    async function testStoryblokConnection() {
      try {
        console.log("[v0] Testing Storyblok connection...")

        const response = await fetch(`/api/storyblok-test`)
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || "API request failed")
        }

        setRawData(data)

        const stories = data.available_stories || []
        setAllStories(stories)

        const xmasDoorsChildrenData = data.xmas_doors_children || []
        setXmasDoorsChildren(xmasDoorsChildrenData)

        const doorsData = data.storyblok_response?.story?.content?.doors || []
        setDoors(doorsData)

        console.log("[v0] Storyblok connection successful", {
          doors: doorsData.length,
          stories: stories.length,
          xmasDoorsChildren: xmasDoorsChildrenData.length,
        })
      } catch (err) {
        console.error("[v0] Storyblok connection failed:", err)
        setError(err instanceof Error ? err.message : "Unknown error")
      } finally {
        setLoading(false)
      }
    }

    testStoryblokConnection()
  }, [isAuthenticated])

  const handleSaveGpt = (gptData: Partial<GPTConfig>) => {
    if (editingGpt) {
      // Update existing GPT
      const updatedGpts = gpts.map((g) => (g.id === editingGpt.id ? { ...editingGpt, ...gptData } : g))
      setGpts(updatedGpts)
      // Note: In a real app, this would save to a database
      console.log("GPT updated:", { ...editingGpt, ...gptData })
    } else {
      // Create new GPT
      const newGpt: GPTConfig = {
        id: gptData.id || `gpt-${Date.now()}`,
        systemPrompt: gptData.systemPrompt || "",
        starterMessage: gptData.starterMessage || "",
        maxTries: gptData.maxTries || 3,
        uiType: gptData.uiType || "chat",
        language: "de-CH",
        style: "du",
        ...gptData,
      }
      setGpts([...gpts, newGpt])
      console.log("GPT created:", newGpt)
    }
    setEditingGpt(null)
    setShowGptForm(false)
  }

  const handleDeleteGpt = (gptId: string) => {
    if (confirm("GPT wirklich löschen?")) {
      setGpts(gpts.filter((g) => g.id !== gptId))
      console.log("GPT deleted:", gptId)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#001327] text-white flex items-center justify-center">
        <div className="bg-black/40 backdrop-blur-sm p-8 rounded-lg max-w-md w-full mx-4 border border-white/20">
          <h1 className="text-2xl font-bold mb-6 text-white">Admin Access</h1>
          <form onSubmit={handleAuth}>
            <input
              type="password"
              placeholder="Passwort eingeben"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 rounded bg-black/30 border border-white/30 text-white placeholder-white/50 mb-4 focus:border-white/60 focus:outline-none"
            />
            <button
              type="submit"
              className="w-full bg-white text-[#001327] p-3 rounded font-semibold hover:bg-white/90 transition-colors"
            >
              Anmelden
            </button>
          </form>
          <p className="text-sm text-white/80 mt-4">Hint: admin123</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#001327] text-white p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Storyblok Admin Dashboard</h1>

        <div className="flex space-x-4 mb-8">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === "overview" ? "bg-white text-[#001327]" : "bg-white/20 text-white hover:bg-white/30"
            }`}
          >
            Übersicht
          </button>
          <button
            onClick={() => setActiveTab("gpts")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === "gpts" ? "bg-white text-[#001327]" : "bg-white/20 text-white hover:bg-white/30"
            }`}
          >
            GPT Verwaltung
          </button>
        </div>

        <div className="bg-white/10 p-6 rounded-lg mb-8">
          <h2 className="text-xl font-semibold mb-4">Verbindungsstatus</h2>
          {loading ? (
            <div className="text-yellow-400">🔄 Teste Storyblok-Verbindung...</div>
          ) : error ? (
            <div className="text-red-400">❌ Fehler: {error}</div>
          ) : (
            <div className="text-green-400">✅ Storyblok-Verbindung erfolgreich</div>
          )}
        </div>

        {activeTab === "overview" && !loading && !error && (
          <>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-white/10 p-6 rounded-lg">
                <h2 className="text-xl font-semibold mb-4">Kalender Übersicht</h2>
                <div className="space-y-2">
                  <p>
                    <strong>Anzahl Türchen:</strong> {doors.length}
                  </p>
                  <p>
                    <strong>Xmas-Doors Folder Seiten:</strong> {xmasDoorsChildren.length}
                  </p>
                  <p>
                    <strong>Tage verfügbar:</strong> {doors.map((d) => d.day).join(", ")}
                  </p>
                  <p>
                    <strong>Environment Token:</strong> {rawData?.token_configured ? "✅ Gesetzt" : "❌ Fehlt"}
                  </p>
                  <p>
                    <strong>API Status:</strong> {rawData?.success ? "✅ OK" : "❌ Fehler"}
                  </p>
                  {rawData?.space_info && (
                    <>
                      <p>
                        <strong>Space Name:</strong> {rawData.space_info.name}
                      </p>
                      <p>
                        <strong>Space ID:</strong> {rawData.space_info.id}
                      </p>
                    </>
                  )}
                </div>
              </div>

              <div className="bg-white/10 p-6 rounded-lg">
                <h2 className="text-xl font-semibold mb-4">Türchen Details</h2>
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {doors.length > 0 ? (
                    doors.map((door) => (
                      <div key={door.day} className="bg-white/5 p-3 rounded text-sm">
                        <strong>Tag {door.day}:</strong> {door.title}
                        {door.subtitle && <div className="text-white/70">{door.subtitle}</div>}
                      </div>
                    ))
                  ) : (
                    <div className="text-white/70">Keine Türchen gefunden</div>
                  )}
                </div>
              </div>
            </div>

            {!loading && !error && xmasDoorsChildren.length > 0 && (
              <div className="bg-white/10 p-6 rounded-lg mt-8">
                <h2 className="text-xl font-semibold mb-4">Xmas-Doors Folder Seiten ({xmasDoorsChildren.length})</h2>
                <div className="space-y-6">
                  {xmasDoorsChildren.map((story, index) => (
                    <div key={story.id || index} className="bg-white/5 p-6 rounded-lg">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="font-semibold text-lg mb-4 text-blue-300">{story.name || story.slug}</h3>
                          <p className="text-white/70 text-sm">
                            {story.id} • {story.full_slug} • {story.content_type}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleDeleteGpt(story.id)}
                            className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                          >
                            Löschen
                          </button>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <h4 className="font-medium text-white/90 mb-1">Starter Message:</h4>
                          <p className="text-white/70 text-sm bg-black/20 p-2 rounded">
                            {story.content?.starterMessage}
                          </p>
                        </div>

                        <div>
                          <h4 className="font-medium text-white/90 mb-1">System Prompt:</h4>
                          <p className="text-white/70 text-sm bg-black/20 p-2 rounded max-h-32 overflow-y-auto">
                            {story.content?.systemPrompt}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!loading && !error && xmasDoorsChildren.length === 0 && (
              <div className="bg-white/10 p-6 rounded-lg mt-8">
                <h2 className="text-xl font-semibold mb-4">Hinweis</h2>
                <p className="text-white/70">
                  Keine Stories im xmas-doors Folder gefunden. Bitte erstelle Stories im xmas-doors Folder in Storyblok.
                </p>
              </div>
            )}
          </>
        )}

        {activeTab === "gpts" && (
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold">GPT Verwaltung</h2>
              <button
                onClick={() => {
                  setEditingGpt(null)
                  setShowGptForm(true)
                }}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                + Neues GPT
              </button>
            </div>

            {/* GPT List */}
            <div className="grid gap-6">
              {gpts.map((gpt) => (
                <div key={gpt.id} className="bg-white/10 p-6 rounded-lg">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-white">{gpt.id}</h3>
                      <p className="text-white/70 text-sm">
                        {gpt.uiType} • Max {gpt.maxTries} Versuche • {gpt.language}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setEditingGpt(gpt)
                          setShowGptForm(true)
                        }}
                        className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                      >
                        Bearbeiten
                      </button>
                      <button
                        onClick={() => handleDeleteGpt(gpt.id)}
                        className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                      >
                        Löschen
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium text-white/90 mb-1">Starter Message:</h4>
                      <p className="text-white/70 text-sm bg-black/20 p-2 rounded">{gpt.starterMessage}</p>
                    </div>

                    <div>
                      <h4 className="font-medium text-white/90 mb-1">System Prompt:</h4>
                      <p className="text-white/70 text-sm bg-black/20 p-2 rounded max-h-32 overflow-y-auto">
                        {gpt.systemPrompt}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* GPT Form Modal */}
            {showGptForm && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">
                    {editingGpt ? "GPT bearbeiten" : "Neues GPT erstellen"}
                  </h3>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault()
                      const formData = new FormData(e.currentTarget)
                      handleSaveGpt({
                        id: formData.get("id") as string,
                        starterMessage: formData.get("starterMessage") as string,
                        systemPrompt: formData.get("systemPrompt") as string,
                        maxTries: Number.parseInt(formData.get("maxTries") as string),
                        uiType: formData.get("uiType") as "chat" | "quiz" | "game",
                      })
                    }}
                    className="space-y-4"
                  >
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">GPT ID</label>
                      <input
                        name="id"
                        type="text"
                        defaultValue={editingGpt?.id || ""}
                        disabled={!!editingGpt}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                        placeholder="z.B. xmas-smiley"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Starter Message</label>
                      <input
                        name="starterMessage"
                        type="text"
                        defaultValue={editingGpt?.starterMessage || ""}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Willkommen zum Weihnachts-Rätsel! 🎄"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">System Prompt</label>
                      <textarea
                        name="systemPrompt"
                        rows={8}
                        defaultValue={editingGpt?.systemPrompt || ""}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Du bist ein freundlicher Assistent..."
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Max Versuche</label>
                        <input
                          name="maxTries"
                          type="number"
                          min="1"
                          max="10"
                          defaultValue={editingGpt?.maxTries || 3}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">UI Typ</label>
                        <select
                          name="uiType"
                          defaultValue={editingGpt?.uiType || "chat"}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        >
                          <option value="chat">Chat</option>
                          <option value="quiz">Quiz</option>
                          <option value="game">Game</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex justify-end space-x-3 pt-4">
                      <button
                        type="button"
                        onClick={() => {
                          setShowGptForm(false)
                          setEditingGpt(null)
                        }}
                        className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        Abbrechen
                      </button>
                      <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                        {editingGpt ? "Aktualisieren" : "Erstellen"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="mt-8">
          <a
            href="/"
            className="inline-block bg-white text-[#001327] px-6 py-3 rounded font-semibold hover:bg-white/90"
          >
            ← Zurück zum Kalender
          </a>
        </div>
      </div>
    </div>
  )
}
