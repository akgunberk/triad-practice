export type StringSet = 'I' | 'II' | 'III' | 'IV'

export interface StringSetInfo {
  id: StringSet
  name: string
  strings: string
  stringNumbers: number[]
}

export const STRING_SETS: StringSetInfo[] = [
  { id: 'I', name: 'Set I', strings: 'EBG', stringNumbers: [1, 2, 3] },
  { id: 'II', name: 'Set II', strings: 'BGD', stringNumbers: [2, 3, 4] },
  { id: 'III', name: 'Set III', strings: 'GDA', stringNumbers: [3, 4, 5] },
  { id: 'IV', name: 'Set IV', strings: 'DAE', stringNumbers: [4, 5, 6] },
]
