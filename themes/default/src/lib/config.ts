export interface NavItem {
  label: string;
  link: string;
  icon?: string;
}

export interface HomeAction {
  text: string;
  link: string;
  theme?: "brand" | "alt";
}

export interface HomeFeature {
  title: string;
  details: string;
  icon?: string;
}

export interface HomeConfig {
  title?: string;
  tagline?: string;
  description?: string;
  actions?: HomeAction[];
  features?: HomeFeature[];
}

export interface SidebarGroup {
  label: string;
  icon?: string;
  items: NavItem[];
}

export interface SiteConfig {
  site?: {
    title?: string;
    description?: string;
  };
  home?: HomeConfig;
  navbar?: NavItem[];
  sidebar?: SidebarGroup[];
}

const rawConfig = import.meta.env.STROPRESS_SITE_CONFIG;

export const siteConfig: SiteConfig =
  typeof rawConfig === "string" ? JSON.parse(rawConfig) : rawConfig || {};
export const siteTitle = siteConfig.site?.title || "Stropress Docs";
export const siteDescription =
  siteConfig.site?.description || "Documentation site";
export const homeConfig = siteConfig.home || {};
