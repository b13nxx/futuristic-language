import { consonants, vowels, sounds, getPhonoTactics } from '@/modules/ConfigLoader'
import { DefinitionTypes } from '@/modules/DictionaryGenerator'

const WordProcessor = {
  replaceCumulative (text: string, changes: { [key: string]: string }) {
    for (const regex in changes) {
      text = text.replace(new RegExp(regex, 'gi'), changes[regex])
    }

    return text
  },

  transformWord (word: string, type: DefinitionTypes): string {
    return WordProcessor.replaceCumulative(word, getPhonoTactics(type))
  },

  getPronunciation (word: string): string {
    const syllables = WordProcessor.getSyllables(word)
    const outputWord = (
      syllables.length > 2
        ? (syllables.splice(-2, 0, 'ˈ'), syllables)
        : syllables
    ).join(
      syllables.length === 2
        ? 'ˈ'
        : ''
    )

    return WordProcessor.replaceCumulative(outputWord, sounds)
  },

  getAudio: (word: string, voice: 'Giorgio' | 'Jan'): string =>
    encodeURI(`http://ipa-reader.xyz/?text=${WordProcessor.getPronunciation(word)}&voice=${voice}`),

  getSyllables: (word: string): string[] =>
    word.match(new RegExp(`[${consonants} ]*[${vowels}]+(?:[${consonants}](?=[${consonants}]))?`, 'gi')) ?? []
}

export default WordProcessor
