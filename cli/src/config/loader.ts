import fs from 'fs-extra'
import path from 'node:path'
import { createJiti } from 'jiti'
import type { SiteConfig } from './schema'

export const SITE_CONFIG_CANDIDATES = [
  'config.ts',
  'config.js',
  'config.mjs',
  'config.cjs',
  'config.json',
] as const

export const resolveSiteConfigPath = async (docsDir: string) => {
  for (const fileName of SITE_CONFIG_CANDIDATES) {
    const candidatePath = path.join(docsDir, fileName)
    if (await fs.pathExists(candidatePath)) {
      return candidatePath
    }
  }

  return null
}

export const isSiteConfigChange = (filePath: string) => {
  const normalizedPath = filePath.replaceAll('\\', '/')
  return SITE_CONFIG_CANDIDATES.some((name) => normalizedPath === name)
}

export const readSiteConfig = async (
  configPath: string | null
): Promise<SiteConfig> => {
  if (!configPath) {
    return {}
  }

  if (configPath.endsWith('.json')) {
    const rawConfig = await fs.readJson(configPath)
    return ensureObjectConfig(rawConfig, configPath)
  }

  const jiti = createJiti(import.meta.url, {
    moduleCache: false,
    interopDefault: true,
  })
  const loaded = await jiti.import(configPath)
  const candidate =
    loaded && typeof loaded === 'object' && 'default' in loaded
      ? loaded.default
      : loaded

  return ensureObjectConfig(candidate, configPath)
}

const ensureObjectConfig = (value: unknown, configPath: string): SiteConfig => {
  if (!value) {
    return {}
  }

  if (typeof value === 'object' && !Array.isArray(value)) {
    return value as SiteConfig
  }

  throw new Error(
    `Invalid config at ${configPath}. Expected default export to be an object from defineConfig().`
  )
}
