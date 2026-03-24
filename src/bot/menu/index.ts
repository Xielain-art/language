import { languageMenu } from './language-menu.js'
import { selectLanguageToLearnMenu } from './select-language-to-learn.js'
import { languageLevelMenu } from './language-level-menu.js'
import { mainMenu } from './main-menu.js'

import { settingsMenu } from './settings-menu.js'
import { toneMenu } from './tone-menu.js'
import { roleplayMenu } from './roleplay-menu.js'

languageMenu.register(selectLanguageToLearnMenu)
selectLanguageToLearnMenu.register(languageLevelMenu)

mainMenu.register(roleplayMenu)
mainMenu.register(settingsMenu)
settingsMenu.register(toneMenu)

export { languageMenu, mainMenu }
