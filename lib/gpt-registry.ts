import { createClient } from "@/lib/supabase/client"
import { createClient as createServerClient } from "@/lib/supabase/server"

export interface GPTConfig {
  id: string
  name: string
  task_description: string
  system_prompt: string
  starter_message: string
  max_tries: number
  ui_type: "chat" | "quiz" | "game"
  created_at?: string
  updated_at?: string
}

// Cache for GPT configs to avoid repeated database calls
let gptConfigsCache: Record<string, GPTConfig> = {}
let cacheTimestamp = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export async function getGPTConfig(gptId: string, useServerClient = false): Promise<GPTConfig | null> {
  // Check cache first
  const now = Date.now()
  if (cacheTimestamp > 0 && now - cacheTimestamp < CACHE_DURATION && gptConfigsCache[gptId]) {
    console.log("[v0] Returning cached GPT config for:", gptId)
    return gptConfigsCache[gptId]
  }

  try {
    console.log("[v0] Loading GPT config from database for:", gptId, "useServerClient:", useServerClient)
    const supabase = useServerClient ? createServerClient() : createClient()

    console.log("[v0] Querying gpt_configs table...")
    const { data, error } = await supabase.from("gpt_configs").select("*").eq("name", gptId).single()

    console.log("[v0] Database query result:", { data: data ? "found" : "not found", error: error?.message })

    if (error) {
      console.error("[v0] Database error:", error)
      // If table doesn't exist, create default config
      if (error.code === "42P01" || error.message?.includes("relation") || error.message?.includes("does not exist")) {
        console.log("[v0] Table doesn't exist, returning fallback config")
        return createFallbackConfig(gptId)
      }
      return null
    }

    if (!data) {
      console.log("[v0] No data found for gptId:", gptId, "creating fallback config")
      return createFallbackConfig(gptId)
    }

    // Update cache
    gptConfigsCache[gptId] = {
      id: data.id,
      name: data.name,
      task_description: data.task_description,
      system_prompt: data.system_prompt,
      starter_message: data.starter_message,
      max_tries: data.max_tries,
      ui_type: data.ui_type,
      created_at: data.created_at,
      updated_at: data.updated_at,
    }
    cacheTimestamp = now

    console.log("[v0] Successfully loaded and cached GPT config:", gptId)
    return gptConfigsCache[gptId]
  } catch (error) {
    console.error("[v0] Error loading GPT config:", error)
    console.log("[v0] Creating fallback config for:", gptId)
    return createFallbackConfig(gptId)
  }
}

export async function getAllGPTConfigs(useServerClient = false): Promise<GPTConfig[]> {
  try {
    const supabase = useServerClient ? createServerClient() : createClient()
    const { data, error } = await supabase.from("gpt_configs").select("*").order("created_at", { ascending: true })

    if (error) {
      console.error("Failed to load GPT configs:", error)
      return []
    }

    return data.map((item) => ({
      id: item.id,
      name: item.name,
      task_description: item.task_description,
      system_prompt: item.system_prompt,
      starter_message: item.starter_message,
      max_tries: item.max_tries,
      ui_type: item.ui_type,
      created_at: item.created_at,
      updated_at: item.updated_at,
    }))
  } catch (error) {
    console.error("Error loading GPT configs:", error)
    return []
  }
}

export function parseMode(subtitle: string | undefined): { type: "story" | "gpt"; gptId?: string } {
  if (!subtitle) return { type: "story" }

  if (subtitle.toLowerCase() === "story") {
    return { type: "story" }
  }

  if (subtitle.toLowerCase().startsWith("gpt |")) {
    const gptId = subtitle.split("|")[1]?.trim()
    if (gptId) {
      return { type: "gpt", gptId }
    }
  }

  // Default fallback
  return { type: "story" }
}

// Clear cache function for admin operations
export function clearGPTConfigCache() {
  gptConfigsCache = {}
  cacheTimestamp = 0
}

function createFallbackConfig(gptId: string): GPTConfig {
  if (gptId === "xmas-smiley") {
    return {
      id: "fallback-xmas-smiley",
      name: "xmas-smiley",
      task_description: "Erkennt Weihnachtslieder anhand von Emojis",
      system_prompt:
        "Du bist ein Weihnachtslied-Experte. Deine Aufgabe ist es, Weihnachtslieder anhand von Emoji-Beschreibungen zu erraten. Antworte nur auf Deutsch und bleibe beim Thema Weihnachtslieder. Wenn der User ein Lied richtig errät, gratuliere ihm herzlich. Wenn er falsch liegt, gib einen kleinen Hinweis.",
      starter_message: "Welchen Song suchen wir? 🎄🔔🎵",
      max_tries: 3,
      ui_type: "chat",
    }
  }

  return {
    id: `fallback-${gptId}`,
    name: gptId,
    task_description: "Standard GPT Assistent",
    system_prompt: "Du bist ein hilfsreicher Assistent. Antworte nur auf Deutsch und bleibe höflich.",
    starter_message: "Hallo! Wie kann ich dir helfen?",
    max_tries: 5,
    ui_type: "chat",
  }
}
