import fs from 'fs-extra'
import path from 'node:path'
import { SITE_CONFIG_CANDIDATES } from '../config/loader'
import { isSupportedDocFile } from './file-classifier'

export const collectDocSources = async (
  currentDir: string
): Promise<string[]> => {
  const configCandidates = new Set<string>(SITE_CONFIG_CANDIDATES)
  const entries = await fs.readdir(currentDir, { withFileTypes: true })
  const files: string[] = []

  for (const entry of entries) {
    if (configCandidates.has(entry.name)) {
      continue
    }

    const fullPath = path.join(currentDir, entry.name)
    if (entry.isDirectory()) {
      files.push(...(await collectDocSources(fullPath)))
      continue
    }

    if (isSupportedDocFile(entry.name, fullPath)) {
      files.push(fullPath)
    }
  }

  return files
}
