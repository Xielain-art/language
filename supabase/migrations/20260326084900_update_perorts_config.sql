-- Добавляем колонку для языка отчетов (ссылается на таблицу languages)
ALTER TABLE users ADD COLUMN IF NOT EXISTS report_language TEXT REFERENCES languages(code);

-- Добавляем системные настройки для отчетов в bot_settings
INSERT INTO bot_settings (key, value, description) VALUES
  ('stats_min_mistakes', '10', 'Минимальное количество новых ошибок для генерации обычного отчета'),
  ('stats_mistakes_limit', '50', 'Максимальное количество ошибок, отправляемых в ИИ для отчета'),
  ('stats_min_reports_for_mega', '5', 'Минимальное количество новых обычных отчетов для генерации мега-отчета'),
  ('stats_pagination_limit', '5', 'Количество отчетов на одной странице в истории')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, description = EXCLUDED.description;