import minimist from 'minimist'
import DictionaryGenerator from '@/modules/DictionaryGenerator'

const options = minimist(process.argv.slice(2))

export async function buildWordList (cb: () => void): Promise<void> {
  await DictionaryGenerator.buildWordList(options.from, options.fileName, options.source)

  cb()
}

export async function buildDictionary (cb: () => void): Promise<void> {
  await DictionaryGenerator.buildDictionary(options.from, options.fileName)

  cb()
}
