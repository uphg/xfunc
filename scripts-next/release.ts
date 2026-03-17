// @ts-check
import * as fs from 'node:fs'
import * as path from 'node:path'
import * as pico from 'picocolors'
import * as semver from 'semver'
import * as enquirer from 'enquirer'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { exec } from './lib/exec.js'
import { parseArgs } from 'node:util'

const { prompt } = enquirer
const currentVersion = createRequire(import.meta.url)('../package.json').version
const __dirname = path.dirname(fileURLToPath(import.meta.url))

const { values: args, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    dry: {
      type: 'boolean'
    },
    skipBuild: {
      type: 'boolean'
    },
    skipTests: {
      type: 'boolean'
    },
    skipGit: {
      type: 'boolean'
    },
    skipPrompts: {
      type: 'boolean'
    }
  }
})

const isDryRun = args.dry
const skipTests = args.skipTests
const skipBuild = args.skipBuild
const skipGit = args.skipGit
const skipPrompts = args.skipPrompts

/** @type {ReadonlyArray<import('semver').ReleaseType>} */
const versionIncrements: ReadonlyArray<import('semver').ReleaseType> = ['patch', 'minor', 'major']

const inc = (i: import('semver').ReleaseType) =>
  semver.inc(currentVersion, i)

const run = async(
  bin: string,
  args: ReadonlyArray<string>,
  opts: import('node:child_process').SpawnOptions = {}
): Promise<{ stdout: string, stderr: string, ok: boolean, code: number | null }> => exec(bin, args, { stdio: 'inherit', ...opts }) as Promise<{ stdout: string, stderr: string, ok: boolean, code: number | null }>

const dryRun = async(bin: string, args: ReadonlyArray<string>) => console.log(pico.blue(`[dryrun] ${bin} ${args.join(' ')}`))

const runIfNotDry = isDryRun ? dryRun : run
const step = (msg: string) => console.log(pico.cyan(msg))

async function main() {
  let targetVersion = positionals[0]

  if (!targetVersion) {
    const { release }: { release: string } = await prompt({
      type: 'select',
      name: 'release',
      message: '选择发布类型',
      choices: versionIncrements
        .map(i => `${i} (${inc(i)})`)
        .concat(['custom'])
    })

    if (release === 'custom') {
      const result = await prompt({
        type: 'input',
        name: 'version',
        message: '输入自定义版本号',
        initial: currentVersion
      }) as { version: string }
      targetVersion = result.version
    } else {
      targetVersion = release.match(/\((.*)\)/)?.[1] ?? ''
    }
  }

  if (versionIncrements.includes(targetVersion as import('semver').ReleaseType)) {
    const newVersion = inc(targetVersion as import('semver').ReleaseType)
    if (newVersion) {
      targetVersion = newVersion
    }
  }

  if (!semver.valid(targetVersion)) {
    throw new Error(`无效的目标版本: ${targetVersion}`)
  }

  if (!skipPrompts) {
    const { yes: confirmRelease }: { yes: boolean } = await prompt({
      type: 'confirm',
      name: 'yes',
      message: `发布 v${targetVersion}，确认继续？`
    })

    if (!confirmRelease) {
      return
    }
  }

  step(`发布 v${targetVersion}...`)

  // 运行测试
  if (!skipTests) {
    step('\n运行测试...')
    if (!isDryRun) {
      await run('pnpm', ['test:run'])
    } else {
      console.log('跳过（干运行）')
    }
  } else {
    step('跳过测试')
  }

  // 更新版本号
  step('\n更新版本号...')
  updateVersion(targetVersion)

  // 变更日志生成
  step('\nGenerating changelog...')
  await run('pnpm', ['run', 'changelog'])

  if (!skipPrompts) {
    const { yes: changelogOk }: { yes: boolean } = await prompt({
      type: 'confirm',
      name: 'yes',
      message: 'Changelog generated. Does it look good?'
    })

    if (!changelogOk) {
      return
    }
  }

  // 构建项目
  if (!skipBuild) {
    step('\n构建项目...')
    if (!isDryRun) {
      await run('pnpm', ['build'])
      await run('pnpm', ['build:packages'])
    } else {
      console.log('跳过（干运行）')
    }
  } else {
    step('跳过构建')
  }

  // 代码检查
  step('\n运行代码检查...')
  if (!isDryRun) {
    await run('pnpm', ['lint:check'])
  } else {
    console.log('跳过（干运行）')
  }

  if (!skipGit) {
    const { stdout } = await run('git', ['diff'], { stdio: 'pipe' })
    if (stdout) {
      step('\n提交更改...')
      await runIfNotDry('git', ['add', '-A'])
      await runIfNotDry('git', ['commit', '-m', `release: v${targetVersion}`])
    } else {
      console.log('没有更改需要提交')
    }

    step('\n推送到远程仓库...')
    await runIfNotDry('git', ['tag', `v${targetVersion}`])
    await runIfNotDry('git', ['push', 'origin', `refs/tags/v${targetVersion}`])
    await runIfNotDry('git', ['push'])
  }

  // 发布到 npm
  step('\n发布到 npm...')
  if (!isDryRun) {
    await run('pnpm', ['publish', '--access', 'public'], { cwd: path.resolve(__dirname, '../dist') })
    console.log(pico.green(`成功发布主包 ${targetVersion}`))

    // 发布 npm-packages 中的分包
    await run('pnpm', ['publish:packages'])
  } else {
    console.log('跳过（干运行）')
  }

  if (isDryRun) {
    console.log('\n干运行完成 - 运行 git diff 查看更改')
  }
}

function updateVersion(version: string) {
  const pkgPath = path.resolve(__dirname, '../package.json')
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'))
  pkg.version = version
  fs.writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
