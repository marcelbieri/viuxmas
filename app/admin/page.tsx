"use client"

import type React from "react"

import { useEffect, useState } from "react"
import type { CalendarDoor } from "@/types/calendar"

export default function AdminPage() {
  const [doors, setDoors] = useState<CalendarDoor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [rawData, setRawData] = useState<any>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState("")
  const [allStories, setAllStories] = useState<any[]>([])
  const [xmasDoorsChildren, setXmasDoorsChildren] = useState<any[]>([])

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

        {!loading && !error && (
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
        )}

        {!loading && !error && xmasDoorsChildren.length > 0 && (
          <div className="bg-white/10 p-6 rounded-lg mt-8">
            <h2 className="text-xl font-semibold mb-4">Xmas-Doors Folder Seiten ({xmasDoorsChildren.length})</h2>
            <div className="space-y-6">
              {xmasDoorsChildren.map((story, index) => (
                <div key={story.id || index} className="bg-white/5 p-6 rounded-lg">
                  <h3 className="font-semibold text-lg mb-4 text-blue-300">{story.name || story.slug}</h3>

                  <div className="grid md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <h4 className="font-medium text-white/90 mb-2">Story Metadaten</h4>
                      <div className="text-sm text-white/70 space-y-1">
                        <p>
                          <strong>ID:</strong> {story.id}
                        </p>
                        <p>
                          <strong>Slug:</strong> {story.slug}
                        </p>
                        <p>
                          <strong>Full Slug:</strong> {story.full_slug}
                        </p>
                        <p>
                          <strong>Published:</strong> {story.is_published ? "✅ Ja" : "❌ Nein"}
                        </p>
                        <p>
                          <strong>Content Type:</strong> {story.content_type}
                        </p>
                        {story.published_at && (
                          <p>
                            <strong>Published At:</strong> {new Date(story.published_at).toLocaleDateString("de-DE")}
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-white/90 mb-2">Content Felder</h4>
                      {story.content ? (
                        <div className="text-sm text-white/70 space-y-2">
                          <p>
                            <strong>Component:</strong> {story.content.component || "N/A"}
                          </p>
                          {Object.entries(story.content).map(([key, value]) => {
                            if (key === "component" || key === "_uid") return null

                            // Handle arrays (like body, page_meta)
                            if (Array.isArray(value)) {
                              return (
                                <div key={key} className="border-l-2 border-white/20 pl-3">
                                  <p>
                                    <strong>{key}:</strong> Array ({value.length} items)
                                  </p>
                                  {value.slice(0, 3).map((item, index) => (
                                    <div key={index} className="ml-4 mt-1 text-xs">
                                      <strong>Item {index + 1}:</strong>
                                      {typeof item === "object" && item !== null ? (
                                        <div className="ml-2">
                                          {Object.entries(item).map(([subKey, subValue]) => (
                                            <p key={subKey} className="text-white/60">
                                              {subKey}:{" "}
                                              {typeof subValue === "string"
                                                ? subValue.length > 30
                                                  ? `${subValue.substring(0, 30)}...`
                                                  : subValue
                                                : typeof subValue === "object"
                                                  ? `[${Array.isArray(subValue) ? "Array" : "Object"}]`
                                                  : String(subValue)}
                                            </p>
                                          ))}
                                        </div>
                                      ) : (
                                        <span className="text-white/60"> {String(item)}</span>
                                      )}
                                    </div>
                                  ))}
                                  {value.length > 3 && (
                                    <p className="ml-4 text-xs text-white/50">... und {value.length - 3} weitere</p>
                                  )}
                                </div>
                              )
                            }

                            // Handle objects
                            if (typeof value === "object" && value !== null) {
                              return (
                                <div key={key} className="border-l-2 border-white/20 pl-3">
                                  <p>
                                    <strong>{key}:</strong> Object
                                  </p>
                                  <div className="ml-4 text-xs">
                                    {Object.entries(value)
                                      .slice(0, 5)
                                      .map(([subKey, subValue]) => (
                                        <p key={subKey} className="text-white/60">
                                          {subKey}:{" "}
                                          {typeof subValue === "string"
                                            ? subValue.length > 30
                                              ? `${subValue.substring(0, 30)}...`
                                              : subValue
                                            : typeof subValue === "object"
                                              ? `[${Array.isArray(subValue) ? "Array" : "Object"}]`
                                              : String(subValue)}
                                        </p>
                                      ))}
                                    {Object.keys(value).length > 5 && (
                                      <p className="text-white/50">
                                        ... und {Object.keys(value).length - 5} weitere Felder
                                      </p>
                                    )}
                                  </div>
                                </div>
                              )
                            }

                            // Handle simple values
                            return (
                              <p key={key}>
                                <strong>{key}:</strong>{" "}
                                {typeof value === "string"
                                  ? value.length > 50
                                    ? `${value.substring(0, 50)}...`
                                    : value
                                  : String(value)}
                              </p>
                            )
                          })}

                          {(story.content.body || story.content.page_meta) && (
                            <div className="mt-4 p-3 bg-blue-500/20 rounded border border-blue-400/30">
                              <h5 className="font-medium text-blue-200 mb-2">Wichtige Content-Felder:</h5>
                              <div className="text-xs space-y-1">
                                {/* Extract title-like fields from body array */}
                                {story.content.body &&
                                  Array.isArray(story.content.body) &&
                                  story.content.body.map((block, index) => {
                                    if (block.component === "title" || block.component === "headline") {
                                      return (
                                        <p key={`body-${index}`} className="text-green-300">
                                          <strong>Body Title {index + 1}:</strong> {block.title || block.text || "N/A"}
                                        </p>
                                      )
                                    }
                                    if (block.title || block.headline || block.text) {
                                      return (
                                        <p key={`body-${index}`} className="text-yellow-300">
                                          <strong>
                                            {block.component || "Block"} {index + 1}:
                                          </strong>{" "}
                                          {block.title || block.headline || block.text}
                                        </p>
                                      )
                                    }
                                    return null
                                  })}

                                {/* Extract fields from page_meta */}
                                {story.content.page_meta &&
                                  Array.isArray(story.content.page_meta) &&
                                  story.content.page_meta.map((meta, index) => (
                                    <div key={`meta-${index}`}>
                                      {meta.title && (
                                        <p className="text-green-300">
                                          <strong>Page Title:</strong> {meta.title}
                                        </p>
                                      )}
                                      {meta.description && (
                                        <p className="text-blue-300">
                                          <strong>Page Description:</strong> {meta.description}
                                        </p>
                                      )}
                                    </div>
                                  ))}

                                {/* Direct content fields */}
                                {story.content.title && (
                                  <p className="text-green-300">
                                    <strong>Direct Title:</strong> {story.content.title}
                                  </p>
                                )}
                                {story.content.subtitle && (
                                  <p className="text-blue-300">
                                    <strong>Direct Subtitle:</strong> {story.content.subtitle}
                                  </p>
                                )}
                                {story.content.pre_title && (
                                  <p className="text-purple-300">
                                    <strong>Direct Pre Title:</strong> {story.content.pre_title}
                                  </p>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-white/50">Keine Content-Daten verfügbar</p>
                      )}
                    </div>

                    <div className="mt-6">
                      <h4 className="font-medium text-white/90 mb-2">Kompletter Body Content (Raw JSON)</h4>
                      <div className="bg-black/30 p-4 rounded-lg max-h-96 overflow-y-auto">
                        <pre className="text-xs text-green-300 whitespace-pre-wrap break-words">
                          {JSON.stringify(story.content, null, 2)}
                        </pre>
                      </div>
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
