const hyphenateRE = /\B([A-Z])/g

/**
 * Converts a camelCase string to hyphenated (kebab-case).
 * Uses caching for better performance with repeated calls.
 * @private
 * @param str The camelCase string to convert
 * @returns The hyphenated string
 *
 * @example
 * hyphenate('fooBar')
 * // => 'foo-bar'
 *
 * hyphenate('fooBarBaz')
 * // => 'foo-bar-baz'
 */
export function hyphenate(str: string): string {
  return str.replace(hyphenateRE, '-$1').toLowerCase()
}
