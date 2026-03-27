import { onboardingLevelMenu, settingsLevelMenu } from './language-level-menu.js'
import { languageMenu, selectLanguageMenu } from './language-menu.js'
import { mainMenu } from './main-menu.js'

export * from './main-menu.js'
import { roleplayMenu } from './roleplay-menu.js'

import { selectLanguageToLearnMenu } from './select-language-to-learn.js'
import { settingsMenu, settingsCommunicationMenu, settingsEducationMenu, settingsSystemMenu } from './settings-menu.js'
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

// Settings Hierarchy with new submenus
settingsMenu.register(settingsCommunicationMenu)
settingsMenu.register(settingsEducationMenu)
settingsMenu.register(settingsSystemMenu)

// Communication Settings
settingsCommunicationMenu.register(toneMenu)
settingsCommunicationMenu.register(analysisToneMenu)
settingsCommunicationMenu.register(voiceSettingsMenu)

// Education Settings
settingsEducationMenu.register(languageSettingsMenu)
settingsEducationMenu.register(settingsLevelMenu)
settingsEducationMenu.register(reportLanguageMenu)

// System Settings
settingsSystemMenu.register(aiModelMenu)
settingsSystemMenu.register(uiLanguageMenu)

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
