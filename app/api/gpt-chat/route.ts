import OpenAI from "openai"
import { getGPTConfig } from "@/lib/gpt-registry"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(req: Request) {
  try {
    const { messages, gptId, systemPrompt } = await req.json()

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

    const config = await getGPTConfig(gptId, true) // Use server client
    if (!config) {
      console.error("[v0] GPT config not found for ID:", gptId)
      return new Response(`GPT configuration not found for ID: ${gptId}`, { status: 404 })
    }

    console.log("[v0] GPT config loaded:", config.name, "System prompt length:", config.system_prompt?.length)

    if (!process.env.OPENAI_API_KEY) {
      console.error("[v0] OpenAI API key not found")
      return new Response("OpenAI API key not configured", { status: 500 })
    }

    console.log("[v0] Making OpenAI API call...")

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "system", content: systemPrompt || config.system_prompt }, ...messages],
      temperature: 0.7,
      max_tokens: 500,
      stream: true,
    })

    console.log("[v0] OpenAI API call successful, creating stream...")

    // Create a readable stream for the response
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of completion) {
            const content = chunk.choices[0]?.delta?.content || ""
            if (content) {
              controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ content })}\n\n`))
            }
          }
          controller.enqueue(new TextEncoder().encode("data: [DONE]\n\n"))
          controller.close()
        } catch (error) {
          console.error("[v0] Stream error:", error)
          controller.error(error)
        }
      },
    })

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    })
  } catch (error) {
    console.error("[v0] GPT Chat API error:", error)
    console.error("[v0] Error stack:", error.stack)
    return new Response(`Internal Server Error: ${error.message}`, { status: 500 })
  }
}
