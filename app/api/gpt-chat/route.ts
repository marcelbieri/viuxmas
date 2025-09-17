import { openai } from "@ai-sdk/openai"
import { streamText } from "ai"
import { getGPTConfigServer } from "@/lib/gpt-registry-server"

export async function POST(req: Request) {
  console.log("[v0] GPT Chat API called - starting request processing")

  try {
    let requestBody
    try {
      requestBody = await req.json()
      console.log("[v0] Request body parsed successfully")
    } catch (parseError) {
      console.error("[v0] Failed to parse request body:", parseError)
      return new Response("Invalid JSON in request body", { status: 400 })
    }

    const { messages, gptId, systemPrompt } = requestBody

    console.log("[v0] GPT Chat API called with gptId:", gptId)
    console.log("[v0] Request body:", {
      messages: messages?.length,
      gptId,
      systemPrompt: systemPrompt?.substring(0, 50),
    })

    if (!gptId) {
      console.error("[v0] No gptId provided")
      return new Response("GPT ID is required", { status: 400 })
    }

    if (!process.env.OPENAI_API_KEY) {
      console.error("[v0] OpenAI API key not found")
      return new Response("OpenAI API key not configured", { status: 500 })
    }

    console.log("[v0] Loading GPT config for ID:", gptId)
    let config
    try {
      config = await getGPTConfigServer(gptId)
      console.log("[v0] Config loaded:", config ? "SUCCESS" : "FAILED")
    } catch (configError) {
      console.error("[v0] Error loading GPT config:", configError)
      return new Response(`Failed to load GPT configuration: ${configError.message}`, { status: 500 })
    }

    if (!config) {
      console.error("[v0] GPT config not found for ID:", gptId)
      return new Response(`GPT configuration not found for ID: ${gptId}`, { status: 404 })
    }

    console.log("[v0] GPT config loaded:", config.name, "System prompt length:", config.system_prompt?.length)

    try {
      console.log("[v0] Making AI SDK streamText call...")

      const result = await streamText({
        model: openai("gpt-4o-mini"),
        system: systemPrompt || config.system_prompt,
        messages: messages,
        temperature: 0.7,
        maxTokens: 500,
      })

      console.log("[v0] AI SDK call successful, returning stream...")

      return result.toTextStreamResponse()
    } catch (aiError) {
      console.error("[v0] AI SDK error:", aiError)
      return new Response(`AI SDK error: ${aiError.message}`, { status: 500 })
    }
  } catch (error) {
    console.error("[v0] GPT Chat API error:", error)
    console.error("[v0] Error stack:", error.stack)
    return new Response(`Internal Server Error: ${error.message}`, { status: 500 })
  }
}
