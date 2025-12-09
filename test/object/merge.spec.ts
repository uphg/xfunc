import { describe, it, expect } from 'vitest'
import { merge } from '../../src/object/merge'

describe('merge', () => {
  it('should merge null', () => {
    const result = merge(null, null)
    expect(result).toBeNull()
    const result2 = merge(0, null)
    expect(result2).toBeUndefined()
    const result3 = merge('hi', null)
    expect(result3).toBeNull()
    const target4 = {}
    const result4 = merge(target4, null)
    expect(result4).toBe(target4)
  })
  it('should merge two simple objects', () => {
    const target = { a: 1, b: 2 }
    const source = { b: 3, c: 4 }
    const result = merge(target, source)

    expect(result).toEqual({ a: 1, b: 3, c: 4 })
  })

  it('should merge multiple objects', () => {
    const target = { a: 1 }
    const source1 = { b: 2 }
    const source2 = { c: 3 }
    const source3 = { d: 4 }

    const result = merge(target, source1, source2, source3)
    expect(result).toEqual({ a: 1, b: 2, c: 3, d: 4 })
  })

  it('should merge nested objects recursively', () => {
    const target = {
      a: 1,
      nested: {
        x: 10,
        y: 20,
        deep: { level1: 'value1' }
      }
    }
    const source = {
      b: 2,
      nested: {
        y: 30,
        z: 40,
        deep: { level2: 'value2' }
      }
    }

    const result = merge(target, source)
    expect(result).toEqual({
      a: 1,
      b: 2,
      nested: {
        x: 10,
        y: 30,
        z: 40,
        deep: {
          level1: 'value1',
          level2: 'value2'
        }
      }
    })
  })

  it('should merge arrays by concatenation', () => {
    const target = {
      items: [1, 2, 3],
      other: 'value'
    }
    const source = {
      items: [4, 5],
      newProp: 'new'
    }

    const result = merge(target, source)
    expect(result).toEqual({
      items: [1, 2, 3, 4, 5],
      other: 'value',
      newProp: 'new'
    })
  })

  it('should handle nested arrays in objects', () => {
    const target = {
      data: {
        items: [1, 2],
        config: { enabled: true }
      }
    }
    const source = {
      data: {
        items: [3, 4],
        config: { timeout: 5000 }
      }
    }

    const result = merge(target, source)
    expect(result).toEqual({
      data: {
        items: [1, 2, 3, 4],
        config: {
          enabled: true,
          timeout: 5000
        }
      }
    })
  })

  it('should handle deep nested arrays', () => {
    const target = {
      level1: {
        level2: {
          items: [1, 2]
        }
      }
    }
    const source = {
      level1: {
        level2: {
          items: [3, 4],
          other: 'value'
        }
      }
    }

    const result = merge(target, source)
    expect(result).toEqual({
      level1: {
        level2: {
          items: [1, 2, 3, 4],
          other: 'value'
        }
      }
    })
  })

  it('should replace primitive values', () => {
    const target = {
      str: 'hello',
      num: 42,
      bool: true,
      nullVal: null
    }
    const source = {
      str: 'world',
      num: 100,
      bool: false,
      newStr: 'added'
    }

    const result = merge(target, source)
    expect(result).toEqual({
      str: 'world',
      num: 100,
      bool: false,
      nullVal: null,
      newStr: 'added'
    })
  })

  it('should handle null and undefined values correctly', () => {
    const target = {
      a: null,
      b: { c: 1 },
      d: 'exists'
    }
    const source = {
      a: { e: 2 },
      b: null,
      d: undefined
    }

    const result = merge(target, source)
    expect(result).toEqual({
      a: { e: 2 },
      b: null,
      d: undefined
    })
  })

  it('should handle empty objects', () => {
    const target = {}
    const source = { a: 1, b: 2 }
    const result = merge(target, source)

    expect(result).toEqual({ a: 1, b: 2 })
  })

  it('should handle deeply nested objects with multiple levels', () => {
    const target = {
      level1: {
        level2: {
          level3: {
            level4: {
              a: 1,
              data: [1, 2]
            }
          }
        }
      }
    }

    const source = {
      level1: {
        level2: {
          level3: {
            level4: {
              b: 2,
              data: [3, 4],
              config: { deep: true }
            },
            newLevel3: 'value'
          },
          newLevel2: 'also value'
        },
        newLevel1: 'top level'
      }
    }

    const result = merge(target, source)
    expect(result).toEqual({
      level1: {
        level2: {
          level3: {
            level4: {
              a: 1,
              b: 2,
              data: [1, 2, 3, 4],
              config: {
                deep: true
              }
            },
            newLevel3: 'value'
          },
          newLevel2: 'also value'
        },
        newLevel1: 'top level'
      }
    })
  })

  it('should merge objects with array containing objects', () => {
    const target = {
      items: [
        { id: 1, name: 'first' },
        { id: 2, name: 'second' }
      ]
    }
    const source = {
      items: [
        { id: 3, name: 'third' },
        { id: 4, name: 'fourth' }
      ]
    }

    const result = merge(target, source)
    expect(result).toEqual({
      items: [
        { id: 1, name: 'first' },
        { id: 2, name: 'second' },
        { id: 3, name: 'third' },
        { id: 4, name: 'fourth' }
      ]
    })
  })

  it('should handle complex mixed structures', () => {
    const target = {
      users: [
        {
          id: 1,
          profile: {
            name: 'John',
            settings: {
              theme: 'dark'
            }
          }
        }
      ],
      config: {
        apiUrl: 'https://api.example.com'
      }
    }

    const source = {
      users: [
        {
          id: 2,
          profile: {
            name: 'Jane',
            settings: {
              language: 'en'
            }
          }
        }
      ],
      config: {
        timeout: 5000,
        apiUrl: 'https://new-api.example.com'
      }
    }

    const result = merge(target, source)
    expect(result).toEqual({
      users: [
        {
          id: 1,
          profile: {
            name: 'John',
            settings: {
              theme: 'dark'
            }
          }
        },
        {
          id: 2,
          profile: {
            name: 'Jane',
            settings: {
              language: 'en'
            }
          }
        }
      ],
      config: {
        timeout: 5000,
        apiUrl: 'https://new-api.example.com'
      }
    })
  })

  it('should handle objects with symbols as keys', () => {
    const sym = Symbol('test')
    const target = {
      [sym]: 'symbol value',
      regular: 'normal value'
    }
    const source = {
      [sym]: 'new symbol value',
      newRegular: 'another value'
    }

    const result = merge(target, source)
    expect(result).toEqual({
      [sym]: 'new symbol value',
      regular: 'normal value',
      newRegular: 'another value'
    })
  })

  it('should preserve target when no sources provided', () => {
    const target = { a: 1, b: { c: 2 } }
    const result = merge(target)

    expect(result).toBe(target)
  })

  it('should handle source objects that are not plain objects', () => {
    class CustomClass {
      constructor(public value: string) {}
    }

    const target = { a: 1 }
    const source = new CustomClass('test')

    const result = merge(target, source)
    expect(result).toEqual({
      a: 1,
      value: 'test'
    })
  })

  it('should merge Date objects correctly', () => {
    const target = {
      date1: new Date('2023-01-01'),
      other: 'value'
    }
    const source = {
      date2: new Date('2023-12-31'),
      other: 'replaced'
    }

    const result = merge(target, source)
    expect(result.date1).toEqual(new Date('2023-01-01'))
    expect(result.date2).toEqual(new Date('2023-12-31'))
    expect(result.other).toBe('replaced')
  })

  it('should handle circular references gracefully', () => {
    const target: any = { a: 1 }
    target.self = target

    const source = { b: 2 }

    // This should not cause infinite recursion
    const result = merge(target, source)
    expect(result.a).toBe(1)
    expect(result.b).toBe(2)
    expect(result.self).toBe(result)
  })
})
