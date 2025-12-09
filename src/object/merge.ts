import { hasOwn } from './hasOwn'

type MergeTwo<T, U> = {
  [K in keyof T & keyof U]:
  T[K] extends any[]
    ? U[K] extends any[]
      ? [...T[K], ...U[K]]
      : U[K]
    : T[K] extends object
      ? U[K] extends object
        ? MergeTwo<T[K], U[K]>
        : U[K]
      : U[K]
} & Omit<T, keyof U> & Omit<U, keyof T>

type MergeAll<T extends readonly any[]>
  = T extends readonly [infer F, ...infer R]
    ? MergeTwo<F, MergeAll<R>>
    : {}

// 函数签名
export function merge<T extends object>(target: T): T
export function merge<T extends object, const Sources extends readonly object[]>(
  target: T,
  ...sources: Sources
): MergeTwo<T, MergeAll<Sources>>
export function merge(target: any, ...sources: any[]): any {
  if (!sources.length) {
    return target
  }

  const [source, ...rest] = sources

  if (isMergeObject(target) && isMergeObject(source)) {
    for (const key in source) {
      if (hasOwn(source, key)) {
        mergeProperty(target, source, key)
      }
    }

    const symbols = Object.getOwnPropertySymbols(source)
    for (const sym of symbols) {
      if (hasOwn(source, sym)) {
        mergeProperty(target, source, sym)
      }
    }
  } else if (isMergeObject(target) && source !== undefined) {
    return target
  }

  return merge(target, ...rest)
}

function mergeProperty(target: any, source: any, key: PropertyKey) {
  const sourceValue = source[key]
  const targetValue = target[key]

  if (isMergeObject(sourceValue)) {
    if (!isMergeObject(targetValue)) {
      target[key] = {}
    }
    merge(target[key], sourceValue)
  } else if (Array.isArray(sourceValue)) {
    if (Array.isArray(targetValue)) {
      target[key] = [...targetValue, ...sourceValue]
    } else {
      target[key] = [...sourceValue]
    }
  } else {
    target[key] = sourceValue
  }
}

function isMergeObject(value: any): boolean {
  return value !== null
    && typeof value === 'object'
    && !Array.isArray(value)
    && !(value instanceof Date)
}
