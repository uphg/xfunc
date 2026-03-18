import { readFileSync, readdirSync } from 'fs'
import { join } from 'path'
import { rootDir } from './get-root-dir'

export function getPackageEntries(keySuffix = false): Record<string, string> {
  const srcDir = join(rootDir, 'src')
  const entries: Record<string, string> = { }

  const modules = readdirSync(srcDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name)

  for (const module of modules) {
    if (module === 'internal') continue

    const moduleIndexPath = join(srcDir, module, 'index.ts')
    try {
      const content = readFileSync(moduleIndexPath, 'utf-8')

      // Add the module index file itself
      const key = keySuffix ? `${module}/index` : module
      entries[key] = `src/${module}/index.ts`

      // Add individual function files
      const exports = content.match(/export.*from\s+['"]\.\/([^'"]+)['"]/g)
      if (exports) {
        for (const exportLine of exports) {
          const match = exportLine.match(/export.*from\s+['"]\.\/([^'"]+)['"]/)
          if (match && match[1]) {
            const functionName = match[1]
            const key = keySuffix ? `${functionName}/index` : functionName
            entries[key] = `src/${module}/${functionName}.ts`
          }
        }
      }
    } catch(error: any) {
      console.warn(`Could not read ${moduleIndexPath}:`, error.message)
    }
  }

  return entries
}
