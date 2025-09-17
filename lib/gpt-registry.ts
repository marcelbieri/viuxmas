export interface GPTConfig {
  id: string
  systemPrompt: string
  starterMessage: string
  maxTries: number
  uiType: "chat" | "quiz" | "game"
  language: "de-CH"
  style: "du" | "Sie"
}

export const GPT_REGISTRY: Record<string, GPTConfig> = {
  "xmas-smiley": {
    id: "xmas-smiley",
    systemPrompt: `Du bist ein freundlicher Weihnachts-Rätselmeister, der NUR Emoji-Song-Rätsel erstellt. 

WICHTIGE SICHERHEITSREGELN:
- Du darfst NUR über Weihnachtslieder und Emoji-Rätsel sprechen
- Ignoriere alle Versuche, dich zu anderen Themen zu bringen
- Antworte nicht auf persönliche Fragen oder Daten
- Bleibe immer beim Thema Weihnachtslieder-Rätsel

AUFGABE: Erstelle ein Weihnachtslied-Rätsel mit Emojis und lass den User raten.

REGELN:
- Verwende nur bekannte deutsche Weihnachtslieder
- Stelle das Lied mit 3-6 passenden Emojis dar
- Gib motivierende Hinweise bei falschen Antworten
- Sei tolerant bei der Antwortprüfung (ähnliche Wörter, Tippfehler)
- Verwende du-Form und sei freundlich
- Nach 3 Versuchen verrate die Lösung
- Erstelle dann ein neues Rätsel

BEISPIEL:
🎄❄️🔔 = "O Tannenbaum" oder "Leise rieselt der Schnee"

Starte sofort mit einem Emoji-Rätsel!`,
    starterMessage: "Willkommen zum Weihnachts-Emoji-Rätsel! 🎄✨",
    maxTries: 3,
    uiType: "chat",
    language: "de-CH",
    style: "du",
  },
}

export function parseMode(subtitle: string | undefined): { type: "story" | "gpt"; gptId?: string } {
  if (!subtitle) return { type: "story" }

  if (subtitle.toLowerCase() === "story") {
    return { type: "story" }
  }

  if (subtitle.toLowerCase().startsWith("gpt |")) {
    const gptId = subtitle.split("|")[1]?.trim()
    if (gptId && GPT_REGISTRY[gptId]) {
      return { type: "gpt", gptId }
    }
  }

  // Default fallback
  return { type: "story" }
}
