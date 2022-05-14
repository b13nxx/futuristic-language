import { DefinitionTypes } from '@/modules/DictionaryGenerator/DictionaryGenerator'

export interface PhonoTactics { [key: string]: string }

export const consonants = 'bcdfghjklmnprstvxyz'
export const vowels = 'aeiou'
export const sounds: { [key: string]: string } = {
  a: 'ɑ',
  b: 'b',
  c: 'd͡ʒ',
  d: 'd',
  e: 'ɛ',
  f: 'f',
  g: 'g',
  h: 'h',
  i: 'i',
  j: 't͡ʃ',
  k: 'k',
  l: 'l',
  m: 'm',
  n: 'n',
  o: 'ɔ',
  p: 'p',
  r: 'ɾ',
  s: 's',
  t: 't̪',
  u: 'u',
  v: 'v',
  x: 'ʃ',
  y: 'j',
  z: 'z'
}
export const endings: { [key: string]: string } = {
  adjective: 'o',
  adverb: 'o',
  verb: 'a',
  noun: 'i'
}

export const getPhonoTactics = (type: DefinitionTypes): PhonoTactics => ({
  // normalizing phonomos
  c: 'k',
  j: 'h',
  ñ: 'ny',
  ü: 'u',

  // normalizing digraphs
  ll: 'y',
  rr: 'r',
  tx: 'j',
  dd: 'g',
  tt: 'k',
  ts: 's',
  tz: 'z',

  // normalizing max consecutive sounds (4 for consonants, 3 for vowels)
  [`([${consonants}]{2})[${consonants}](?=[${consonants}])`]: '$1', // replacing 4 consecutive consonants (abstraktu => absraktu)
  [`([${vowels}])[${vowels}]([${vowels}])`]: '$1s$2', // replacing 3 consecutive vowels (aleluia => alelusa)

  // special case need to look AFTER normalizing max consecutive sounds
  sh: 'x', // lipshitzar => lipxitzar
  ch: 'j', // china => jina
  sz: 's', // osziloskopio => osiloskopio

  [`([${consonants}])[${consonants}](?=[${consonants}])`]: '$1', // replacing 3 consecutive consonants (umezurztegi => umezurtegi)
  [`([${vowels}])[${vowels}]`]: '$1', // replacing 2 consecutive vowels (adberbio => adberbi)

  // normalizing word endings
  [`([${vowels}])$`]: `${endings[type] ?? 'e'}`, // replacing last vowel sound of the word according the type (angelu => angeli)
  [`([^${vowels}])$`]: `$1${endings[type] ?? 'e'}`, // replacing last consonant sound of the word according the type (adibidez => adibidezo)

  // special case need to look AFTER normalizing word endings
  [`^([${consonants}])([${consonants}])`]: '$1i$2' // replacing 2 consecutive consonants at the beginning of the word (dromedario => diromedario)
})
