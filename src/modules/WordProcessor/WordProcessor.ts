import { consonants, vowels, sounds, getPhonoTactics } from '@/modules/ConfigLoader/ConfigLoader'
import { DefinitionTypes } from '@/modules/DictionaryGenerator/DictionaryGenerator'

const WordProcessor = {
  replaceCumulative (text: string, changes: { [key: string]: string }) {
    for (const regex in changes) {
      text = text.replace(new RegExp(regex, 'gi'), changes[regex])
    }

    return text
  },

  transformWord (word: string, type: DefinitionTypes): string {
    return WordProcessor.replaceCumulative(word, getPhonoTactics(type)).trim()
  },

  getPronunciation (word: string): string {
    const parts = word.split(' ')
    let pronunciation = ''

    for (const part of parts) {
      const syllables = WordProcessor.getSyllables(part)
      const outputWord = (
        syllables.length > 2
          ? (syllables.splice(-2, 0, 'ˈ'), syllables)
          : syllables
      ).join(
        syllables.length === 2
          ? 'ˈ'
          : ''
      )

      pronunciation += ` ${WordProcessor.replaceCumulative(outputWord, sounds)}`
    }

    return pronunciation.trim()
  },

  getAudio: (word: string, voice: 'Giorgio' | 'Jan'): string =>
    encodeURI(`http://ipa-reader.xyz/?text=${WordProcessor.getPronunciation(word)}&voice=${voice}`),

  getSyllables: (word: string): string[] =>
    word.match(new RegExp(`[${consonants}]*[${vowels}]+(?:[${consonants}](?=[${consonants}]))?`, 'gi')) ?? []
}

export default WordProcessor
