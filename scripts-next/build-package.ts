import path from 'path'
import fs from 'fs-extra'
import { fileURLToPath } from 'url'
import pc from 'picocolors'
import { execaQuiet, handleBuildResult } from './lib/exec.ts'
import { createPackages } from './lib/create-packages.ts'
import { getPackageEntries } from './lib/package-entries.ts'
import { hyphenate } from '../src/index.ts'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const npmPackagesDir = path.resolve(__dirname, '../npm-packages')

run()

async function run() {
  try {
    if (fs.existsSync(npmPackagesDir)) {
      await fs.remove(npmPackagesDir)
    }
    console.log(pc.dim('Creating package configs...'))

    // 首先创建所有包的配置文件和元文档
    await createPackages()

    console.log(pc.dim('Building individual packages...'))

    // 获取所有函数条目
    const entries = Object.keys(getPackageEntries())

    // 为每个包运行 tsdown 构建
    const buildResults = []
    for (const functionName of entries) {
      const configPath = path.join(npmPackagesDir, functionName, 'tsdown.config.ts')
      if (fs.existsSync(configPath)) {
        const hyphName = hyphenate(functionName)
        console.log(pc.dim(`Building ${functionName}...`))

        // 运行 tsdown 构建
        const result = await execaQuiet('pnpm', ['exec', 'tsdown', '-c', configPath])
        buildResults.push({ functionName, result })

        // 显示构建结果
        handleBuildResult(result, `@xfunc/${hyphName}`, 'bundle built')
      } else {
        console.log(pc.yellow('(!)') + pc.dim(` Config not found for ${functionName}: ${configPath}`))
      }
    }

    // 统计构建结果
    const successful = buildResults.filter(r => r.result.success).length
    const failed = buildResults.filter(r => !r.result.success).length

    console.log(pc.dim('\nBuild Summary:'))
    console.log(pc.green('✓') + pc.dim(` Successful builds: ${successful}`))
    if (failed > 0) {
      console.log(pc.red('✗') + pc.dim(` Failed builds: ${failed}`))
    }

    if (failed === 0) {
      console.log(pc.green('✓') + pc.bold(' All packages built successfully!'))
    } else {
      console.log(pc.red('✗') + pc.bold(' Some packages failed to build!'))
      process.exit(1)
    }
  }
  catch(error: any) {
    console.error(pc.red('✗') + pc.bold(' Build failed: ') + pc.red(error.message))
    if (error.stderr) {
      console.error(pc.red('STDERR:'), error.stderr)
    }
    process.exit(1)
  }
}
