import { NextResponse } from "next/server"

export const revalidate = 0 // Revalidate on every request for fresh content

export async function GET() {
  try {
    console.log("[v0] Environment variable debugging:")
    console.log("[v0] STORYBLOK_CDN_TOKEN exists:", !!process.env.STORYBLOK_CDN_TOKEN)
    console.log("[v0] STORYBLOK_CDN_TOKEN type:", typeof process.env.STORYBLOK_CDN_TOKEN)
    console.log("[v0] STORYBLOK_CDN_TOKEN length:", process.env.STORYBLOK_CDN_TOKEN?.length || 0)
    console.log("[v0] All env vars count:", Object.keys(process.env).length)
    console.log("[v0] NODE_ENV:", process.env.NODE_ENV)
    console.log("[v0] VERCEL:", process.env.VERCEL)

    // Check all possible environment variable names
    const possibleTokenNames = [
      "STORYBLOK_CDN_TOKEN",
      "STORYBLOK_TOKEN",
      "STORYBLOK_API_TOKEN",
      "STORYBLOK_ACCESS_TOKEN",
    ]

    let token = null
    let tokenSource = null

    for (const name of possibleTokenNames) {
      const envValue = process.env[name]
      if (envValue && envValue.trim()) {
        token = envValue.trim()
        tokenSource = name
        console.log(`[v0] Found token in ${name}`)
        break
      }
    }

    if (!token) {
      console.log("[v0] No token found in any environment variable")
      // List all environment variables that contain STORYBLOK
      const storyblokVars = Object.keys(process.env).filter((key) => key.toUpperCase().includes("STORYBLOK"))
      console.log("[v0] Available STORYBLOK env vars:", storyblokVars)

      return NextResponse.json(
        {
          error: "STORYBLOK_CDN_TOKEN is not configured. Please check your Vercel environment variables.",
          token_configured: false,
          success: false,
          debug: {
            checked_variables: possibleTokenNames,
            available_storyblok_vars: storyblokVars,
            env_keys_count: Object.keys(process.env).length,
            node_env: process.env.NODE_ENV,
            vercel: process.env.VERCEL,
            suggestion:
              "Go to Vercel Project Settings → Environment Variables and ensure STORYBLOK_CDN_TOKEN is set correctly, then redeploy.",
          },
        },
        { status: 500 },
      )
    }

    const maskedToken = token.length > 8 ? `${token.slice(0, 4)}...${token.slice(-4)}` : "***"
    console.log(`[v0] Using token from ${tokenSource}: ${maskedToken} (length: ${token.length})`)

    const expectedSpaceId = "312740"

    const cacheBuster = Date.now()
    const cacheVersion = Math.floor(Date.now() / 1000) // Unix timestamp for cache version

    // Test spaces/me endpoint first
    console.log("[v0] Testing spaces/me endpoint...")
    const spaceUrl = `https://api.storyblok.com/v2/cdn/spaces/me?token=${token}&cv=${cacheVersion}&_cb=${cacheBuster}`

    const spaceResponse = await fetch(spaceUrl, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "User-Agent": "Storyblok-Client",
      },
    })

    if (!spaceResponse.ok) {
      throw new Error(`Spaces endpoint failed: ${spaceResponse.status}`)
    }

    const spaceData = await spaceResponse.json()
    console.log(`[v0] Connected to space: ${spaceData.space?.name} (ID: ${spaceData.space?.id})`)

    const urlStrategies = [
      {
        url: `https://api.storyblok.com/v1/cdn/stories?token=${token}&version=published&cv=${cacheVersion}&_cb=${cacheBuster}`,
        type: "all_published",
      },
      {
        url: `https://api.storyblok.com/v1/cdn/stories?token=${token}&version=published&starts_with=doors/&cv=${cacheVersion}&_cb=${cacheBuster}`,
        type: "doors_children",
      },
      {
        url: `https://api.storyblok.com/v1/cdn/stories?token=${token}&version=published&starts_with=xmas-doors&cv=${cacheVersion}&_cb=${cacheBuster}`,
        type: "xmas_doors_children",
      },
    ]

    let allStories: any[] = []
    let doorsChildren: any[] = []
    let xmasDoorsChildren: any[] = []

    for (const strategy of urlStrategies) {
      console.log(`[v0] Testing ${strategy.type}: ${strategy.url.replace(token, "***")}`)

      try {
        const response = await fetch(strategy.url, {
          method: "GET",
          headers: {
            Accept: "application/json",
            "User-Agent": "Storyblok-Client",
          },
          redirect: "follow",
        })

        console.log(`[v0] ${strategy.type} Response Status: ${response.status}`)

        if (response.ok) {
          const data = await response.json()
          const storiesCount = data.stories?.length || 0
          console.log(`[v0] ${strategy.type} SUCCESS! Found ${storiesCount} stories`)

          if (data.stories && data.stories.length > 0) {
            if (strategy.type === "doors_children") {
              doorsChildren = data.stories
            } else if (strategy.type === "xmas_doors_children") {
              xmasDoorsChildren = data.stories
            } else {
              allStories = data.stories
            }
          }
        }
      } catch (strategyError) {
        console.log(`[v0] ${strategy.type} error:`, strategyError)
      }
    }

    return NextResponse.json(
      {
        success: true,
        token_configured: true,
        space_info: {
          id: spaceData.space?.id,
          name: spaceData.space?.name,
          expected_id: expectedSpaceId,
          id_matches: spaceData.space?.id?.toString() === expectedSpaceId,
        },
        timestamp: new Date().toISOString(),
        stories_count: allStories.length,
        doors_children_count: doorsChildren.length,
        xmas_doors_children_count: xmasDoorsChildren.length,
        available_stories: allStories.map((s: any) => ({
          slug: s.slug,
          name: s.name,
          id: s.id,
          full_slug: s.full_slug,
          published_at: s.published_at,
          is_published: !!s.published_at,
          content_type: s.content?.component || "unknown",
        })),
        doors_children: doorsChildren.map((s: any) => ({
          slug: s.slug,
          name: s.name,
          id: s.id,
          full_slug: s.full_slug,
          published_at: s.published_at,
          is_published: !!s.published_at,
          content_type: s.content?.component || "unknown",
          content: s.content,
        })),
        xmas_doors_children: xmasDoorsChildren.map((s: any) => ({
          slug: s.slug,
          name: s.name,
          id: s.id,
          full_slug: s.full_slug,
          published_at: s.published_at,
          is_published: !!s.published_at,
          content_type: s.content?.component || "unknown",
          content: s.content,
        })),
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
    console.log("[v0] Storyblok API error:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
        token_configured: !!process.env.STORYBLOK_CDN_TOKEN,
        success: false,
      },
      { status: 500 },
    )
  }
}
