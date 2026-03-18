import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
export const rootDir = resolve(__dirname, '../..')

export function getRootDir(path?: string) {
  return path ? resolve(__dirname, path) : rootDir
}
