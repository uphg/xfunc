import { isPrototype } from './isPrototype'
import { getPrototypeOf } from './constants';

export function initCloneObject(value: object): object {
  const proto = getPrototypeOf(value)
  const Ctor = value.constructor
  
  if (typeof Ctor === 'function' && Ctor !== Object && !isPrototype(value)) {
    return Object.create(proto)
  }
  
  return {}
}