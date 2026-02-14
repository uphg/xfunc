import { cloneProperties } from '../internal/cloneProperties'
import { getPrototypeOf } from '../internal/constants'
import { toTypeString } from '../internal/toTypeString'
import { isObject } from '../typed/isObject'

// 复用已有的类型标签
const objectTag = '[object Object]'
const arrayTag = '[object Array]'
const argsTag = '[object Arguments]'
const mapTag = '[object Map]'
const setTag = '[object Set]'
const weakMapTag = '[object WeakMap]'
const weakSetTag = '[object WeakSet]'
const weakRefTag = '[object WeakRef]'
const functionTag = '[object Function]'
const promiseTag = '[object Promise]'
const generatorTag = '[object Generator]'

// 不可克隆的类型（浅克隆也保持原引用）
const UNCLONABLE_TYPES = new Set([
  weakMapTag, 
  weakSetTag, 
  weakRefTag, 
  functionTag, 
  promiseTag, 
  generatorTag
])

/**
 * 浅克隆一个值
 * @param value 要克隆的值
 * @returns 浅克隆后的值
 */
export function shallowClone<T>(value: T): T {
  // 1. 处理原始类型
  if (!isObject(value)) {
    return value
  }

  const tag = toTypeString(value)

  if (UNCLONABLE_TYPES.has(tag)) {
    return value
  }

  // 3. 处理 Map
  if (tag === mapTag) {
    return new Map(value as any) as T
  }

  // 4. 处理 Set
  if (tag === setTag) {
    return new Set(value as any) as T
  }

  // 5. 处理数组、对象和 arguments 对象
  if (tag === arrayTag || tag === objectTag || tag === argsTag) {
    // 创建新的容器
    const copy: any = tag === arrayTag 
      ? [] 
      : Object.create(getPrototypeOf(value))

    // 复制所有可枚举属性（包括 Symbol 属性）
    const propNames = [
      ...Object.keys(value),
      ...Object.getOwnPropertySymbols(value)
    ]

    for (const key of propNames) {
      copy[key] = (value as any)[key]
    }

    cloneProperties(value, copy)
    return copy
  }

  return value
}