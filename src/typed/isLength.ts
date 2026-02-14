import { MAX_SAFE_INTEGER } from '../internal/constants'
import { isNumber } from './isNumber'

/**
 * Checks if a value is a valid array length (integer between 0 and MAX_SAFE_INTEGER).
 * @param value The value to check
 * @returns True if the value is a valid length, false otherwise
 *
 * @example
 * isLength(3)
 * // => true
 *
 * isLength(3.14)
 * // => false
 *
 * isLength(-1)
 * // => false
 */
export function isLength(value: unknown) {
  return isNumber(value) && (value > -1 && value % 1 === 0 && value <= MAX_SAFE_INTEGER)
}
