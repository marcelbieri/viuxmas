"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Snowflake } from "./Snowflake"
import { DoorModal } from "./DoorModal"
import { fetchCalendar, getDoorStatus, parseDateFromPreTitle } from "@/lib/calendar"
import type { CalendarDoor } from "@/types/calendar"
import ViuLogo from "./ViuLogo"
import { SnowfallEffect } from "./SnowfallEffect"

export function CalendarPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [doors, setDoors] = useState<CalendarDoor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedDoor, setSelectedDoor] = useState<CalendarDoor | null>(null)

  const doorSlug = searchParams.get("door")

  useEffect(() => {
    const handlePopState = () => {
      setSelectedDoor(null)
    }

    window.addEventListener("popstate", handlePopState)
    return () => window.removeEventListener("popstate", handlePopState)
  }, [])

  useEffect(() => {
    async function loadCalendar() {
      try {
        const calendarData = await fetchCalendar()
        setDoors(calendarData)

        if (doorSlug && calendarData.length > 0) {
          const door = calendarData.find((d) => d.slug === doorSlug)
          if (door) {
            setSelectedDoor(door)
          }
        }
      } catch (err) {
        setError("Kalender lädt nicht – bitte später versuchen")
      } finally {
        setLoading(false)
      }
    }

    loadCalendar()
  }, [doorSlug])

  const handleDoorClick = (door: CalendarDoor) => {
    setSelectedDoor(door)
    const url = new URL(window.location.href)
    url.searchParams.set("door", door.slug)
    window.history.pushState({}, "", url.toString())
  }

  const handleCloseModal = () => {
    setSelectedDoor(null)
    router.push("/")
  }

  const getScatteredPosition = (index: number) => {
    const positions = [
      { top: "25%", left: "20%", size: "xlarge" as const },
      { top: "50%", left: "15%", size: "large" as const },
      { top: "30%", left: "50%", size: "large" as const },
      { top: "40%", left: "75%", size: "medium" as const },
      { top: "70%", left: "30%", size: "xlarge" as const },
      { top: "60%", left: "60%", size: "medium" as const },
      { top: "80%", left: "80%", size: "small" as const },
      { top: "20%", left: "80%", size: "small" as const },
      { top: "85%", left: "50%", size: "medium" as const },
      { top: "45%", left: "40%", size: "small" as const },
      { top: "65%", left: "85%", size: "small" as const },
      { top: "35%", left: "85%", size: "medium" as const },
    ]

    return positions[index % positions.length] || { top: "50%", left: "50%", size: "medium" as const }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#001327] flex items-center justify-center">
        <div className="text-white text-xl">Kalender wird geladen...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#001327] flex items-center justify-center">
        <div className="text-white text-xl">{error}</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#001327] text-white relative">
      <SnowfallEffect />

      {/* Header */}
      <header className="px-4 py-6 lg:px-12 lg:py-8">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between mb-6 lg:mb-8">
          <div className="text-white mb-6 lg:mb-0">
            <ViuLogo className="w-12 h-8 lg:w-16 lg:h-10" />
          </div>
          <div className="max-w-full lg:max-w-2xl text-left lg:text-right mt-8 lg:mt-20">
            <h1 className="text-3xl sm:text-4xl lg:text-6xl font-bold mb-4 lg:mb-6 text-balance leading-tight text-right">
              Weihnachts&shy;kalender
            </h1>
            <p className="text-base sm:text-lg lg:text-xl text-white/80 leading-relaxed text-pretty text-right">
              Entdecke die festliche Vorfreude mit unserem Weihnachtskalender! Jeden Tag erwartet dich eine neue
              Überraschung, die die Weihnachtszeit noch magischer macht.
            </p>
          </div>
        </div>
      </header>

      {/* Calendar Scattered Layout */}
      <main className="relative h-[60vh] sm:h-[70vh] lg:h-screen px-4 lg:px-0">
        {doors.map((door, index) => {
          const now = new Date()

          const doorDate =
            parseDateFromPreTitle(door.pre_title || "") || new Date(new Date().getFullYear(), 11, door.day, 0, 0, 0)

          const status = getDoorStatus({
            day: door.day,
            revealAt: doorDate.toISOString(),
            now,
            tz: "Europe/Zurich",
          })

          console.log(
            `[v0] Door ${door.day}: pre_title="${door.pre_title}", title="${door.title}", parsed date=${doorDate.toISOString()}, status=${status}`,
          )

          const position = getScatteredPosition(index)

          return (
            <div
              key={door.day}
              className="absolute transform -translate-x-1/2 -translate-y-1/2"
              style={{
                top: position.top,
                left: position.left,
              }}
            >
              <Snowflake day={door.day} state={status} size={position.size} onClick={() => handleDoorClick(door)} />
            </div>
          )
        })}
      </main>

      {/* Elf */}
      <div className="fixed bottom-0 right-0 z-10 -mr-1 -mb-1 lg:-mr-2 lg:-mb-2">
        <img
          src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-60RQJggXGzTeulr3HcUXed4A3aolpb.png"
          alt="Weihnachtself"
          className="w-20 h-26 sm:w-24 sm:h-32 lg:w-36 lg:h-48 object-contain"
        />
      </div>

      {/* Modal */}
      {selectedDoor && <DoorModal door={selectedDoor} onClose={handleCloseModal} />}
    </div>
  )
}
