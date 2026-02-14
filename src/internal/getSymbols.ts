import { isNil } from "../typed/isNil"
import { nativeGetSymbols, propertyIsEnumerable } from "./constants"

export function getSymbols(object: unknown) {
  if (isNil(object)) {
    return []
  }
  object = Object(object)
  return nativeGetSymbols(object).filter(symbol => propertyIsEnumerable.call(object, symbol))
}
