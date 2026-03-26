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
error-user-not-found = User not found. Please use /start to register.
error-saving-vocabulary = Error saving vocabulary!
error-unexpected = An unexpected error occurred.
error-saving-selection = Error saving selection!
error-starting-session = Error starting session!
setup-required = ⚠️ Please complete the setup first to access this feature.

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
menu-settings-ai-model = 🤖 AI Model
ai-model-select = Select AI Model
ai-model-selected = ✅ Model selected: { $model }
error-model-overloaded = ⚠️ The selected AI model is currently overloaded. Please try again later or switch to another model.
switch-ai-model-btn = 🤖 Switch AI Model
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
error-qwen-no-voice = ⚠️ Qwen model doesn't support voice messages. Please switch to Gemini or use text.

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

## Placement Test
determine-level-ai = Determine my level with AI
placement-test-instructions = 🤖 AI Level Test activated!

Send me a text or voice message in your target language, and I will analyze your proficiency level.

You can cancel anytime with /cancel.
placement-test-result = 🎯 AI determined your level: <b>{ $level }</b>
    
    💬 Feedback: { $feedback }
placement-test-error = ❌ Failed to determine level. Please try again or select your level manually.
placement-test-cancelled = Placement test cancelled.
placement-test-analyzing = ⏳ Analyzing your responses...
error-model-overloaded-placement = ⚠️ The AI model is currently overloaded. You can try again or cancel the test.
placement-test-retry-btn = 🔄 Try Again
placement-test-cancel-btn = ❌ Cancel Test

## Statistics and Progress
menu-statistics = 📊 My Statistics
stats-title = 📊 <b>Your weekly progress:</b>
stats-grammar = 📝 Grammar: { $count } mistakes
stats-vocabulary = 📖 Vocabulary: { $count } mistakes
stats-punctuation = 📋 Punctuation: { $count } mistakes
stats-spelling = 🔤 Spelling: { $count } mistakes
stats-total = Total: { $count } mistakes
stats-no-data = 📭 No mistake data yet. Start chatting to collect statistics!
stats-ai-report-btn = 🤖 Generate AI Report
stats-mega-report-btn = ⭐️ Mega Report
stats-history-btn = 📜 Reports History
stats-top-weakness = 💡 Your most frequent issue is { $weakness }. Want to review examples?
stats-report-confirm-msg = ⚠️ <b>Warning!</b>\n\nGenerating an AI report uses API requests to your selected AI model.\n\nProceed?
stats-mega-report-confirm-msg = ⚠️ <b>Warning!</b>\n\nMega report analyzes your past reports and requires at least 5 entries.\n\nProceed?
menu-settings-report-language = 📑 Report Language
report-language-select = Select the language for AI reports:
report-language-selected = ✅ Report language changed to: { $language }

stats-report-ready-mega = <b>⭐ Mega Report is ready!</b>
stats-report-ready-normal = <b>📊 Report is ready!</b>

stats-report-card-details = 
    <b>{ $type }</b> ({ $date })

    🔍 <b>Weaknesses:</b> { $weaknesses }

    💡 <b>Advice:</b>
    { $advice }

stats-type-mega = ⭐ Mega Report
stats-type-normal = 📊 Report

stats-need-more-mistakes = ⚠️ You need at least { $count } more new mistakes to generate a report.
stats-need-more-reports = ⚠️ You need { $count } more regular reports for a Mega Report.
stats-history-title = 📜 <b>Reports History:</b>
stats-ai-report-title = 🤖 <b>AI Analysis of Your Mistakes:</b>
stats-ai-report-loading = ⏳ Analyzing your mistakes...
stats-ai-report-error = ❌ Failed to generate report. Please try again later.

## Learn Words
menu-learn-words = 🎴 Learn Words
learn-word-title = 🇬🇧 What does this word mean?
learn-word-show-btn = 👁 Show Translation
learn-word-know-btn = ✅ I Know
learn-word-learn-btn = ❌ Still Learning
learn-word-next-btn = ➡️ Next Word
learn-word-no-words = 📭 You have no words to learn. Add words through free chat!
learn-word-complete = 🎉 Great job! You've learned all words!
learn-word-progress = 📚 Learned: { $learned } / { $total }

## Grammar
menu-grammar = 📖 Grammar
grammar-explain-rule-btn = 📖 Explain a Rule
grammar-quiz-btn = 🎯 Grammar Quiz
grammar-weakness-btn = 🔍 Analyze My Weakness
grammar-loading = ⏳ Loading...
grammar-error = ❌ Failed to load grammar content. Please try again.
grammar-correct = Correct!
grammar-incorrect = Incorrect!
grammar-no-data = 📭 No mistake data yet. Start chatting to collect statistics!

## Vocabulary Quiz
menu-vocabulary-quiz = 🎴 Vocabulary Quiz
vocabulary-quiz-show-btn = 👁 Show Word
vocabulary-quiz-skip-btn = ⏭ Skip
vocabulary-quiz-next-btn = ➡️ Next Word
vocabulary-quiz-correct = Correct!
vocabulary-quiz-incorrect = Incorrect!
vocabulary-quiz-no-words = 📭 You have no words to practice. Add words through free chat!

## Vocabulary Spelling
menu-vocabulary-spelling = 🔤 Spelling Practice
vocabulary-spelling-start-btn = 🔤 Start Practice
vocabulary-spelling-skip-btn = ⏭ Skip
vocabulary-spelling-cancel-btn = ❌ Cancel
vocabulary-spelling-next-btn = ➡️ Next Word
vocabulary-spelling-correct = Correct!
vocabulary-spelling-incorrect = Incorrect!
vocabulary-spelling-no-words = 📭 You have no words to practice. Add words through free chat!
vocabulary-spelling-error = ❌ An error occurred. Please try again.
grammar-options-label = Choose the correct answer:
operation-cancelled = ✅ Operation cancelled. You can start a new action.
