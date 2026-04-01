export interface NavItem {
  label: string;
  link: string;
}

export interface SidebarGroup {
  label: string;
  items: NavItem[];
}

export interface SiteConfig {
  site?: {
    title?: string;
    description?: string;
  };
  navbar?: NavItem[];
  sidebar?: SidebarGroup[];
}

const rawConfig = import.meta.env.STROPRESS_SITE_CONFIG;

export const siteConfig: SiteConfig =
  typeof rawConfig === "string" ? JSON.parse(rawConfig) : rawConfig || {};
export const siteTitle = siteConfig.site?.title || "Stropress Docs";
export const siteDescription =
  siteConfig.site?.description || "Documentation site";
