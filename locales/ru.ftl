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
free-chat-activated = 🎙 Режим свободного диалога активирован!\n\nОтправь мне текст или голосовое сообщение на английском.
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
