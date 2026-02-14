import { ObjectToString } from "./constants";

/**
 * Gets the full Object.prototype.toString result of a value
 * @param value The value to check
 * @returns The full toString result (e.g., '[object Object]', '[object Array]')
 */
export function toTypeString(value: unknown): string {
  return ObjectToString.call(value)
}