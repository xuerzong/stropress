import fs from 'fs-extra'
import path from 'node:path'

export const resolveThemeDir = async (currentDir: string) => {
  const candidates = [
    path.resolve(currentDir, 'theme-default'),
    path.resolve(currentDir, '../theme-default'),
    path.resolve(currentDir, '../../themes/default'),
  ]

  for (const candidate of candidates) {
    if (await fs.pathExists(candidate)) {
      return candidate
    }
  }

  throw new Error('Missing bundled default theme')
}
