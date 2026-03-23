import { languageMenu } from './language-menu.js'
import { languageLevelMenu } from './language-level-menu.js'
import { startMenu } from './start-menu.js'
import { selectLanguageToLearnMenu } from './select-language-to-learn.js'

startMenu.register(languageLevelMenu)
startMenu.register(selectLanguageToLearnMenu)

languageMenu.register(startMenu)

export { languageMenu }
