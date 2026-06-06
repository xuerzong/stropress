export {
  getLocaleEntries,
  getResolvedSiteConfig,
  homeConfig,
  siteConfig,
  siteDescription,
  siteTitle,
} from '@stropress/ui/src/lib/config'

import type { SiteConfig } from '@stropress/ui/src/lib/config'

export const defineConfig = <T extends SiteConfig>(config: T) => config

export type {
  FooterConfig,
  HomeAction,
  HomeConfig,
  HomeFeature,
  LocaleConfig,
  LocaleLink,
  NavItem,
  ResolvedSiteConfig,
  SidebarGroup,
  SiteConfig,
} from '@stropress/ui/src/lib/config'
