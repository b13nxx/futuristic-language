import { getPhonoTactics, sounds } from '@/modules/ConfigLoader'
import { DefinitionTypes } from '@/modules/DictionaryGenerator'

const WordProcessor = {
  replaceCumulative (text: string, changes: { [key: string]: string }) {
    for (const regex in changes) {
      text = text.replace(new RegExp(regex, 'g'), changes[regex])
    }

    return text
  },

  transformWord (word: string, type: DefinitionTypes): string {
    return WordProcessor.replaceCumulative(word, getPhonoTactics(type))
  },

  getPronunciation (word: string): string {
    return WordProcessor.replaceCumulative(word, sounds)
  },

  getAudio (word: string): string {
    return encodeURI(`http://ipa-reader.xyz/?text=${WordProcessor.getPronunciation(word)}&voice=Giorgio`)
  }
}

export default WordProcessor
