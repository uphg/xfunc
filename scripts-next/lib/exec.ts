// @ts-check
import pico from 'picocolors'
import { execa } from 'execa'
import { spawn } from 'node:child_process'

/**
 * 格式化构建时间显示
 * @param {number} ms - 毫秒数
 * @returns {string} 格式化后的时间字符串
 */
export function formatBuildTime(ms) {
  if (ms < 1000) return pico.green(`${ms}ms`)
  if (ms < 5000) return pico.yellow(`${(ms / 1000).toFixed(1)}s`)
  return pico.red(`${(ms / 1000).toFixed(1)}s`)
}

/**
 * 静默执行包装器，收集构建信息
 * @param {string} command - 要执行的命令
 * @param {string[]} args - 命令参数
 * @param {object} options - 执行选项
 * @returns {Promise<{success: boolean, duration: number, command: string, args: string[], result?: any, error?: any}>} 构建结果
 */
export async function execaQuiet(command, args = [], options = {}) {
  const startTime = Date.now()
  try {
    const result = await execa(command, args, options)
    const duration = Date.now() - startTime
    return { success: true, duration, command, args, result }
  }
  catch(error) {
    const duration = Date.now() - startTime
    return { success: false, duration, command, args, error }
  }
}

/**
 * 统一处理构建结果
 * @param {Object} result - 构建结果
 * @param {string} type - 构建类型
 * @param {string} action - 构建动作
 */
export function handleBuildResult(result, type, action) {
  if (result.success) {
    console.log(pico.green('✓') + pico.dim(` ${type} ${action} in `) + formatBuildTime(result.duration))
  }
  else {
    console.log(pico.red('✗') + pico.dim(` ${type} failed in `) + formatBuildTime(result.duration))
    throw result.error
  }
}

/**
 * 执行命令行指令
 * @param {string} command
 * @param {ReadonlyArray<string>} args
 * @param {object} [options]
 */
export async function exec(command, args, options) {
  return new Promise((resolve, reject) => {
    const _process = spawn(command, args, {
      stdio: [
        'ignore', // stdin
        'pipe', // stdout
        'pipe' // stderr
      ],
      ...options,
      shell: process.platform === 'win32'
    })

    /** @type {Buffer[]} */
    const stderrChunks = []
    /** @type {Buffer[]} */
    const stdoutChunks = []

    _process.stderr?.on('data', (chunk) => {
      stderrChunks.push(chunk)
    })

    _process.stdout?.on('data', (chunk) => {
      stdoutChunks.push(chunk)
    })

    _process.on('error', (error) => {
      reject(error)
    })

    _process.on('exit', (code) => {
      const ok = code === 0
      const stderr = Buffer.concat(stderrChunks).toString().trim()
      const stdout = Buffer.concat(stdoutChunks).toString().trim()

      if (ok) {
        const result = { ok, code, stderr, stdout }
        resolve(result)
      } else {
        reject(
          new Error(
            `Failed to execute command: ${command} ${args.join(' ')}: ${stderr}`
          )
        )
      }
    })
  })
}
