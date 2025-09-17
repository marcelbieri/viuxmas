import OpenAI from "openai"
import { GPT_REGISTRY } from "@/lib/gpt-registry"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(req: Request) {
  try {
    const { messages, gptId, systemPrompt } = await req.json()

    // Validate GPT ID
    if (!gptId || !GPT_REGISTRY[gptId]) {
      return new Response("Invalid GPT ID", { status: 400 })
    }

    const config = GPT_REGISTRY[gptId]

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "system", content: systemPrompt || config.systemPrompt }, ...messages],
      temperature: 0.7,
      max_tokens: 500,
      stream: true,
    })

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
    console.error("GPT Chat API error:", error)
    return new Response("Internal Server Error", { status: 500 })
  }
}
