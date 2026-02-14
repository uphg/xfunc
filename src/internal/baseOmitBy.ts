import { Key } from '../internal/interfaces'
import { getSymbols } from './getSymbols'

export function baseOmitBy(obj: any, callback: (_value: unknown, _key: Key) => boolean) {
  const result: { [k: Key]: unknown } = {}
  const props: Key[] = Object.keys(obj).concat(getSymbols(obj) as any)

  for (const key of props) {
    const value = obj[key]
    if (!callback(value, key)) {
      result[key] = value
    }
  }
  return result
}
