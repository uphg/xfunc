import { getPackageEntries } from './package-entries'
import { mkdirSync, writeFileSync, readFileSync } from 'fs'
import { join } from 'path'
import { rootDir } from './get-root-dir'
import { hyphenate } from '../../src/index'

const npmPackagesDir = join(rootDir, 'npm-packages')

interface TsdownConfigOptions {
  functionDir: string
  entryPath: string
}

interface MetaDocsOptions {
  functionDir: string
}

export async function createPackages() {
  const entries = getPackageEntries()
  for (const [functionName, entryPath] of Object.entries(entries)) {
    const functionDir = join(npmPackagesDir, functionName)

    // Create directory for the function
    mkdirSync(functionDir, { recursive: true })
    await createTsdownConfig(functionName, { functionDir, entryPath })
    await createMetaDocs(functionName, { functionDir })
  }
  console.log(`Created ${Object.keys(entries).length} package configs`)
}

export async function createTsdownConfig(
  functionName: string,
  { functionDir, entryPath }: TsdownConfigOptions
) {
  const configContent = `import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: {
    index: '${entryPath}',
  },
  format: ['esm', 'umd'],
  outDir: './npm-packages/${functionName}/dist',
  dts: true,
  sourcemap: true,
  clean: true,
  outputOptions: {
    name: 'xfunc_${functionName.replace(/[-]/g, '_')}',
  }
})
`

  const configPath = join(functionDir, 'tsdown.config.ts')
  writeFileSync(configPath, configContent)

  console.log(`Created config for ${functionName} at ${configPath}`)
}

export async function createMetaDocs(
  functionName: string,
  { functionDir }: MetaDocsOptions
) {
  const mainPackagePath = join(rootDir, 'package.json')
  const mainPackage = JSON.parse(readFileSync(mainPackagePath, 'utf-8'))
  const version = mainPackage.version
  const hyphName = hyphenate(functionName)
  const packageJson = {
    name: `@xfunc/${hyphName}`,
    version,
    license: 'MIT',
    main: 'dist/index.umd.js',
    module: 'dist/index.js',
    types: 'dist/index.d.ts',
    description: 'A lightweight JavaScript utility library with common functions',
    keywords: [
      'javascript',
      'typescript',
      'utils',
      'utility',
      'functions',
      'library',
      'tools'
    ],
    homepage: 'https://github.com/uphg/xfunc#readme',
    repository: 'uphg/xfunc',
    bugs: 'https://github.com/uphg/xfunc/issues',
    author: 'Lv Heng <lvheng233@gmail.com>'
  }

  writeFileSync(
    join(functionDir, 'package.json'),
    JSON.stringify(packageJson, null, 2)
  )

  const licensePath = join(rootDir, 'LICENSE')
  const licenseContent = readFileSync(licensePath, 'utf-8')
  writeFileSync(join(functionDir, 'LICENSE'), licenseContent)

  const readmeContent = `# @xfunc/${hyphName} v${version}

## Installation

Using npm

\`\`\`bash
$ npm i @xfunc/${hyphName}
\`\`\`

See the documentation or package source for more details.
`

  writeFileSync(join(functionDir, 'README.md'), readmeContent)

  console.log(`Created meta docs for ${functionName} at ${functionDir}`)
}
