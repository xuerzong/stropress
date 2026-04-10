import { z } from "zod";

const navItemSchema = z
  .object({
    icon: z.string().min(1).optional(),
    label: z.string().min(1),
    link: z.string().min(1),
  })
  .strict();

const sidebarGroupSchema = z
  .object({
    icon: z.string().min(1).optional(),
    label: z.string().min(1),
    items: z.array(navItemSchema),
  })
  .strict();

const homeActionSchema = z
  .object({
    text: z.string().min(1),
    link: z.string().min(1),
    theme: z.enum(["brand", "alt"]).optional(),
  })
  .strict();

const homeFeatureSchema = z
  .object({
    icon: z.string().min(1).optional(),
    title: z.string().min(1),
    details: z.string().min(1),
  })
  .strict();

const homeConfigSchema = z
  .object({
    title: z.string().min(1).optional(),
    tagline: z.string().min(1).optional(),
    description: z.string().min(1).optional(),
    actions: z.array(homeActionSchema).optional(),
    features: z.array(homeFeatureSchema).optional(),
  })
  .strict();

const footerConfigSchema = z
  .object({
    message: z.string().min(1).optional(),
    copyright: z.string().min(1).optional(),
  })
  .strict();

const siteMetadataSchema = z
  .object({
    url: z.string().min(1).optional(),
    title: z.string().min(1).optional(),
    description: z.string().min(1).optional(),
    favicon: z.string().min(1).optional(),
  })
  .strict();

const codeThemeSchema = z.union([
  z.string().min(1),
  z
    .object({
      light: z.string().min(1),
      dark: z.string().min(1),
    })
    .strict(),
]);

const markdownConfigSchema = z
  .object({
    codeTheme: codeThemeSchema.optional(),
  })
  .strict();

const searchConfigSchema = z
  .object({
    provider: z.enum(["local"]).optional(),
  })
  .strict();

const localeConfigSchema: z.ZodType<LocaleConfig> = z
  .object({
    label: z.string().min(1),
    lang: z.string().min(1).optional(),
    site: siteMetadataSchema.optional(),
    home: homeConfigSchema.optional(),
    nav: z.array(navItemSchema).optional(),
    socialLinks: z.array(navItemSchema).optional(),
    navbar: z.array(navItemSchema).optional(),
    sidebar: z.array(sidebarGroupSchema).optional(),
    footer: footerConfigSchema.optional(),
  })
  .strict();

export const siteConfigSchema = z
  .object({
    $schema: z.string().min(1).optional(),
    site: siteMetadataSchema.optional(),
    home: homeConfigSchema.optional(),
    nav: z.array(navItemSchema).optional(),
    socialLinks: z.array(navItemSchema).optional(),
    navbar: z.array(navItemSchema).optional(),
    sidebar: z.array(sidebarGroupSchema).optional(),
    footer: footerConfigSchema.optional(),
    markdown: markdownConfigSchema.optional(),
    search: searchConfigSchema.optional(),
    locales: z.record(z.string(), localeConfigSchema).optional(),
  })
  .strict();

export type SiteConfig = z.infer<typeof siteConfigSchema>;
export type LocaleConfig = {
  label: string;
  lang?: string;
  site?: z.infer<typeof siteMetadataSchema>;
  home?: z.infer<typeof homeConfigSchema>;
  nav?: z.infer<typeof navItemSchema>[];
  socialLinks?: z.infer<typeof navItemSchema>[];
  navbar?: z.infer<typeof navItemSchema>[];
  sidebar?: z.infer<typeof sidebarGroupSchema>[];
  footer?: z.infer<typeof footerConfigSchema>;
};

export const parseSiteConfig = (input: unknown) =>
  siteConfigSchema.safeParse(input);
