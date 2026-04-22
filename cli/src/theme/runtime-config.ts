import fs from 'fs-extra'
import path from 'node:path'
import type { SiteConfig } from '../config/schema'
import { resolveSiteUrl } from './site-url'

interface WriteAstroConfigInput {
  cwd: string
  themeDir: string
  config: SiteConfig
}

const toLocaleIdFromPathname = (pathname: string) => {
  const normalizedPath = pathname.trim()

  if (!normalizedPath || normalizedPath === '/') {
    return 'en'
  }

  return normalizedPath.replace(/^\/+|\/+$/g, '').split('/')[0] || 'en'
}

const toLocaleIdFromLang = (lang?: string) => {
  const normalizedLang = lang?.trim()

  if (!normalizedLang) {
    return undefined
  }

  return normalizedLang.toLowerCase().split(/[-_]/)[0] || undefined
}

const getI18nConfig = (config: SiteConfig) => {
  const localeEntries = Object.entries(config.locales ?? {})

  if (localeEntries.length === 0) {
    return ''
  }

  const localeIds = localeEntries
    .map(([pathname, localeConfig]) => {
      return (
        toLocaleIdFromLang(localeConfig.lang) ||
        toLocaleIdFromPathname(pathname)
      )
    })
    .filter((localeId, index, arr) => arr.indexOf(localeId) === index)

  if (localeIds.length === 0) {
    return ''
  }

  const defaultLocaleEntry = localeEntries.find(
    ([pathname]) => pathname.trim() === '/'
  )
  const defaultLocale = defaultLocaleEntry
    ? toLocaleIdFromLang(defaultLocaleEntry[1].lang) || 'en'
    : localeIds[0]

  return `,\n  i18n: {\n    locales: ${JSON.stringify(localeIds)},\n    defaultLocale: ${JSON.stringify(defaultLocale)},\n    routing: {\n      prefixDefaultLocale: false\n    }\n  }`
}

export const writeAstroRuntimeConfig = async (input: WriteAstroConfigInput) => {
  await fs.remove(path.join(input.themeDir, '.daoke'))
  const runtimeDir = path.join(input.themeDir, '.stropress')
  const runtimePublicDir = path.join(runtimeDir, 'public')
  const astroConfigPath = path.join(runtimeDir, 'astro.config.mjs')
  const serializedConfig = JSON.stringify(input.config)
  const siteUrl = resolveSiteUrl(input.config)
  const i18nConfig = getI18nConfig(input.config)
  const codeTheme = input.config.markdown?.codeTheme
  const shikiConfig =
    typeof codeTheme === 'string'
      ? `,\n    shikiConfig: {\n      theme: ${JSON.stringify(codeTheme)}\n    }`
      : codeTheme
        ? `,\n    shikiConfig: {\n      themes: ${JSON.stringify(codeTheme)},\n      defaultColor: false\n    }`
        : ''

  await fs.ensureDir(runtimeDir)

  const content = `import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import remarkGithubAlerts from "remark-github-alerts";

export default defineConfig({
  outDir: ${JSON.stringify(path.join(input.cwd, 'dist'))},
  publicDir: ${JSON.stringify(runtimePublicDir)},
  devToolbar: {
    enabled: false
  },
  markdown: {
    remarkPlugins: [remarkGithubAlerts]${shikiConfig}
  },
  integrations: [
    mdx({
      remarkPlugins: [remarkGithubAlerts]
    })
  ],
  site: ${JSON.stringify(siteUrl)}${i18nConfig},
  vite: {
    define: {
      "import.meta.env.STROPRESS_SITE_CONFIG": ${JSON.stringify(serializedConfig)}
    }
  }
});
`

  await fs.writeFile(astroConfigPath, content, 'utf8')
  return astroConfigPath
}
