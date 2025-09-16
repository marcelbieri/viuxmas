"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import type { CalendarDoor } from "@/types/calendar"
import ViuLogo from "./ViuLogo"

interface DoorModalProps {
  door: CalendarDoor
  onClose: () => void
}

interface DoorStory {
  name: string
  slug: string
  full_slug: string
  content: any
}

interface DoorResponse {
  success: boolean
  story: DoorStory | null
  error?: string
}

export function DoorModal({ door, onClose }: DoorModalProps) {
  const router = useRouter()
  const [story, setStory] = useState<DoorStory | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    const fetchDoorStory = async () => {
      try {
        const slug = door.slug || `tuerchen-${door.day}`

        const response = await fetch(`/api/doors/${slug}`)
        const data: DoorResponse = await response.json()

        if (data.success && data.story) {
          setStory(data.story)
          window.history.pushState({}, "", `/doors/${slug}`)
        } else {
          setError(data.error || "Türchen nicht gefunden")
        }
      } catch (err) {
        setError("Fehler beim Laden des Türchens")
      } finally {
        setLoading(false)
      }
    }

    fetchDoorStory()

    setTimeout(() => setIsAnimating(true), 50)
  }, [door])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose()
      }
    }

    const handleBodyScroll = () => {
      document.body.style.overflow = "hidden"
    }

    document.addEventListener("keydown", handleEscape)
    handleBodyScroll()

    return () => {
      document.removeEventListener("keydown", handleEscape)
      document.body.style.overflow = "unset"
    }
  }, [])

  const handleClose = () => {
    setIsAnimating(false)
    setTimeout(() => {
      router.push("/")
      onClose()
    }, 200)
  }

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose()
    }
  }

  const getTitle = () => {
    if (story?.content?.title) {
      return story.content.title
    }
    return story?.name || `Türchen ${door.day}`
  }

  const getDoorImage = () => {
    console.log("[v0] Story content:", story?.content)
    console.log("[v0] Story content.body:", story?.content?.body)

    if (!story?.content?.body || !Array.isArray(story.content.body)) {
      console.log("[v0] No body array found")
      return null
    }

    const searchForImage = (items: any[]): any => {
      for (const item of items) {
        // Check if this item has image directly
        if (item.image?.filename) {
          console.log("[v0] Found image in item:", item)
          return item.image
        }

        // If this item has a content array, search recursively
        if (item.content && Array.isArray(item.content)) {
          const nestedImage = searchForImage(item.content)
          if (nestedImage) {
            return nestedImage
          }
        }
      }
      return null
    }

    const imageObject = searchForImage(story.content.body)
    console.log("[v0] Final image object:", imageObject)
    return imageObject
  }

  const getRichTextContent = () => {
    if (!story?.content?.body || !Array.isArray(story.content.body)) {
      console.log("[v0] No body array found for richtext")
      return null
    }

    const searchForRichText = (items: any[]): any => {
      for (const item of items) {
        // Check if this item has richtext directly
        if (item.richtext) {
          console.log("[v0] Found richtext in item:", item)
          return item.richtext
        }

        // If this item has a content array, search recursively
        if (item.content && Array.isArray(item.content)) {
          const nestedRichText = searchForRichText(item.content)
          if (nestedRichText) {
            return nestedRichText
          }
        }
      }
      return null
    }

    const richTextContent = searchForRichText(story.content.body)
    console.log("[v0] Final richtext content:", richTextContent)
    return richTextContent
  }

  const renderRichText = (richtext: any) => {
    if (!richtext?.content || !Array.isArray(richtext.content)) {
      return null
    }

    return richtext.content.map((block: any, index: number) => {
      if (block.type === "heading" && block.attrs?.level && block.content) {
        const text = block.content
          .filter((item: any) => item.type === "text")
          .map((item: any) => item.text)
          .join("")

        const level = block.attrs.level

        // H1 = black, 4rem (auto-scaling on mobile), right-aligned
        if (level === 1) {
          return (
            <h1 key={index} className="text-4xl md:text-[4rem] font-black text-black text-right mb-6 leading-tight">
              {text}
            </h1>
          )
        }

        // H2 = black, 3rem (auto-scaling on mobile), right-aligned
        if (level === 2) {
          return (
            <h2 key={index} className="text-3xl md:text-[3rem] font-black text-black text-right mb-5 leading-tight">
              {text}
            </h2>
          )
        }

        // H3 = black, 2rem (auto-scaling on mobile), right-aligned
        if (level === 3) {
          return (
            <h3 key={index} className="text-2xl md:text-[2rem] font-black text-black text-right mb-4 leading-tight">
              {text}
            </h3>
          )
        }

        // Fallback for other heading levels
        return (
          <h4 key={index} className="text-xl md:text-2xl font-black text-black text-right mb-4 leading-tight">
            {text}
          </h4>
        )
      }

      if (block.type === "paragraph" && block.content) {
        const text = block.content
          .filter((item: any) => item.type === "text")
          .map((item: any) => item.text)
          .join("")

        return (
          <p key={index} className="text-lg text-gray-700 leading-relaxed mb-4 text-right">
            {text}
          </p>
        )
      }
      return null
    })
  }

  const getLinkList = () => {
    if (!story?.content?.body || !Array.isArray(story.content.body)) {
      console.log("[v0] No body array found for link_list")
      return null
    }

    const searchForLinkList = (items: any[]): any => {
      for (const item of items) {
        // Check if this item is a link_list component
        if (item.component === "link_list") {
          console.log("[v0] Found link_list in item:", item)
          return item
        }

        // If this item has a content array, search recursively
        if (item.content && Array.isArray(item.content)) {
          const nestedLinkList = searchForLinkList(item.content)
          if (nestedLinkList) {
            return nestedLinkList
          }
        }
      }
      return null
    }

    const linkListContent = searchForLinkList(story.content.body)
    console.log("[v0] Final link_list content:", linkListContent)
    return linkListContent
  }

  const renderLinkList = (linkList: any) => {
    if (!linkList?.links || !Array.isArray(linkList.links) || linkList.links.length === 0) {
      return null
    }

    const firstLink = linkList.links[0]
    if (!firstLink?.url?.cached_url || !firstLink?.label) {
      return null
    }

    return (
      <div className="flex justify-center items-end w-full max-w-4xl mx-auto py-8 gap-8">
        <h3 className="text-3xl md:text-[3.2rem] font-black text-[#001327] text-right flex-1">
          {linkList.title || ""}
        </h3>
        <a
          href={firstLink.url.cached_url}
          target={firstLink.new_tab ? "_blank" : "_self"}
          rel={firstLink.new_tab ? "noopener noreferrer" : undefined}
          className="text-3xl md:text-[3.2rem] font-black text-red-500 hover:underline transition-all duration-200 text-left flex-1"
        >
          {firstLink.label}
        </a>
      </div>
    )
  }

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-all duration-300 ${
        isAnimating ? "bg-black/60" : "bg-black/0"
      }`}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`w-full h-full bg-white shadow-xl relative transition-all duration-300 transform ${
          isAnimating ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
      >
        <div className="fixed top-0 left-0 right-0 z-20 bg-white">
          <div className="absolute top-8 left-8 text-red-500">
            <ViuLogo className="w-16 h-10" />
          </div>

          <button
            onClick={handleClose}
            className="absolute top-8 right-8 text-gray-500 hover:text-gray-700 text-3xl w-10 h-10 flex items-center justify-center"
            aria-label="Schließen"
          >
            ×
          </button>
        </div>

        <div className="h-full overflow-y-auto pt-24 pb-8">
          <div className="flex flex-col items-center justify-start px-8 max-w-4xl mx-auto">
            {loading ? (
              <div className="text-center py-16">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#001327] mx-auto mb-4"></div>
                <p className="text-gray-600">Türchen wird geladen...</p>
              </div>
            ) : error ? (
              <h1 className="text-4xl md:text-6xl font-extrabold text-[#001327] text-center text-balance py-16">
                Dieses Türchen gibt es (noch) nicht.
              </h1>
            ) : (
              <div className="text-center space-y-8 w-full">
                <h1 className="text-5xl md:text-7xl font-extrabold text-[#001327] text-balance leading-tight text-right">
                  {getTitle()}
                </h1>

                <div className="w-full max-w-2xl mx-auto">
                  {(() => {
                    const doorImage = getDoorImage()
                    return doorImage?.filename ? (
                      <div className="aspect-video rounded-lg overflow-hidden">
                        <img
                          src={doorImage.filename || "/placeholder.svg"}
                          alt={
                            doorImage.alt ||
                            story?.content?.body?.find((item: any) => item.hasOwnProperty("door"))?.alt ||
                            "Türchen Bild"
                          }
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                        <span className="text-gray-400">Bild wird hier angezeigt</span>
                      </div>
                    )
                  })()}
                </div>

                {(() => {
                  const richTextContent = getRichTextContent()
                  return richTextContent ? (
                    <div className="max-w-2xl mx-auto text-left">{renderRichText(richTextContent)}</div>
                  ) : null
                })()}

                {story?.content?.description && !getRichTextContent() && (
                  <p className="text-lg text-gray-700 max-w-2xl mx-auto leading-relaxed">{story.content.description}</p>
                )}

                {(() => {
                  const linkListContent = getLinkList()
                  return linkListContent ? renderLinkList(linkListContent) : null
                })()}

                {story?.content && (
                  <div className="mt-12 w-full max-w-4xl mx-auto space-y-6">
                    <details className="bg-blue-50 rounded-lg p-6">
                      <summary className="cursor-pointer font-semibold text-blue-700 mb-4">
                        🎯 Debug: Aktuell definierte Feld-Mappings
                      </summary>
                      <div className="space-y-4">
                        <h3 className="font-medium text-blue-800">
                          Extrahierte Felder (wie sie im Modal verwendet werden):
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div className="bg-white p-3 rounded border">
                            <strong className="text-blue-600">getTitle():</strong>
                            <div className="mt-1 text-gray-600">{getTitle()}</div>
                          </div>

                          <div className="bg-white p-3 rounded border">
                            <strong className="text-blue-600">story.content.title:</strong>
                            <div className="mt-1 text-gray-600">{story.content.title || "nicht gefunden"}</div>
                          </div>

                          <div className="bg-white p-3 rounded border">
                            <strong className="text-blue-600">story.content.subtitle:</strong>
                            <div className="mt-1 text-gray-600">{story.content.subtitle || "nicht gefunden"}</div>
                          </div>

                          <div className="bg-white p-3 rounded border">
                            <strong className="text-blue-600">story.content.pre_title:</strong>
                            <div className="mt-1 text-gray-600">{story.content.pre_title || "nicht gefunden"}</div>
                          </div>

                          <div className="bg-white p-3 rounded border">
                            <strong className="text-blue-600">story.content.description:</strong>
                            <div className="mt-1 text-gray-600">{story.content.description || "nicht gefunden"}</div>
                          </div>

                          <div className="bg-white p-3 rounded border">
                            <strong className="text-blue-600">getDoorImage():</strong>
                            <div className="mt-1 text-gray-600">
                              {(() => {
                                const img = getDoorImage()
                                return img?.filename
                                  ? `Bild gefunden: ${img.filename.substring(0, 50)}...`
                                  : "kein Bild gefunden"
                              })()}
                            </div>
                          </div>

                          <div className="bg-white p-3 rounded border">
                            <strong className="text-blue-600">getRichTextContent():</strong>
                            <div className="mt-1 text-gray-600">
                              {(() => {
                                const richText = getRichTextContent()
                                return richText
                                  ? `Rich Text gefunden (${richText.content?.length || 0} Blöcke)`
                                  : "kein Rich Text gefunden"
                              })()}
                            </div>
                          </div>

                          <div className="bg-white p-3 rounded border">
                            <strong className="text-blue-600">getLinkList():</strong>
                            <div className="mt-1 text-gray-600">
                              {(() => {
                                const linkList = getLinkList()
                                return linkList
                                  ? `Link List gefunden: "${linkList.title}" mit ${linkList.links?.length || 0} Links`
                                  : "keine Link List gefunden"
                              })()}
                            </div>
                          </div>

                          <div className="bg-white p-3 rounded border">
                            <strong className="text-blue-600">story.name:</strong>
                            <div className="mt-1 text-gray-600">{story.name || "nicht gefunden"}</div>
                          </div>

                          <div className="bg-white p-3 rounded border">
                            <strong className="text-blue-600">story.slug:</strong>
                            <div className="mt-1 text-gray-600">{story.slug || "nicht gefunden"}</div>
                          </div>

                          <div className="bg-white p-3 rounded border">
                            <strong className="text-blue-600">door.day:</strong>
                            <div className="mt-1 text-gray-600">{door.day}</div>
                          </div>
                        </div>
                      </div>
                    </details>

                    <details className="bg-gray-50 rounded-lg p-6">
                      <summary className="cursor-pointer font-semibold text-gray-700 mb-4">
                        🔍 Debug: Kompletter Body Content anzeigen
                      </summary>

                      <div className="space-y-4">
                        <h3 className="font-medium text-gray-800">Verfügbare Content-Felder:</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          {Object.entries(story.content).map(([key, value]) => (
                            <div key={key} className="bg-white p-3 rounded border">
                              <strong className="text-blue-600">{key}:</strong>
                              <div className="mt-1 text-gray-600">
                                {typeof value === "string"
                                  ? value.length > 100
                                    ? `${value.substring(0, 100)}...`
                                    : value
                                  : Array.isArray(value)
                                    ? `Array (${value.length} items)`
                                    : typeof value === "object" && value !== null
                                      ? "Object"
                                      : String(value)}
                              </div>
                            </div>
                          ))}
                        </div>

                        <h3 className="font-medium text-gray-800 pt-4">Raw JSON Content:</h3>
                        <div className="bg-black text-green-400 p-4 rounded-lg max-h-96 overflow-y-auto">
                          <pre className="text-xs whitespace-pre-wrap break-words">
                            {JSON.stringify(story.content, null, 2)}
                          </pre>
                        </div>
                      </div>
                    </details>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
