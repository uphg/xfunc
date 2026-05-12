interface ThrottleOptions {
  /** 是否允许在开始立即执行，默认为 true */
  leading?: boolean
  /** 是否允许在结束后执行，默认为 true */
  trailing?: boolean
}

interface ThrottledFunction<Fn extends (...args: any[]) => any> {
  (...args: Parameters<Fn>): ReturnType<Fn>
  cancel: () => void
  flush: () => ReturnType<Fn> | undefined
}

const now = (): number => {
  if (typeof performance !== 'undefined' && performance.now) {
    return performance.now()
  }
  return Date.now()
}

/**
 * 创建节流函数
 * @param func - 要节流的函数
 * @param wait - 节流间隔时间（毫秒）
 * @param options - 配置选项
 * @returns 节流后的增强函数
 *
 * @example
 * ```ts
 * const throttledFn = throttle(
 *   (value: string) => console.log(value),
 *   1000
 * );
 *
 * throttledFn('test');
 * throttledFn.cancel(); // 取消等待中的执行
 * throttledFn.flush(); // 立即执行等待中的调用
 * ```
 */
export default function throttle<Fn extends (...args: any[]) => any>(
  func: Fn,
  wait: number,
  options: ThrottleOptions = {}
): ThrottledFunction<Fn> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null
  let context: any = null
  let args: Parameters<Fn> | null = null
  let result: ReturnType<Fn> | undefined = undefined
  let previousTime = 0

  const later = (): void => {
    previousTime = options.leading === false ? 0 : now()
    timeoutId = null
    result = func.apply(context, args ?? [])

    // 清理引用，避免内存泄漏
    if (!timeoutId) {
      context = null
      args = null
    }
  }

  const throttled = function(this: any, ...newArgs: Parameters<Fn>): ReturnType<Fn> | undefined {
    const currentTime = now()

    // 首次执行且不允许 leading 时，设置 previousTime 为当前时间
    if (!previousTime && options.leading === false) {
      previousTime = currentTime
    }

    const remainingTime = wait - (currentTime - previousTime)
    context = this
    args = newArgs

    // 检查是否应该立即执行
    if (remainingTime <= 0 || remainingTime > wait) {
      // 取消任何等待中的执行
      if (timeoutId) {
        clearTimeout(timeoutId)
        timeoutId = null
      }

      previousTime = currentTime
      result = func.apply(context, args)

      // 清理引用
      if (!timeoutId) {
        context = null
        args = null
      }
    // 设置 trailing 执行
    } else if (!timeoutId && options.trailing !== false) {
      timeoutId = setTimeout(later, remainingTime)
    }

    return result
  }

  /**
   * 取消任何等待中的节流执行
   */
  throttled.cancel = (): void => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
    previousTime = 0
    timeoutId = null
    context = null
    args = null
  }

  /**
   * 立即执行节流函数并重置状态
   * @returns 执行结果，如果没有等待中的调用则返回 undefined
   */
  throttled.flush = (): ReturnType<Fn> | undefined => {
    if (timeoutId && context && args) {
      result = func.apply(context, args)
      throttled.cancel()
    }
    return result
  }

  return throttled as ThrottledFunction<Fn>
}
