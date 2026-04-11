import fs from 'fs-extra'
import { createRequire } from 'node:module'
import path from 'node:path'

const require = createRequire(import.meta.url)

export const resolveThemeDir = async (currentDir: string) => {
  const installedUiPackage = resolveInstalledUiPackageDir()
  const candidates = [
    ...(installedUiPackage ? [installedUiPackage] : []),
    path.resolve(currentDir, '../../packages/ui'),
  ]

  for (const candidate of candidates) {
    if (await fs.pathExists(candidate)) {
      return candidate
    }
  }

  throw new Error('Missing @stropress/ui package or local UI workspace')
}

const resolveInstalledUiPackageDir = () => {
  try {
    const packageJsonPath = require.resolve('@stropress/ui/package.json')
    return path.dirname(packageJsonPath)
  } catch {
    return null
  }
}
