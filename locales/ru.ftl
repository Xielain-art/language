## Базовые команды
start = 
    👋 Привет, { $name }! 
    Я твой AI-репетитор. Я помогу тебе заговорить свободно.
    
    Отправляй мне **голосовые сообщения**, и я буду исправлять твои ошибки в реальном времени.
    
    Для начала выбери свой уровень ниже:

language = Выбери язык интерфейса:
setcommands = Команды бота обновлены.

## Приветствие и Статус
welcome = Добро пожаловать в FluentAI! 🚀
welcome-back = С возвращением!

## Выбор уровня и настроек
language-select = Пожалуйста, выбери язык:
language-changed = Язык успешно изменен!
language-level-title = Выбери свой уровень владения языком:

## Ошибки и системные сообщения
admin-commands-updated = Список команд обновлен администратором.
unhandled = Извини, я не понял эту команду. Попробуй /start или отправь мне голосовое сообщение.
error-user-not-found = Пользователь не найден. Пожалуйста, используй /start для регистрации.
error-saving-vocabulary = Ошибка сохранения словаря!
error-unexpected = Произошла непредвиденная ошибка.
error-saving-selection = Ошибка сохранения выбора!
error-starting-session = Ошибка запуска сессии!
setup-required = ⚠️ Пожалуйста, сначала завершите настройку для доступа к этой функции.

## Специфичные для FluentAI
level-selected = Уровень { $level } установлен! Теперь выбери сценарий или просто начни говорить.
low-balance = ⚠️ У тебя закончились бесплатные сообщения. Переходи в профиль, чтобы обновиться до Premium.
word-added = ✨ Добавил слово "{$word}" в твой словарь.

## Главное меню
menu-main-title = 📱 Главное меню:
menu-main-profile = 
    👤 <b>Твой профиль:</b>
    🎯 Изучаемый язык: <b>{ $target_lang }</b>
    📊 Уровень: <b>{ $level }</b>
    🗣 Тон репетитора: <b>{ $tone }</b>
    
    Выбери действие ниже 👇

menu-main-vocabulary = 📚 Словарь ({ $count })
menu-main-free-chat = 💬 Свободный диалог
menu-main-settings = ⚙️ Настройки

menu-settings-tone = 🎭 Роль и Тон
menu-settings-language = 🌐 Язык изучения
menu-settings-level = 📊 Уровень языка
menu-settings-ai-model = 🤖 Модель ИИ
ai-model-select = Выберите модель ИИ
ai-model-selected = ✅ Модель выбрана: { $model }
error-model-overloaded = ⚠️ Выбранная модель ИИ перегружена. Попробуйте позже или переключитесь на другую модель.
switch-ai-model-btn = 🤖 Сменить модель ИИ
menu-settings-analysis-tone = 📊 Тон анализа
menu-settings-ui-language = 🌐 Язык интерфейса

menu-free-chat = 🎙 Свободный диалог
menu-roles = 🎭 Сценарии
menu-vocabulary = 📚 Мой словарь
menu-settings = ⚙️ Настройки
menu-about = ℹ️ О нас / Помощь

## О нас
about-text = 
    🤖 <b>О FluentAI</b>
    
    Я — твой персональный AI-репетитор, созданный для практики иностранных языков через живое общение.
    
    🚀 <b>Как пользоваться:</b>
    1. Настрой язык и уровень в Настройках.
    2. Запусти 🎙 <b>Свободный диалог</b>, чтобы поболтать на любую тему.
    3. Используй 🎭 <b>Сценарии</b> для отработки конкретных ситуаций.
    4. Отправляй <b>Голосовые сообщения</b> — я слушаю и исправляю ошибки!
    
    📢 <b>Поддержка:</b> @support_channel

## Уведомления меню
in-development = 🚧 Эта функция еще в разработке!

language-to-learn = 🎯 Какой язык ты хочешь изучать?
language-level = 📊 Выбери свой текущий уровень:

## Свободный диалог
free-chat-activated = 🎙 Режим свободного диалога активирован!
    
    Отправь мне текст или голосовое сообщение на английском.
free-chat-cancel-btn = ❌ Закончить диалог
free-chat-analyzing = Анализирую наш диалог, подожди немного... ⏳
free-chat-no-messages = Ты еще не отправил ни одного сообщения.
free-chat-error = Произошла ошибка при обработке сообщения. Попробуй еще раз.
free-chat-analysis-error = Не удалось сделать анализ диалога 😔
free-chat-analysis-title = 📊 <b>Анализ диалога</b>
free-chat-analysis-feedback = 💬 <b>Отзыв:</b>
free-chat-analysis-mistakes = 🛠 <b>Ошибки и исправления:</b>
free-chat-analysis-new-words = ✨ <b>Новые слова для изучения:</b>
free-chat-add-word-btn = ➕ Добавить '{$word}'
error-voice-too-large = ⚠️ Твоё голосовое сообщение слишком большое (макс. 20МБ). Пожалуйста, запиши сообщение покороче.
error-invalid-input-type = ⚠️ Извини, в этом режиме я принимаю только текстовые и голосовые сообщения.
error-qwen-no-voice = ⚠️ Модель Qwen не поддерживает голосовые сообщения. Переключитесь на Gemini или используйте текст.

## Словарь
vocabulary-empty = 📭 Твой словарь пока пуст. Начни общаться, чтобы добавить новые слова!
vocabulary-title = Мой словарь
vocabulary-word-card = 
    🇬🇧 Слово: <b>{ $word }</b>
    
    🇷🇺 Перевод:
    <blockquote>{ $translation }</blockquote>
    
    📊 Статус: <b>{ $status }</b>

vocabulary-status-learning = 🔴 Изучается
vocabulary-status-learned = ✅ Выучено
vocabulary-mark-learned = Отметить как выученное ✅
vocabulary-mark-learning = Вернуть в изучение 🔴
vocabulary-delete = Удалить слово 🗑
vocabulary-back = ⬅️ Назад
vocabulary-next = Стр { $page } ➡️
vocabulary-prev = ⬅️ Стр { $page }
vocabulary-category-learning = 🔴 Изучаемые
vocabulary-category-learned = ✅ Изученные
vocabulary-select-language = Выбери язык:
vocabulary-added-success = ✅ Добавлено

## Тест на определение уровня
determine-level-ai = Определить мой уровень с ИИ
placement-test-instructions = 🤖 Тест на определение уровня активирован!

Отправь мне текстовое или голосовое сообщение на изучаемом языке, и я проанализирую твой уровень владения языком.

Ты можешь отменить тест в любое время командой /cancel.
placement-test-result = 🎯 ИИ определил твой уровень: <b>{ $level }</b>
    💬 Отзыв: { $feedback }
placement-test-error = ❌ Не удалось определить уровень. Попробуй еще раз или выбери уровень вручную.
placement-test-cancelled = Тест на определение уровня отменен.
placement-test-analyzing = ⏳ Анализирую твои ответы...
error-model-overloaded-placement = ⚠️ Модель ИИ сейчас перегружена. Можешь попробовать еще раз или отменить тест.
placement-test-retry-btn = 🔄 Попробовать снова
placement-test-cancel-btn = ❌ Отменить тест

## Статистика и прогресс
menu-statistics = 📊 Моя статистика
stats-title = 📊 <b>Твой прогресс за неделю:</b>
stats-grammar = 📝 Грамматика: { $count } ошибок
stats-vocabulary = 📖 Словарный запас: { $count } ошибок
stats-punctuation = 📋 Пунктуация: { $count } ошибок
stats-spelling = 🔤 Правописание: { $count } ошибок
stats-total = Всего: { $count } ошибок
stats-no-data = 📭 Пока нет данных об ошибках. Начни общаться, чтобы собрать статистику!
stats-ai-report-btn = 🤖 Сгенерировать AI-отчет
stats-mega-report-btn = ⭐️ Мега-отчет
stats-history-btn = 📜 История отчетов
stats-top-weakness = 💡 Твоя самая частая проблема — { $weakness }. Хочешь разобрать примеры?
stats-report-confirm-msg = ⚠️ <b>Внимание!</b>\n\nГенерация AI-отчета использует API-запросы к выбранной вами модели ИИ.\n\nПродолжить?
stats-mega-report-confirm-msg = ⚠️ <b>Внимание!</b>\n\nМега-отчет анализирует ваши прошлые отчеты и требует как минимум 5 записей.\n\nПродолжить?
menu-settings-report-language = 📑 Язык отчетов
report-language-select = Выбери язык, на котором ИИ будет писать отчеты:
report-language-selected = ✅ Язык отчетов изменен на: { $language }

stats-report-ready-mega = <b>⭐ Мега-отчет готов!</b>
stats-report-ready-normal = <b>📊 Отчет готов!</b>

stats-report-card-details = 
    <b>{ $type }</b> ({ $date })

    🔍 <b>Слабые зоны:</b> { $weaknesses }

    💡 <b>Совет:</b>
    { $advice }

stats-type-mega = ⭐ Мега-отчет
stats-type-normal = 📊 Отчет

stats-need-more-mistakes = ⚠️ Нужно еще как минимум { $count } новых ошибок для генерации отчета.
stats-need-more-reports = ⚠️ Для Мега-отчета нужно еще { $count } новых обычных отчетов.
stats-history-title = 📜 <b>История отчетов:</b>
stats-ai-report-title = 🤖 <b>AI-анализ твоих ошибок:</b>
stats-ai-report-loading = ⏳ Анализирую твои ошибки...
stats-ai-report-error = ❌ Не удалось сгенерировать отчет. Попробуй позже.

## Обучение словам
menu-learn-words = 🎴 Учить слова
learn-word-title = 🇬🇧 Как переводится это слово?
learn-word-show-btn = 👁 Показать перевод
learn-word-know-btn = ✅ Знаю
learn-word-learn-btn = ❌ Еще учу
learn-word-next-btn = ➡️ Следующее слово
learn-word-no-words = 📭 У тебя нет слов для изучения. Добавь слова через свободный диалог!
learn-word-complete = 🎉 Отлично! Ты выучил все слова!
learn-word-progress = 📚 Изучено: { $learned } / { $total }
