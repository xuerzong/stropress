import fs from 'fs-extra'
import { ZodError } from 'zod'
import { parseSiteConfig, type SiteConfig } from './schema'

export const readSiteConfig = async (
  configPath: string
): Promise<SiteConfig> => {
  if (!(await fs.pathExists(configPath))) {
    return {}
  }

  const rawConfig = await fs.readJson(configPath)
  const result = parseSiteConfig(rawConfig)

  if (result.success) {
    return result.data
  }

  throw new Error(formatConfigValidationError(configPath, result.error))
}

const formatConfigValidationError = (configPath: string, error: ZodError) => {
  const issues = error.issues.map((issue) => {
    const pathLabel = issue.path.length > 0 ? issue.path.join('.') : '$'
    return `- ${pathLabel}: ${issue.message}`
  })

  return `Invalid config.json at ${configPath}\n${issues.join('\n')}`
}
