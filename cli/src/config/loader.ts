import fs from 'node:fs'
import path from 'node:path'
import { createJiti } from 'jiti'
import type { SiteConfig } from './schema'
import {
  DEFAULT_CONFIG_NAME,
  DEFAULT_CONFIG_EXTENSIONS,
} from '@stropress/shared'
import { isPlainObject } from 'is-plain-object'

export const resolveSiteConfigPath = (basePath: string) => {
  return DEFAULT_CONFIG_EXTENSIONS.map((ext) => `${basePath}${ext}`).find(
    fs.existsSync
  )
}

export const readSiteConfig = async (
  configPath: string | null
): Promise<SiteConfig> => {
  if (!configPath) {
    return {}
  }

  if (configPath.endsWith('.json')) {
    const content = fs.readFileSync(configPath, 'utf-8')
    try {
      const rawConfig = await JSON.parse(content)
      return isPlainObject(rawConfig) ? rawConfig : {}
    } catch (e) {
      console.error(e)
    }
    return {}
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

  return isPlainObject(candidate) ? candidate : {}
}

export const loadSiteConfig = async (basePath: string) => {
  const configPath = resolveSiteConfigPath(
    path.join(basePath, DEFAULT_CONFIG_NAME)
  )
  if (!configPath) {
    return {}
  }
  const config = await readSiteConfig(configPath)
  return config
}
