import { ObjectToString } from '../internal/constants'

export function isTypeString(value: unknown, type: string) {
  return ObjectToString.call(value) === `[object ${type}]`
}
