## Base Commands
start = 
    👋 Hello, { $name }! 
    I'm your AI Language Tutor. I'll help you speak fluently.
    
    Send me **voice messages**, and I will correct your mistakes in real-time.
    
    To start, please select your level below:

language = Select interface language:
setcommands = Bot commands have been updated.

## Welcome and Status
welcome = Welcome to FluentAI! 🚀
welcome-back = Welcome back!

## Settings
language-select = Please, select your language:
language-changed = Language successfully changed!
language-level-title = Select your language level:

## Errors
admin-commands-updated = Commands updated.
unhandled = Unrecognized command. Try /start or send me a voice message.

## FluentAI Specific
level-selected = Level { $level } set! Now choose a scenario or just start talking.
low-balance = ⚠️ You've run out of free messages. Go to your profile to upgrade to Premium.
word-added = ✨ Added "{$word}" to your vocabulary.

## Main Menu
menu-main-title = 📱 Main Menu:
menu-main-profile = 
    👤 <b>Your Profile:</b>
    🎯 Target Language: <b>{ $target_lang }</b>
    📊 Level: <b>{ $level }</b>
    🗣 Tutor Tone: <b>{ $tone }</b>
    
    Choose an action below 👇

menu-main-vocabulary = 📚 Vocabulary ({ $count })
menu-main-free-chat = 💬 Free Chat
menu-main-settings = ⚙️ Settings

menu-settings-tone = 🎭 Roleplay & Tone
menu-settings-language = 🌐 Target Language
menu-settings-level = 📊 Language Level
menu-settings-analysis-tone = 📊 Analysis Tone
menu-settings-ui-language = 🌐 Interface Language

menu-free-chat = 🎙 Free Chat
menu-roles = 🎭 Scenarios
menu-vocabulary = 📚 My Vocabulary
menu-settings = ⚙️ Settings
menu-about = ℹ️ About / Help

## About
about-text = 
    🤖 <b>About FluentAI</b>
    
    I am your personal AI tutor designed to help you practice foreign languages through natural conversation.
    
    🚀 <b>How to use:</b>
    1. Select a language and level in Settings.
    2. Start 🎙 <b>Free Chat</b> to talk about anything.
    3. Use 🎭 <b>Scenarios</b> for specific situations.
    4. Send <b>Voice Messages</b> - I will listen and correct your mistakes!
    
    📢 <b>Support:</b> @support_channel

## Menu Notifications
in-development = 🚧 This feature is still in development!

language-to-learn = 🎯 Which language do you want to learn?
language-level = 📊 Select your current level:

## Free Chat
free-chat-activated = 🎙 Free Chat mode activated!\n\nSend me a text or a voice message in English.
free-chat-cancel-btn = ❌ End dialogue
free-chat-analyzing = Analyzing our dialogue, please wait... ⏳
free-chat-no-messages = You haven't sent any messages yet.
free-chat-error = An error occurred processing your message. Please try again.
free-chat-analysis-error = Failed to analyze the dialogue 😔
free-chat-analysis-title = 📊 <b>Dialogue Analysis</b>
free-chat-analysis-feedback = 💬 <b>Feedback:</b>
free-chat-analysis-mistakes = 🛠 <b>Mistakes & Corrections:</b>
free-chat-analysis-new-words = ✨ <b>New words for learning:</b>
free-chat-add-word-btn = ➕ Add '{$word}'
error-voice-too-large = ⚠️ Your voice message is too large (max 20MB). Please record a shorter one.
error-invalid-input-type = ⚠️ Sorry, I only accept text and voice messages in this mode.

## Vocabulary
vocabulary-empty = 📭 Your vocabulary is empty. Start chatting to add new words!
vocabulary-title = My Vocabulary
vocabulary-word-card =
    🇬🇧 Word: <b>{ $word }</b>
    
    🇷🇺 Translation:
    <blockquote>{ $translation }</blockquote>
    
    📊 Status: <b>{ $status }</b>

vocabulary-status-learning = 🔴 Studying
vocabulary-status-learned = ✅ Learned
vocabulary-mark-learned = Mark as Learned ✅
vocabulary-mark-learning = Mark as Learning 🔴
vocabulary-delete = Delete Word 🗑
vocabulary-back = ⬅️ Back
vocabulary-next = Pg { $page } ➡️
vocabulary-prev = ⬅️ Pg { $page }
vocabulary-category-learning = 🔴 Studying
vocabulary-category-learned = ✅ Learned
vocabulary-select-language = Select language:
vocabulary-added-success = ✅ Added
