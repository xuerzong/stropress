import fs from 'fs-extra'
import path from 'node:path'
import { isSyncableDocsFile } from './file-classifier'

export const copyDocsRecursive = async (
  sourceDir: string,
  targetDir: string
) => {
  const entries = await fs.readdir(sourceDir, { withFileTypes: true })

  for (const entry of entries) {
    if (entry.name === 'config.json') {
      continue
    }

    const sourcePath = path.join(sourceDir, entry.name)
    const targetPath = path.join(targetDir, entry.name)

    if (entry.isDirectory()) {
      await fs.ensureDir(targetPath)
      await copyDocsRecursive(sourcePath, targetPath)
      continue
    }

    if (isSyncableDocsFile(entry.name, sourcePath)) {
      await fs.ensureDir(path.dirname(targetPath))
      await fs.copyFile(sourcePath, targetPath)
    }
  }
}

export const copyPublicAssets = async (
  projectDir: string,
  publicDir: string
) => {
  const sourcePublicDir = path.join(projectDir, 'public')

  if (!(await fs.pathExists(sourcePublicDir))) {
    return
  }

  await fs.copy(sourcePublicDir, publicDir, { overwrite: true })
}

export const syncDocsContent = async (
  sourceDir: string,
  targetDir: string,
  projectDir: string,
  publicDir: string
) => {
  await fs.emptyDir(targetDir)
  await fs.emptyDir(publicDir)
  await copyDocsRecursive(sourceDir, targetDir)
  await copyPublicAssets(projectDir, publicDir)
}
