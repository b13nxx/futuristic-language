import fs from 'fs'
import DictionaryGenerator from '@/modules/DictionaryGenerator/DictionaryGenerator'

jest.mock('fs', () => ({
  createReadStream: jest.requireActual('fs').createReadStream,
  createWriteStream: jest.fn()
}))

test('Should buildDictionary for', async () => {
  (fs.createWriteStream as jest.Mock).mockImplementation(() => ({
    write: jest.fn(),
    end: jest.fn()
  }))

  const entries = await DictionaryGenerator.buildDictionary('eu', 'words')

  for (const subCategory in entries) {
    for (const word of entries[subCategory]) {
      expect(word).toMatchSnapshot(` word: ${word.originWord} type: ${word.type} meanings: ${word.meanings}`)
    }
  }
})
