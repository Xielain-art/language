import { languageLevelMenu } from './language-level-menu.js'
import { languageMenu } from './language-menu.js'
import { mainMenu } from './main-menu.js'
import { roleplayMenu } from './roleplay-menu.js'

import { selectLanguageToLearnMenu } from './select-language-to-learn.js'
import { settingsMenu } from './settings-menu.js'
import { toneMenu } from './tone-menu.js'

languageMenu.register(selectLanguageToLearnMenu)
selectLanguageToLearnMenu.register(languageLevelMenu)

mainMenu.register(roleplayMenu)
mainMenu.register(settingsMenu)

settingsMenu.register(languageLevelMenu)

export { languageMenu, mainMenu }
