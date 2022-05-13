import fs from 'fs'
import path from 'path'

import papa from 'papaparse'
import axios from 'axios'
import * as cheerio from 'cheerio'
import Iso6391 from 'iso-639-1'
import signale from 'signale'

// eslint-disable-next-line
import WordProcessor from '@/modules/WordProcessor'

export type DefinitionTypes = 'noun' | 'verb' | 'adjective' | 'adverb' | 'preposition' | 'postposition' | 'conjunction' | 'interjection' | 'pronoun' | 'article' | 'particle' | 'prefix' | 'suffix' | 'abbreviation' | 'acronym' | 'idiom' | 'other'
export interface DictionaryDefinition {
  type: DefinitionTypes
  meanings: string[]
}

interface WikiMediaItem {
  pageid: number
  title: string
  text?: string
}
interface WikiMediaResponse {
  continue?: {
    cmcontinue: string
  }
  query?: {
    [key: string]: WikiMediaItem[]
  }
  parse?: WikiMediaItem
}
interface CsvEntry {
  word: string
  type: DefinitionTypes
  meanings: string
}

const DictionaryGenerator = {
  isDefinitionTypeValid (value: string): value is DefinitionTypes {
    const allowedKeys: string[] = ['noun', 'verb', 'adjective', 'adverb', 'preposition', 'postposition', 'conjunction', 'interjection', 'pronoun', 'article', 'particle', 'prefix', 'suffix', 'abbreviation', 'acronym', 'idiom', 'other']
    return allowedKeys.includes(value.toLowerCase())
  },

  lookUpWiktionaryDefinitions (from: string, pageHtml: string): DictionaryDefinition[] {
    const $ = cheerio.load(pageHtml)
    const elements = $(
      'div[class="mw-parser-output"] > h2, div[class="mw-parser-output"] > h3, div[class="mw-parser-output"] > h4, div[class="mw-parser-output"] > ol'
    ).toArray()
    const result: DictionaryDefinition[] = []

    let tagName = ''
    let header = ''
    let currentSection = ''
    let languageFound = false

    for (const element of elements) {
      tagName = $(element).prop('tagName')
      header = $(element).find('.mw-headline').text()
      currentSection =
            tagName === 'H2' || tagName === 'H3' || tagName === 'H4'
              ? header
              : currentSection
      languageFound = tagName === 'H2' ? currentSection === Iso6391.getName(from) : languageFound

      if (languageFound && DictionaryGenerator.isDefinitionTypeValid(currentSection) && tagName === 'OL') {
        const definitionElements: any[] = $(element).find('> li').clone().toArray()
        const definitions: string[] = definitionElements.reduce(
          (prev, definitionElement) => {
            $(definitionElement).find('.HQToggle, .nyms-toggle, dl, ul').remove()

            return [
              ...prev,
              $(definitionElement)
                .text().trim().replace(/"/g, "'").replace(/\s+/g, ' ')
            ]
          },
          []
        )

        if (definitions.length !== 0) {
          result.push({
            type: currentSection.toLowerCase() as DefinitionTypes,
            meanings: definitions
          })
        }
      } else if (!languageFound && result.length > 0) {
        break
      }
    }

    return result
  },

  async lookUpDefinitions (from: string, pageHtml: string): Promise<DictionaryDefinition[]> {
    return DictionaryGenerator.lookUpWiktionaryDefinitions(from, pageHtml)
  },

  async buildDictionary (from: string, fileName: string): Promise<void> {
    const readStream = fs.createReadStream(
      path.resolve('./src/wordlists', `${fileName}.${from}.wiktionary.csv`)
    )
    const writeStream = fs.createWriteStream(
      path.resolve('./build/dictionary', `${fileName}.futuristic.md`)
    )

    writeStream.write('# Dictionary \n')
    writeStream.write('|Word|Pronunciation|Audio|Original Word|Type|Definitions|\n')
    writeStream.write('|:--|:--|:--|:--|:--|:--|\n')

    await new Promise((resolve, reject) =>
      papa.parse(readStream, {
        worker: true,
        header: true,
        skipEmptyLines: 'greedy',
        transformHeader: header => header.trim(),
        transform: value => value.trim(),
        step: async ({ data: line }: { data: CsvEntry }) => {
          if (line.type !== 'adjective' && line.type !== 'adverb' && line.type !== 'noun') return

          const meanings = line.meanings.replace(/"/g, '').split(' | ')
          const outputWord = WordProcessor.transformWord(line.word, line.type)

          writeStream.write(
              `|**${outputWord}**|/${WordProcessor.getPronunciation(outputWord)}/|[🍕](${WordProcessor.getAudio(outputWord, 'Giorgio')}) [🍸](${WordProcessor.getAudio(outputWord, 'Jan')})|${line.word}|${
                line.type
              }|${meanings.length > 1 ? `<ol><li>${meanings.join('</li><li>')}</li></ol>` : meanings[0]}|\n`
          )
        },
        complete: resolve,
        error: reject
      })
    )

    writeStream.end()
  },

  async buildWordListFromWiktionary (from: string, fileName: string): Promise<void> {
    const languageName = Iso6391.getName(from)
    const outputFileName = `${fileName}.${from}.wiktionary.csv`

    console.log('')
    signale.debug(`Creating ${languageName} word list from Wiktionary into ${outputFileName}`)
    console.log('')

    const writeStream = fs.createWriteStream(
      path.resolve('./src/wordlists', outputFileName)
    )

    let response: { data: WikiMediaResponse } = { data: {} }
    let continueQuery = ''

    writeStream.write('word, type, meanings\n')

    do {
      try {
        response = await axios.get(
          encodeURI(`https://en.wiktionary.org/w/api.php?action=query&list=categorymembers&cmtitle=Category:${languageName}_lemmas&cmlimit=max&cmtype=page&format=json&cmcontinue=${continueQuery}`))
        continueQuery = response.data.continue?.cmcontinue ?? ''

        const members = response.data.query?.categorymembers ?? []

        for (const member of members) {
          response = await axios.get(
            encodeURI(`https://en.wiktionary.org/w/api.php?action=parse&pageid=${member.pageid}&prop=text&formatversion=2&format=json`))

          const { title = '', text = '' } = response.data.parse ?? {}
          const definitions = await DictionaryGenerator.lookUpDefinitions(from, text)

          for (const definition of definitions) {
            const meanings = definition.meanings.join(' | ')
            const delimiter = meanings.includes(',') ? '"' : ''

            writeStream.write(
                `${title},${definition.type},${delimiter}${meanings}${delimiter}\n`
            )
          }

          signale.success(`Writing down word (${member.title})`)
        }
      } catch (error) {
        signale.fatal(error)
      }
    } while (continueQuery !== '')

    writeStream.end()

    console.log('')
    signale.debug('Created word list')
    console.log('')
  },

  async buildWordList (from: string, fileName: string, source: 'wiktionary' | 'glosbe'): Promise<void> {
    return await DictionaryGenerator.buildWordListFromWiktionary(from, fileName)
  }
}

export default DictionaryGenerator
