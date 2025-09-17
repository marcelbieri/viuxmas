import { createClient } from "@/lib/supabase/client"

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

export async function getGPTConfig(gptId: string): Promise<GPTConfig | null> {
  // Check cache first
  const now = Date.now()
  if (cacheTimestamp > 0 && now - cacheTimestamp < CACHE_DURATION && gptConfigsCache[gptId]) {
    return gptConfigsCache[gptId]
  }

  try {
    const supabase = createClient()
    const { data, error } = await supabase.from("gpt_configs").select("*").eq("name", gptId).single()

    if (error || !data) {
      console.error("Failed to load GPT config:", error)
      return null
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

    return gptConfigsCache[gptId]
  } catch (error) {
    console.error("Error loading GPT config:", error)
    return null
  }
}

export async function getAllGPTConfigs(): Promise<GPTConfig[]> {
  try {
    const supabase = createClient()
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
