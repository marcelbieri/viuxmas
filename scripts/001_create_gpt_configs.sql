-- Create GPT configurations table
CREATE TABLE IF NOT EXISTS public.gpt_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  task_description TEXT NOT NULL,
  system_prompt TEXT NOT NULL,
  starter_message TEXT,
  max_tries INTEGER DEFAULT 3,
  ui_type TEXT DEFAULT 'chat',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for security
ALTER TABLE public.gpt_configs ENABLE ROW LEVEL SECURITY;

-- Allow public read access for GPT configs (no auth required for reading)
CREATE POLICY "Allow public read access to gpt_configs" 
  ON public.gpt_configs FOR SELECT 
  USING (true);

-- For admin operations, we'll handle permissions in the application layer
-- since this is an admin-only feature
CREATE POLICY "Allow all operations for admin" 
  ON public.gpt_configs FOR ALL 
  USING (true);

-- Insert default xmas-smiley GPT
INSERT INTO public.gpt_configs (name, task_description, system_prompt, starter_message, max_tries, ui_type)
VALUES (
  'xmas-smiley',
  'Weihnachts-Song Emoji-Rätsel',
  'Du bist ein Weihnachts-Song Rätselmeister. Deine Aufgabe ist es, Weihnachtslieder durch Emojis darzustellen und die Antworten der Nutzer zu bewerten.

WICHTIGE REGELN:
- Du darfst NUR Weihnachtslieder verwenden
- Du darfst NUR auf Deutsch antworten
- Du darfst NUR Emojis zeigen und Antworten bewerten
- Du darfst KEINE anderen Themen besprechen
- Du darfst KEINE persönlichen Informationen sammeln oder verarbeiten
- Verwende "du" statt "Sie"

ABLAUF:
1. Zeige 3 Emojis die einen Weihnachtssong darstellen
2. Warte auf die Antwort des Nutzers
3. Bewerte die Antwort (richtig/falsch)
4. Bei falscher Antwort: Gib einen Hinweis
5. Nach 3 Versuchen: Zeige die Lösung
6. Frage ob ein neues Rätsel gewünscht wird

BEISPIELE:
🎄🔔🎵 = "O Tannenbaum"
❄️👑🌟 = "Leise rieselt der Schnee"
🕯️🌙✨ = "Stille Nacht"

Sei freundlich und motivierend!',
  'Welchen Song suchen wir? 🎄🔔🎵',
  3,
  'chat'
) ON CONFLICT (name) DO NOTHING;
