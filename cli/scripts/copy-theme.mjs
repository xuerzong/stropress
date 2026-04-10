import fs from 'fs-extra'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const currentDir = path.dirname(fileURLToPath(import.meta.url))
const cliDir = path.resolve(currentDir, '..')
const sourceDir = path.resolve(cliDir, '../themes/default')
const targetDir = path.resolve(cliDir, 'dist/theme-default')

const excludedDirectories = new Set([
  'node_modules',
  '.astro',
  '.stropress',
  '.daoke',
  'dist',
])

await fs.remove(targetDir)
await fs.copy(sourceDir, targetDir, {
  filter: (source) => {
    const relativePath = path.relative(sourceDir, source)

    if (!relativePath || relativePath.startsWith('..')) {
      return true
    }

    const segments = relativePath.split(path.sep)
    return !segments.some((segment) => excludedDirectories.has(segment))
  },
})
