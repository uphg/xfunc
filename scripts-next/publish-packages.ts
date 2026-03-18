// @ts-check
import fs from 'node:fs'
import pico from 'picocolors'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { exec } from './lib/exec.ts'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')

// 缓存文件路径
const CACHE_FILE = path.resolve(rootDir, '.publish-cache.json')

const step = (msg: string) => console.log(pico.cyan(msg))
const run = async(
  bin: string,
  args: ReadonlyArray<string>,
  opts: import('node:child_process').SpawnOptions = {}
) => exec(bin, args, { stdio: 'inherit', ...opts })

// 解析命令行参数
function parseArgs() {
  const args = process.argv.slice(2)
  return {
    retryFailed: args.includes('--retry-failed'),
    clearCache: args.includes('--clear-cache')
  }
}

// 读取缓存文件
function readCache() {
  if (!fs.existsSync(CACHE_FILE)) {
    return { failedPackages: [] }
  }
  try {
    return JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'))
  } catch {
    return { failedPackages: [] }
  }
}

// 写入缓存文件
function writeCache(cache: { failedPackages: Array<{ name: string, version: string, error: string, timestamp: string }> }) {
  fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2))
}

// 添加失败的包到缓存
function addFailedPackage(packageName: string, version: string, error: Error) {
  const cache = readCache()
  cache.failedPackages.push({
    name: packageName,
    version,
    error: error.message,
    timestamp: new Date().toISOString()
  })
  writeCache(cache)
}

// 清除缓存
function clearCacheFile() {
  if (fs.existsSync(CACHE_FILE)) {
    fs.unlinkSync(CACHE_FILE)
    console.log(pico.green('缓存已清除'))
  }
}

main()

async function main() {
  const { retryFailed, clearCache } = parseArgs()

  if (clearCache) {
    clearCacheFile()
    return
  }

  return await publicPackages(retryFailed)
}

export async function publicPackages(retryFailed = false) {
  try {
    // 发布 npm-packages 中的分包
    step('\n发布分包...')
    const npmPackagesDir = path.resolve(rootDir, 'npm-packages')
    if (!fs.existsSync(npmPackagesDir)) {
      console.log(pico.yellow('npm-packages 目录不存在，跳过分包发布'))
      return
    }

    const packageDirs = fs.readdirSync(npmPackagesDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name)

    const targetVersion = getPkgVersion()

    // 如果是重试失败模式，读取缓存并筛选失败的包
    let packagesToPublish = packageDirs
    if (retryFailed) {
      const cache = readCache()
      const failedPackageNames = cache.failedPackages.map((p: { name: string }) => p.name)
      packagesToPublish = packageDirs.filter((dir) => {
        const pkgPath = path.join(npmPackagesDir, dir, 'package.json')
        if (!fs.existsSync(pkgPath)) return false
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'))
        return failedPackageNames.includes(pkg.name)
      })

      if (packagesToPublish.length === 0) {
        console.log(pico.green('没有需要重试的失败包'))
        return
      }

      console.log(pico.yellow(`重试发布 ${packagesToPublish.length} 个失败的包`))
    }

    for (const packageDir of packagesToPublish) {
      const packagePath = path.join(npmPackagesDir, packageDir)
      const pkgPath = path.join(packagePath, 'package.json')
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'))

      if (!fs.existsSync(pkgPath)) {
        console.log(pico.yellow(`跳过 ${packageDir}：缺少 package.json`))
        continue
      }

      try {
        // 发布分包
        step(`\n发布 ${pkg.name}@${targetVersion}...`)
        // await run('pnpm', ['publish', '--no-git-checks', '--access', 'public'], { cwd: packagePath })
        await run('pnpm', ['publish', '--no-git-checks', '--tag', 'beta', '--access', 'public'], { cwd: packagePath })
        console.log(pico.green(`成功发布 ${pkg.name}@${targetVersion}`))

        // 如果发布成功，从缓存中移除该包
        if (retryFailed) {
          const cache = readCache()
          cache.failedPackages = cache.failedPackages.filter((p: { name: string }) => p.name !== pkg.name)
          writeCache(cache)
        }
      } catch(error: any) {
        console.log(pico.red(`发布失败 ${pkg.name}@${targetVersion}: ${error.message}`))
        addFailedPackage(pkg.name, targetVersion, error)

        // 继续发布其他包，不中断整个流程
        continue
      }
    }

    // 显示发布结果
    const cache = readCache()
    if (cache.failedPackages.length > 0) {
      console.log(pico.red(`\n发布完成，但有 ${cache.failedPackages.length} 个包发布失败:`))
      cache.failedPackages.forEach((p: { name: string, version: string, error: string }) => {
        console.log(pico.red(`  - ${p.name}@${p.version}: ${p.error}`))
      })
      console.log(pico.yellow('\n使用 --retry-failed 参数可以重新发布失败的包'))
    } else {
      console.log(pico.green('\n所有包发布成功!'))
      // 清除缓存文件
      if (fs.existsSync(CACHE_FILE)) {
        fs.unlinkSync(CACHE_FILE)
      }
    }
  } catch(error) {
    throw error
  }
}

function getPkgVersion() {
  const pkgPath = path.resolve(rootDir, 'package.json')
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'))
  return pkg.version
}
