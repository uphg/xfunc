/**
 * Creates a debounced function that delays invoking the provided function until after the specified wait time has elapsed since the last time the debounced function was invoked.
 * @param func The function to debounce
 * @param wait The number of milliseconds to delay
 * @param immediate Whether to invoke the function on the leading edge of the wait timeout
 * @returns A new debounced function with a cancel method
 *
 * @example
 * const debouncedFn = debounce(() => console.log('Hello'), 1000)
 * debouncedFn() // Will log 'Hello' after 1 second of no calls
 * debouncedFn.cancel() // Cancels the pending invocation
 */
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate = false
) {
  let timerId: ReturnType<typeof setTimeout> | null = null,
    previous: number | null = null,
    context: ThisParameterType<T> | undefined,
    result: ReturnType<T> | undefined,
    args: Parameters<T>

  const later = function(this: unknown) {
    if (timerId) clearTimeout(timerId)
    const passed = Date.now() - (previous as number)

    if (wait > passed) {
      timerId = setTimeout(later, wait - passed)
    } else {
      timerId = null
      if (!immediate && context) {
        result = func.apply(context, args)
      }

      // Avoid recursive calls to `debounced` function.
      if (!timerId) {
        args = null as any
        context = undefined
      }
    }
  }

  const debounced = function(this: ThisParameterType<T>, ..._args: Parameters<T>): ReturnType<T> | undefined {
    context = this
    args = _args
    previous = Date.now() // Time when function was executed

    if (!timerId) {
      timerId = setTimeout(later, wait)
      if (immediate) {
        result = func.apply(context, args)
      }
    }

    return result
  }

  debounced.cancel = function() {
    if (timerId) clearTimeout(timerId)
    timerId = null
    args = null as any
    context = undefined
  }

  /**
   * 立即执行节流函数并重置状态
   * @returns 执行结果，如果没有等待中的调用则返回 undefined
   */
  debounced.flush = (): ReturnType<T> | undefined => {
    if (timerId && context && args) {
      result = func.apply(context, args)
      debounced.cancel()
    }
    return result
  }

  return debounced
}

export default debounce
