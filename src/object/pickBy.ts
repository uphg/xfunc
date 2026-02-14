import { isNil } from '../typed/isNil'
import { Key } from '../internal/interfaces'
import { getSymbols } from '../internal/getSymbols'
import { basePickBy } from '../internal/basePickBy'

/**
 * Creates a new object by picking key-value pairs where the callback returns true.
 * @param obj The source object to filter entries from
 * @param callback Function that determines whether to include each key-value pair
 * @returns A new object with the filtered entries
 *
 * @example
 * pickBy({ a: 1, b: null, c: 3 }, (value) => value !== null)
 * // => { a: 1, c: 3 }
 *
 * pickBy({ name: 'John', age: 30, active: false }, (value, key) => typeof value === 'string')
 * // => { name: 'John' }
 */
export function pickBy(obj: unknown, callback: (value: unknown, key: Key) => boolean) {
  if (isNil(obj)) return {}
  const props: Key[] = Object.keys(obj).concat(getSymbols(obj) as any)
  return basePickBy(obj, props, callback)
}
