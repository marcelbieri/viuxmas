import { openai } from "@ai-sdk/openai"
import { streamText } from "ai"
import { GPT_REGISTRY } from "@/lib/gpt-registry"

export async function POST(req: Request) {
  try {
    const { messages, gptId, systemPrompt } = await req.json()

    // Validate GPT ID
    if (!gptId || !GPT_REGISTRY[gptId]) {
      return new Response("Invalid GPT ID", { status: 400 })
    }

    const config = GPT_REGISTRY[gptId]

    const result = await streamText({
      model: openai("gpt-4o-mini"),
      system: systemPrompt || config.systemPrompt,
      messages,
      temperature: 0.7,
      maxTokens: 500,
    })

    return result.toDataStreamResponse()
  } catch (error) {
    console.error("GPT Chat API error:", error)
    return new Response("Internal Server Error", { status: 500 })
  }
}
