import type { TypedArray } from './interfaces';

export function cloneTypedArray(value: TypedArray): TypedArray {
  return value.slice()
}
