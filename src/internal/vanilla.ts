import { isNil } from '../typed/isNil'

// Returns a boolean indicating whether the specified property is enumerable (can be enumerated by for...in loop)
const propertyIsEnumerable = Object.prototype.propertyIsEnumerable

// Method returns an array of all Symbol properties of a given object itself
const nativeGetSymbols = Object.getOwnPropertySymbols

// Get all enumerable Symbol keys of current object
export function getSymbols(object: unknown) {
  if (isNil(object)) {
    return []
  }
  object = Object(object)
  return nativeGetSymbols(object).filter(symbol => propertyIsEnumerable.call(object, symbol))
}


