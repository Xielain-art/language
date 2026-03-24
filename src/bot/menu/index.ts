import { onboardingLevelMenu, settingsLevelMenu } from './language-level-menu.js'
import { languageMenu, selectLanguageMenu } from './language-menu.js'
import { mainMenu } from './main-menu.js'

export * from './main-menu.js'
import { roleplayMenu } from './roleplay-menu.js'

import { selectLanguageToLearnMenu } from './select-language-to-learn.js'
import { settingsMenu } from './settings-menu.js'
import { toneMenu } from './tone-menu.js'
import { vocabularyLanguageMenu, vocabularyMenu, vocabularyWordsMenu, wordCardMenu } from './vocabulary-menu.js'

languageMenu.register(selectLanguageMenu)
selectLanguageMenu.register(selectLanguageToLearnMenu)
selectLanguageToLearnMenu.register(onboardingLevelMenu)

mainMenu.register(roleplayMenu)
mainMenu.register(settingsMenu)
mainMenu.register(vocabularyMenu)
vocabularyMenu.register(vocabularyLanguageMenu)
vocabularyLanguageMenu.register(vocabularyWordsMenu)
vocabularyWordsMenu.register(wordCardMenu)

settingsMenu.register(settingsLevelMenu)

export { languageMenu, mainMenu }
