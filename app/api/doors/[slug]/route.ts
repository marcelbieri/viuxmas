export const revalidate = 0 // Revalidate on every request for fresh content

export async function GET(request: Request, { params }: { params: { slug: string } }) {
  try {
    const token = process.env.STORYBLOK_CDN_TOKEN

    if (!token) {
      return Response.json({ error: "STORYBLOK_CDN_TOKEN is not configured" }, { status: 500 })
    }

    const { slug } = params
    const fullSlug = `xmas-doors/${slug}`

    const cacheBuster = Date.now()
    const cacheVersion = Math.floor(Date.now() / 1000) // Unix timestamp for cache version

    const url = `https://api.storyblok.com/v1/cdn/stories?version=published&token=${token}&starts_with=xmas-doors&by_slugs=${fullSlug}&cv=${cacheVersion}&_cb=${cacheBuster}`

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      redirect: "follow",
    })

    if (!response.ok) {
      if (response.status === 404) {
        return Response.json({ error: "Story not found", story: null }, { status: 404 })
      }
      throw new Error(`Storyblok API returned ${response.status}`)
    }

    const data = await response.json()
    const story = data.stories?.[0]

    if (!story) {
      return Response.json({ error: "Story not found", story: null }, { status: 404 })
    }

    const extractedContent = story.content || {}

    // Look for title in body array if it exists
    if (story.content?.body && Array.isArray(story.content.body)) {
      story.content.body.forEach((block: any) => {
        if (block.title) extractedContent.title = block.title
        if (block.subtitle) extractedContent.subtitle = block.subtitle
        if (block.description) extractedContent.description = block.description
        if (block.pre_title) extractedContent.pre_title = block.pre_title
      })
    }

    return Response.json(
      {
        success: true,
        story: {
          name: story.name || "Unbekanntes Türchen",
          slug: story.slug || slug,
          full_slug: story.full_slug || fullSlug,
          content: extractedContent,
        },
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      },
    )
  } catch (error) {
    console.error("[v0] Door API error:", error)
    return Response.json({ error: "Failed to load door details", story: null }, { status: 500 })
  }
}
