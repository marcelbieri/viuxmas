-- Check what's currently in the gpt_configs table
SELECT * FROM gpt_configs;

-- Delete any existing records to start fresh
DELETE FROM gpt_configs;

-- Insert the correct GPT configuration with the expected ID
INSERT INTO gpt_configs (
  id,
  name,
  task_description,
  system_prompt,
  starter_message,
  ui_type,
  max_tries,
  created_at,
  updated_at
) VALUES (
  '18f3876e-e56d-4282-828f-a9017b4c2ebe',
  'xmas-smiley',
  'Christmas song guessing game',
  'Du bist ein Weihnachtslied-Experte. Deine Aufgabe ist es, Benutzern dabei zu helfen, Weihnachtslieder zu erraten. Gib Hinweise und stelle Fragen, um sie zum richtigen Lied zu führen. Sei freundlich und festlich in deinem Ton.',
  'Ho ho ho! 🎄 Ich bin dein Weihnachtslied-Experte! Lass uns gemeinsam ein Weihnachtslied erraten. Ich gebe dir Hinweise und du versuchst herauszufinden, welches Lied ich meine. Bist du bereit?',
  'chat',
  10,
  NOW(),
  NOW()
);
