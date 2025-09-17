import type { CalendarDoor } from "@/types/calendar"

export async function fetchCalendar(): Promise<CalendarDoor[]> {
  try {
    const response = await fetch("/api/calendar", {
      next: { revalidate: 300 },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch calendar data: ${response.status}`)
    }

    const data = await response.json()

    if (data.error) {
      throw new Error(data.error)
    }

    return data.doors || []
  } catch (error) {
    console.error("Error fetching calendar data:", error)
    throw new Error("Failed to fetch calendar data")
  }
}

function convertStoryToDoor(story: any): CalendarDoor | null {
  // Extract day number from story name or slug
  let day: number | null = null

  // Try to extract from name like "Türchen 1" or "tuerchen-1"
  const nameMatch = story.name?.match(/(\d+)/)
  const slugMatch = story.slug?.match(/(\d+)/)

  if (nameMatch) {
    day = Number.parseInt(nameMatch[1], 10)
  } else if (slugMatch) {
    day = Number.parseInt(slugMatch[1], 10)
  }

  if (!day || day < 1 || day > 24) {
    return null // Skip invalid doors
  }

  return {
    day,
    title: story.content?.title || story.name || `Türchen ${day}`,
    subtitle: story.content?.subtitle,
    image: story.content?.image
      ? {
          filename: story.content.image.filename || story.content.image,
          alt: story.content.image.alt || `Türchen ${day}`,
        }
      : undefined,
    body: story.content?.body,
    cta_primary: story.content?.cta_primary,
    cta_secondary: story.content?.cta_secondary,
    reveal_at: story.content?.reveal_at,
  }
}

interface GetDoorStatusParams {
  day: number
  revealAt?: string
  now: Date
  tz: string
}

export function getDoorStatus({ day, revealAt, now, tz }: GetDoorStatusParams): "past" | "today" | "future" {
  // Get current date in Europe/Zurich timezone
  const zurichNow = new Date(now.toLocaleString("en-US", { timeZone: tz }))
  const currentDay = zurichNow.getDate()
  const currentMonth = zurichNow.getMonth() + 1 // 0-based to 1-based
  const currentYear = zurichNow.getFullYear()

  // Determine reveal date
  let revealDate: Date
  if (revealAt) {
    revealDate = new Date(revealAt)
  } else {
    // Default: December of current year, at 00:00
    revealDate = new Date(currentYear, 11, day, 0, 0, 0) // Month is 0-based
  }

  // Convert reveal date to Zurich timezone for comparison
  const zurichRevealDate = new Date(revealDate.toLocaleString("en-US", { timeZone: tz }))

  // Determine status based on current date and reveal date
  if (zurichNow >= zurichRevealDate) {
    // Check if it's today
    const revealDay = zurichRevealDate.getDate()
    const revealMonth = zurichRevealDate.getMonth() + 1

    if (revealDay === currentDay && revealMonth === currentMonth) {
      return "today"
    } else if (zurichRevealDate < zurichNow) {
      return "past"
    }
  }

  return "future"
}

export function parseDateFromPreTitle(preTitle: string): Date | null {
  if (!preTitle) return null

  // Try to parse "DD.MM.YYYY" format first
  const dateMatch = preTitle.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/)
  if (dateMatch) {
    const day = Number.parseInt(dateMatch[1], 10)
    const month = Number.parseInt(dateMatch[2], 10) - 1 // Month is 0-based in Date constructor
    const year = Number.parseInt(dateMatch[3], 10)

    if (day >= 1 && day <= 31 && month >= 0 && month <= 11 && year >= 2000) {
      console.log(`[v0] Parsed date from pre_title "${preTitle}": ${day}.${month + 1}.${year}`)
      return new Date(year, month, day, 0, 0, 0)
    }
  }

  // Try to parse "Tag X" format where X is the day number
  const dayMatch = preTitle.match(/Tag\s+(\d+)/i)
  if (dayMatch) {
    const day = Number.parseInt(dayMatch[1], 10)
    if (day >= 1 && day <= 31) {
      const currentYear = new Date().getFullYear()
      // Assume December for advent calendar
      console.log(`[v0] Parsed day from pre_title "${preTitle}": December ${day}, ${currentYear}`)
      return new Date(currentYear, 11, day, 0, 0, 0) // Month is 0-based
    }
  }

  console.log(`[v0] Could not parse date from pre_title: "${preTitle}"`)
  return null
}
