import { languageMenu } from './language-menu.js'
import { selectLanguageToLearnMenu } from './select-language-to-learn.js'
import { languageLevelMenu } from './language-level-menu.js'
import { mainMenu } from './main-menu.js'

languageMenu.register(selectLanguageToLearnMenu)
selectLanguageToLearnMenu.register(languageLevelMenu)

export { languageMenu, mainMenu }