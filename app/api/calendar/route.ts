import { NextResponse } from "next/server"

export const revalidate = 0 // Revalidate on every request for fresh content

export async function GET() {
  try {
    console.log("[v0] Calendar API: Starting request")

    const token =
      process.env.STORYBLOK_CDN_TOKEN ||
      process.env["STORYBLOK_CDN_TOKEN"] ||
      globalThis.process?.env?.STORYBLOK_CDN_TOKEN

    console.log("[v0] Calendar API: Token check - exists:", !!token, "type:", typeof token)

    if (!token || token.trim() === "") {
      console.log("[v0] Calendar API: Token not found or empty")
      console.log(
        "[v0] Calendar API: Available env vars:",
        Object.keys(process.env).filter((k) => k.includes("STORYBLOK")),
      )
      return NextResponse.json({ error: "STORYBLOK_CDN_TOKEN is not configured" }, { status: 500 })
    }

    console.log("[v0] Calendar API: Token found, length:", token.length)

    const cacheBuster = Date.now()
    const cacheVersion = Math.floor(Date.now() / 1000) // Unix timestamp for cache version

    const baseUrl = "https://api.storyblok.com/v1/cdn/stories"
    const doorsUrl = `${baseUrl}?token=${token}&version=published&starts_with=xmas-doors&cv=${cacheVersion}&_cb=${cacheBuster}`

    console.log("[v0] Calendar API: Fetching xmas-doors from:", doorsUrl.replace(token, "***"))

    const doorsResponse = await fetch(doorsUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(10000), // 10 second timeout
    })

    console.log("[v0] Calendar API: Response status:", doorsResponse.status)

    if (!doorsResponse.ok) {
      const errorText = await doorsResponse.text()
      console.log("[v0] Calendar API: Error response:", errorText)
      throw new Error(`Failed to fetch xmas-doors stories: ${doorsResponse.status} - ${errorText}`)
    }

    const doorsData = await doorsResponse.json()
    const stories = doorsData.stories || []

    console.log("[v0] Calendar API: Found xmas-doors stories:", stories.length)
    console.log(
      "[v0] Calendar API: Story names:",
      stories.map((s) => s.name),
    )

    const doors = stories
      .map((story) => {
        // Extract day number from name or slug
        const name = story.name || story.slug || ""
        const dayMatch = name.match(/(\d+)/)
        const day = dayMatch ? Number.parseInt(dayMatch[1], 10) : 1

        console.log("[v0] Calendar API: Processing xmas-doors story:", name, "-> day:", day)

        const content = story.content || {}

        console.log("[v0] Calendar API: Available content fields for", name, ":", Object.keys(content))

        let preTitle = content.pre_title // Check top-level first

        // If not found at top level, search in body array for hero_banner component
        if (!preTitle && content.body && Array.isArray(content.body)) {
          const heroBanner = content.body.find((item) => item.component === "hero_banner")
          if (heroBanner && heroBanner.pre_title) {
            preTitle = heroBanner.pre_title
          }
        }

        console.log("[v0] Calendar API: Content pre_title value:", preTitle)
        console.log("[v0] Calendar API: Full content object:", JSON.stringify(content, null, 2))

        // Create reveal date (December + day)
        const currentYear = new Date().getFullYear()
        const revealDate = new Date(currentYear, 11, day) // December is month 11

        // Look for title in content fields or use story name as fallback
        let title = story.name || `Türchen ${day}`
        if (content.title) {
          title = content.title
        }

        return {
          day,
          title,
          subtitle: content.subtitle,
          pre_title: preTitle, // Use extracted preTitle from nested structure
          image: content.image
            ? {
                filename: content.image.filename || content.image,
                alt: content.image.alt || `Türchen ${day}`,
              }
            : undefined,
          body: content.body,
          cta_primary: content.cta_primary,
          cta_secondary: content.cta_secondary,
          reveal_at: revealDate.toISOString(),
        }
      })
      .sort((a, b) => a.day - b.day) // Sort by day number

    console.log("[v0] Calendar API: Returning xmas-doors:", doors.length)

    return NextResponse.json(
      { doors },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      },
    )
  } catch (error) {
    console.error("[v0] Calendar API error:", error)
    return NextResponse.json(
      {
        error: "Failed to load calendar data",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
