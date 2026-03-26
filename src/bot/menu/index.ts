import { onboardingLevelMenu, settingsLevelMenu } from './language-level-menu.js'
import { languageMenu, selectLanguageMenu } from './language-menu.js'
import { mainMenu } from './main-menu.js'

export * from './main-menu.js'
import { roleplayMenu } from './roleplay-menu.js'

import { selectLanguageToLearnMenu } from './select-language-to-learn.js'
import { settingsMenu } from './settings-menu.js'
import { toneMenu } from './tone-menu.js'
import { analysisToneMenu } from './analysis-tone-menu.js'
import { languageSettingsMenu } from './language-settings-menu.js'
import { uiLanguageMenu } from './ui-language-menu.js'
import { aiModelMenu } from './ai-model-menu.js'
import { reportLanguageMenu } from './report-language-menu.js'
import { voiceSettingsMenu, voiceIdMenu } from './voice-settings-menu.js'
import { vocabularyLanguageMenu, vocabularyMenu, vocabularyWordsMenu, wordCardMenu, learnWordsMenu, learnWordActionsMenu } from './vocabulary-menu.js'
import { aboutMenu } from './about-menu.js'
import { statisticsMenu } from './statistics-menu.js'
import { grammarMenu, grammarQuizMenu } from './grammar-menu.js'
import { vocabularyQuizMenu, vocabularyQuizAnswerMenu, vocabularyQuizContinueMenu } from './vocabulary-quiz-menu.js'
import { vocabularySpellingMenu } from './vocabulary-spelling-menu.js'

// --- Registration Hierarchy ---

// Onboarding Flow
languageMenu.register(selectLanguageMenu)
selectLanguageMenu.register(selectLanguageToLearnMenu)
selectLanguageToLearnMenu.register(onboardingLevelMenu)

// Main Menu & Submenus
mainMenu.register(roleplayMenu)
mainMenu.register(settingsMenu)
mainMenu.register(vocabularyMenu)
mainMenu.register(aboutMenu)
mainMenu.register(statisticsMenu)

// Settings Hierarchy
settingsMenu.register(toneMenu)
settingsMenu.register(analysisToneMenu)
settingsMenu.register(languageSettingsMenu)
settingsMenu.register(uiLanguageMenu)
settingsMenu.register(settingsLevelMenu)
settingsMenu.register(aiModelMenu)
settingsMenu.register(reportLanguageMenu)
settingsMenu.register(voiceSettingsMenu)

// Vocabulary Hierarchy
vocabularyMenu.register(vocabularyLanguageMenu)
vocabularyLanguageMenu.register(vocabularyWordsMenu)
vocabularyWordsMenu.register(wordCardMenu)
vocabularyMenu.register(learnWordsMenu)
learnWordsMenu.register(learnWordActionsMenu)
vocabularyMenu.register(grammarMenu)
vocabularyMenu.register(vocabularyQuizMenu)
vocabularyMenu.register(vocabularySpellingMenu)

export { languageMenu, mainMenu }
