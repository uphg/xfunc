import { toTypeString } from '../internal/toTypeString'
import { initCloneObject } from '../internal/initCloneObject'
import { cloneArrayBuffer } from '../internal/cloneArrayBuffer'
import { cloneDataView } from '../internal/cloneDataView'
import { cloneTypedArray } from '../internal/cloneTypedArray'
import { cloneProperties } from '../internal/cloneProperties'
import { getPrototypeOf } from '../internal/constants'
import { isObject } from '../typed/isObject'
import type { TypedArray } from '../internal/interfaces'

type CacheMap = Map<any, any>
type CtorType<T> = new (...args: any[]) => T

const objectTag = '[object Object]'
const numberTag = '[object Number]'
const stringTag = '[object String]'
const booleanTag = '[object Boolean]'
const dateTag = '[object Date]'
const regExpTag = '[object RegExp]'
const mapTag = '[object Map]'
const setTag = '[object Set]'
const weakMapTag = '[object WeakMap]'
const weakSetTag = '[object WeakSet]'
const weakRefTag = '[object WeakRef]'
const functionTag = '[object Function]'
const arrayTag = '[object Array]'
const argsTag = '[object Arguments]'
const arrayBufferTag = '[object ArrayBuffer]'
const dataViewTag = '[object DataView]'
const float32Tag = '[object Float32Array]'
const float64Tag = '[object Float64Array]'
const int8Tag = '[object Int8Array]'
const int16Tag = '[object Int16Array]'
const int32Tag = '[object Int32Array]'
const uint8Tag = '[object Uint8Array]'
const uint8ClampedTag = '[object Uint8ClampedArray]'
const uint16Tag = '[object Uint16Array]'
const uint32Tag = '[object Uint32Array]'
const promiseTag = '[object Promise]'
const generatorTag = '[object Generator]'

// 不可克隆的类型
const UNCLONABLE_TYPES = new Set([weakMapTag, weakSetTag, weakRefTag, functionTag, promiseTag, generatorTag])

function initTypeObject(value: any): any {
  if (!isObject(value)) return value

  const tag = toTypeString(value)

  if (UNCLONABLE_TYPES.has(tag)) {
    return value
  }

  const Ctor = value.constructor as CtorType<any>

  switch (tag) {
    case arrayBufferTag:
      return cloneArrayBuffer(value as ArrayBuffer)

    case booleanTag:
    case dateTag:
      return new Ctor(+value)

    case dataViewTag:
      return cloneDataView(value as DataView)

    case float32Tag:
    case float64Tag:
    case int8Tag:
    case int16Tag:
    case int32Tag:
    case uint8Tag:
    case uint8ClampedTag:
    case uint16Tag:
    case uint32Tag:
      return cloneTypedArray(value as TypedArray)

    case numberTag:
    case stringTag:
      return new Ctor(value)

    case regExpTag: {
      const regExpValue = value as RegExp
      // ES2021 支持 RegExp 的 dotAll 和 unicode 属性
      const flags = regExpValue.flags || (regExpValue.global ? 'g' : '')
        + (regExpValue.ignoreCase ? 'i' : '')
        + (regExpValue.multiline ? 'm' : '')
        + (regExpValue.dotAll ? 's' : '') // ES2018
        + (regExpValue.unicode ? 'u' : '')
        + (regExpValue.sticky ? 'y' : '')
      return new RegExp(regExpValue.source, flags)
    }

    case mapTag:
      return new Map()

    case setTag:
      return new Set()

    case arrayTag:
      return new Ctor((value as any[]).length)

    case objectTag:
    case argsTag:
      return initCloneObject(value)

    default:
      // 对于其他类型，尝试使用构造函数
      try {
        return new Ctor(value)
      } catch {
        return Object.create(getPrototypeOf(value))
      }
  }
}

export function cloneDeep<T>(value: T): T {
  if (!isObject(value)) return value

  const cache: CacheMap = new Map()

  const root = initTypeObject(value)
  cache.set(value, root)

  const stack: Array<[any, any]> = [[value, root]]

  while (stack.length) {
    const [source, copy] = stack.pop()! // 使用 pop 而不是 shift 提高性能
    const tag = toTypeString(source)

    if (UNCLONABLE_TYPES.has(tag)) continue

    if (tag === mapTag || tag === setTag) {
      const iterator = source[Symbol.iterator]()
      let entry = iterator.next()

      while (!entry.done) {
        let key: any, value: any

        if (tag === mapTag) {
          [key, value] = entry.value
        } else {
          value = entry.value
        }

        if (tag === mapTag) {
          if (cache.has(key)) {
            key = cache.get(key)
          } else if (isObject(key)) {
            const newKey = initTypeObject(key)
            cache.set(key, newKey)
            stack.push([key, newKey])
            key = newKey
          }
        }

        if (cache.has(value)) {
          value = cache.get(value)
        } else if (isObject(value)) {
          const newValue = initTypeObject(value)
          cache.set(value, newValue)
          stack.push([value, newValue])
          value = newValue
        }

        if (tag === mapTag) {
          copy.set(key, value)
        } else {
          copy.add(value)
        }

        entry = iterator.next()
      }
    } else {
      const propNames = [
        ...Object.keys(source),
        ...Object.getOwnPropertySymbols(source)
      ]

      for (const key of propNames) {
        const value = source[key]

        if (cache.has(value)) {
          copy[key] = cache.get(value)
        } else if (isObject(value)) {
          const newValue = initTypeObject(value)
          cache.set(value, newValue)
          stack.push([value, newValue])
          copy[key] = newValue
        } else {
          copy[key] = value
        }
      }

      // ES2021：复制属性的描述符
      cloneProperties(source, copy)
    }

    // ES2021：复制原型链
    Object.setPrototypeOf(copy, getPrototypeOf(source))
  }

  return root as T
}
