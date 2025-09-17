-- Insert default GPT configurations
INSERT INTO gpt_configs (name, task_description, system_prompt, starter_message, max_tries, ui_type) VALUES
('xmas-smiley', 'Erkennt Weihnachtslieder anhand von Emojis', 'Du bist ein Weihnachtslied-Experte. Deine Aufgabe ist es, Weihnachtslieder anhand von Emoji-Beschreibungen zu erraten. Antworte nur auf Deutsch und bleibe beim Thema Weihnachtslieder. Wenn der User ein Lied richtig errät, gratuliere ihm herzlich. Wenn er falsch liegt, gib einen kleinen Hinweis.', 'Welchen Song suchen wir? 🎄🔔🎵', 3, 'chat')
ON CONFLICT (name) DO UPDATE SET
  task_description = EXCLUDED.task_description,
  system_prompt = EXCLUDED.system_prompt,
  starter_message = EXCLUDED.starter_message,
  max_tries = EXCLUDED.max_tries,
  ui_type = EXCLUDED.ui_type,
  updated_at = CURRENT_TIMESTAMP;
