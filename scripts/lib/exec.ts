import pico from 'picocolors'
import { execa } from 'execa'
import type { SpawnOptions } from 'node:child_process'
import { spawn } from 'node:child_process'

interface ExecaQuietResult {
  success: boolean
  duration: number
  command: string
  args: string[]
  result?: unknown
  error?: unknown
}

interface ExecResult {
  ok: boolean
  code: number | null
  stderr: string
  stdout: string
}

/**
 * 格式化构建时间显示
 */
export function formatBuildTime(ms: number): string {
  if (ms < 1000) return pico.green(`${ms}ms`)
  if (ms < 5000) return pico.yellow(`${(ms / 1000).toFixed(1)}s`)
  return pico.red(`${(ms / 1000).toFixed(1)}s`)
}

/**
 * 静默执行包装器，收集构建信息
 */
export async function execaQuiet(
  command: string,
  args: string[] = [],
  options: Record<string, unknown> = {}
): Promise<ExecaQuietResult> {
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
 */
export function handleBuildResult(
  result: ExecaQuietResult,
  type: string,
  action: string
): void {
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
 */
export async function exec(
  command: string,
  args: readonly string[],
  options?: SpawnOptions
): Promise<ExecResult> {
  return new Promise<ExecResult>((resolve, reject) => {
    const _process = spawn(command, args, {
      stdio: [
        'ignore', // stdin
        'pipe', // stdout
        'pipe' // stderr
      ],
      ...options,
      shell: process.platform === 'win32'
    })

    const stderrChunks: Buffer[] = []
    const stdoutChunks: Buffer[] = []

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
