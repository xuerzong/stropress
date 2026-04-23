export interface NavItem {
  label: string
  link: string
  icon?: string
}

export interface HomeAction {
  text: string
  link: string
  theme?: 'brand' | 'alt'
}

export interface HomeFeature {
  title: string
  details: string
  icon?: string
}

export interface HomeConfig {
  title?: string
  tagline?: string
  description?: string
  actions?: HomeAction[]
  features?: HomeFeature[]
}

export interface FooterConfig {
  message?: string
  copyright?: string
}

export interface SidebarGroup {
  label: string
  icon?: string
  items: NavItem[]
}

export interface LocaleConfig {
  label: string
  lang?: string
  site?: {
    url?: string
    title?: string
    description?: string
    favicon?: string
  }
  home?: HomeConfig
  nav?: NavItem[]
  socialLinks?: NavItem[]
  navbar?: NavItem[]
  sidebar?: SidebarGroup[]
  footer?: FooterConfig
}

export interface SiteConfig {
  site?: {
    url?: string
    title?: string
    description?: string
    favicon?: string
  }
  home?: HomeConfig
  nav?: NavItem[]
  socialLinks?: NavItem[]
  navbar?: NavItem[]
  sidebar?: SidebarGroup[]
  footer?: FooterConfig
  locales?: Record<string, LocaleConfig>
}

export interface LocaleLink {
  key: string
  label: string
  link: string
  isActive: boolean
}

export interface ResolvedSiteConfig {
  localeKey: string
  localeLabel: string
  localeLang: string
  siteUrl?: string
  siteTitle: string
  siteDescription: string
  siteFavicon?: string
  homeConfig: HomeConfig
  nav: NavItem[]
  socialLinks: NavItem[]
  sidebar: SidebarGroup[]
  footer: FooterConfig
  localeLinks: LocaleLink[]
}

const rawConfig = import.meta.env.STROPRESS_SITE_CONFIG

export const siteConfig: SiteConfig =
  typeof rawConfig === 'string' ? JSON.parse(rawConfig) : rawConfig || {}
export const siteTitle = siteConfig.site?.title || 'Stropress Docs'
export const siteDescription =
  siteConfig.site?.description || 'Documentation site'
export const homeConfig = siteConfig.home || {}

const normalizeLocaleKey = (key: string) => {
  const value = key.trim()
  if (!value || value === '/') {
    return '/'
  }

  const prefixed = value.startsWith('/') ? value : `/${value}`
  return prefixed.endsWith('/') ? prefixed : `${prefixed}/`
}

const normalizePathname = (pathname: string) => {
  if (!pathname || pathname === '/') {
    return '/'
  }

  return pathname.endsWith('/') ? pathname : `${pathname}/`
}

const mapLocaleEntries = () => {
  const locales = siteConfig.locales || {}
  const entries = Object.entries(locales).map(
    ([key, value]) => [normalizeLocaleKey(key), value] as const
  )

  if (!entries.some(([key]) => key === '/')) {
    entries.unshift(['/', { label: 'Default' }])
  }

  return entries.sort((a, b) => b[0].length - a[0].length)
}

export const getLocaleEntries = () => mapLocaleEntries()

const stripLocalePrefix = (pathname: string, localeKey: string) => {
  if (localeKey === '/') {
    return pathname
  }

  const normalizedPath = normalizePathname(pathname)
  if (!normalizedPath.startsWith(localeKey)) {
    return pathname
  }

  const stripped = normalizedPath.slice(localeKey.length - 1)
  return stripped || '/'
}

const joinLocalePath = (localeKey: string, subPath: string) => {
  const normalizedSubPath = subPath.startsWith('/') ? subPath : `/${subPath}`
  if (localeKey === '/') {
    return normalizedSubPath
  }

  const suffix = normalizedSubPath === '/' ? '' : normalizedSubPath
  const joined = `${localeKey.slice(0, -1)}${suffix}`
  return joined || '/'
}

export const getResolvedSiteConfig = (pathname: string): ResolvedSiteConfig => {
  const localeEntries = mapLocaleEntries()
  const normalizedPath = normalizePathname(pathname)

  const currentEntry =
    localeEntries.find(([key]) => {
      if (key === '/') {
        return true
      }

      return normalizedPath.startsWith(key)
    }) || localeEntries[localeEntries.length - 1]

  const [localeKey, localeConfig] = currentEntry
  const localeSubPath = stripLocalePrefix(pathname, localeKey)

  const resolvedTitle =
    localeConfig.site?.title || siteConfig.site?.title || 'Stropress Docs'
  const resolvedDescription =
    localeConfig.site?.description ||
    siteConfig.site?.description ||
    'Documentation site'
  const resolvedUrl = localeConfig.site?.url || siteConfig.site?.url
  const resolvedFavicon = localeConfig.site?.favicon || siteConfig.site?.favicon

  const localeLinks = localeEntries.map(([key, config]) => ({
    key,
    label: config.label || (key === '/' ? 'Default' : key),
    link: joinLocalePath(key, localeSubPath),
    isActive: key === localeKey,
  }))

  return {
    localeKey,
    localeLabel:
      localeConfig.label || (localeKey === '/' ? 'Default' : localeKey),
    localeLang: localeConfig.lang || 'en',
    siteUrl: resolvedUrl,
    siteTitle: resolvedTitle,
    siteDescription: resolvedDescription,
    siteFavicon: resolvedFavicon,
    homeConfig: localeConfig.home || siteConfig.home || {},
    nav:
      localeConfig.nav ||
      siteConfig.nav ||
      localeConfig.navbar ||
      siteConfig.navbar ||
      [],
    socialLinks: localeConfig.socialLinks || siteConfig.socialLinks || [],
    sidebar: localeConfig.sidebar || siteConfig.sidebar || [],
    footer: localeConfig.footer || siteConfig.footer || {},
    localeLinks,
  }
}
