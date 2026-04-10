import fs from "fs-extra";
import path from "node:path";
import type { SiteConfig } from "../config/schema";
import { resolveSiteUrl } from "./site-url";

interface WriteAstroConfigInput {
  cwd: string;
  themeDir: string;
  config: SiteConfig;
}

export const writeAstroRuntimeConfig = async (input: WriteAstroConfigInput) => {
  await fs.remove(path.join(input.themeDir, ".daoke"));
  const runtimeDir = path.join(input.themeDir, ".stropress");
  const runtimePublicDir = path.join(runtimeDir, "public");
  const astroConfigPath = path.join(runtimeDir, "astro.config.mjs");
  const serializedConfig = JSON.stringify(input.config);
  const siteUrl = resolveSiteUrl(input.config);
  const codeTheme = input.config.markdown?.codeTheme;
  const shikiConfig = codeTheme
    ? `,\n    shikiConfig: {\n      theme: ${JSON.stringify(codeTheme)}\n    }`
    : "";

  await fs.ensureDir(runtimeDir);

  const content = `import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import remarkGithubAlerts from "remark-github-alerts";

export default defineConfig({
  outDir: ${JSON.stringify(path.join(input.cwd, "dist"))},
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
  site: ${JSON.stringify(siteUrl)},
  vite: {
    define: {
      "import.meta.env.STROPRESS_SITE_CONFIG": ${JSON.stringify(serializedConfig)}
    }
  }
});
`;

  await fs.writeFile(astroConfigPath, content, "utf8");
  return astroConfigPath;
};
