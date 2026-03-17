import path from 'path'
import { execa } from 'execa'
import fs from 'fs-extra'
import { fileURLToPath } from 'url'
import minimist from 'minimist'
import pc from 'picocolors'
import { execaQuiet, handleBuildResult } from './lib/exec.ts'
import { BUILD_TYPES } from './config/build-types.ts'
import { createPackageConfig } from './config/package-config.ts'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const distDir = path.resolve(__dirname, '../dist')
const resolve = (p: string) => path.resolve(distDir, p)
const argv = minimist(process.argv.slice(2))

main(argv)

async function main(argv: minimist.ParsedArgs) {
  // 读取根目录 package.json 获取默认版本
  const rootPackagePath = path.resolve(__dirname, '../package.json')
  const rootPackage = JSON.parse(await fs.readFile(rootPackagePath, 'utf-8'))
  const { v: version = rootPackage.version } = argv
  const packageJson = createPackageConfig(version)

  try {
    console.log(pc.dim('Building TypeScript...'))
    const tscResult = await execaQuiet('tsc')

    if (fs.existsSync(distDir)) {
      await fs.remove(distDir)
    }

    console.log(pc.dim('Building bundles...'))

    // 并行执行所有 rollup 构建
    const esmResult = await execaQuiet('tsdown')
    // const umdResult = await execaQuiet('BUILD_ENV=umd tsdown', { shell: true })

    // 显示构建结果
    console.log(pc.dim('Build Results:'))

    // 统一处理构建结果
    handleBuildResult(tscResult, BUILD_TYPES.TSC.name, BUILD_TYPES.TSC.type)
    handleBuildResult(esmResult, BUILD_TYPES.ESM.name, BUILD_TYPES.ESM.type)
    // handleBuildResult(umdResult, BUILD_TYPES.UMD.name, BUILD_TYPES.UMD.type)

    const strPackage = JSON.stringify(packageJson, null, 2)
    await fs.writeFile(resolve('./package.json'), strPackage)
    await fs.copy('README.md', resolve('README.md'))
    await fs.copy('LICENSE', resolve('LICENSE'))

    // 格式化打包后的代码和类型文件
    console.log(pc.dim('Formatting output files...'))
    try {
      await execa(
        'pnpm',
        ['exec', 'eslint', 'dist/**/*.{js,ts,d.ts}', '--fix', '--no-ignore'],
        { stdio: 'inherit' }
      )
      console.log(pc.green('✓') + pc.dim(' Files formatted successfully!'))
    } catch(error: any) {
      console.log(
        pc.yellow('(!)')
        + pc.dim(' Warning: Some files could not be formatted: ')
        + pc.red(error.message)
      )
    }

    console.log(pc.green('✓') + pc.bold(' Build completed successfully!'))
  } catch(error: any) {
    console.error(
      pc.red('✗') + pc.bold(' Build failed: ') + pc.red(error.message)
    )
    if (error.stderr) {
      console.error(pc.red('STDERR:'), error.stderr)
    }
    process.exit(1)
  }
}
