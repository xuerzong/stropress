#!/usr/bin/env node
import { build, dev } from "astro";
import { program } from "commander";
import fs from "fs-extra";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

interface NavItem {
  label: string;
  link: string;
}

interface SidebarGroup {
  label: string;
  items: NavItem[];
}

interface SiteConfig {
  site?: {
    title?: string;
    description?: string;
  };
  navbar?: NavItem[];
  sidebar?: SidebarGroup[];
}

interface RunOptions {
  dir: string;
}

const currentFilePath = fileURLToPath(import.meta.url);
const currentDir = path.dirname(currentFilePath);

async function run(mode: "dev" | "build", options: RunOptions) {
  const cwd = process.cwd();
  const docsDir = path.resolve(cwd, options.dir || "docs");
  const configPath = path.join(docsDir, "config.json");
  const themeDir = await resolveThemeDir();
  const themeContentDir = path.join(themeDir, "src/content/docs");

  if (!(await fs.pathExists(themeDir))) {
    throw new Error(`Missing theme directory: ${themeDir}`);
  }

  if (!(await fs.pathExists(docsDir))) {
    throw new Error(`Missing docs directory: ${docsDir}`);
  }

  const docs = await collectDocs(docsDir);
  if (docs.length === 0) {
    throw new Error("No .md or .mdx files found under docs/");
  }

  const config = await readConfig(configPath);
  await syncDocs(docsDir, themeContentDir);

  const astroConfigPath = await writeAstroConfig({
    cwd,
    themeDir,
    config,
  });
  const astroConfigModule = await import(pathToFileURL(astroConfigPath).href);
  const astroConfig = astroConfigModule.default;

  if (mode === "dev") {
    await dev({
      ...astroConfig,
      root: themeDir,
      site: astroConfig.site,
      devOutput: "static",
    });
    return;
  }

  await build({
    ...astroConfig,
    root: themeDir,
    site: astroConfig.site,
    devOutput: "static",
  });
}

async function resolveThemeDir() {
  const candidates = [
    path.resolve(currentDir, "../theme-default"),
    path.resolve(currentDir, "../../themes/default"),
  ];

  for (const candidate of candidates) {
    if (await fs.pathExists(candidate)) {
      return candidate;
    }
  }

  throw new Error("Missing bundled default theme");
}

async function collectDocs(currentDir: string): Promise<string[]> {
  const entries = await fs.readdir(currentDir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    if (entry.name === "config.json") {
      continue;
    }

    const fullPath = path.join(currentDir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectDocs(fullPath)));
      continue;
    }

    if (/\.(md|mdx)$/i.test(entry.name)) {
      files.push(fullPath);
    }
  }

  return files;
}

async function readConfig(configPath: string): Promise<SiteConfig> {
  if (!(await fs.pathExists(configPath))) {
    return {};
  }

  return fs.readJson(configPath) as Promise<SiteConfig>;
}

async function syncDocs(sourceDir: string, targetDir: string) {
  await fs.emptyDir(targetDir);
  await copyDocsRecursive(sourceDir, targetDir);
}

async function copyDocsRecursive(sourceDir: string, targetDir: string) {
  const entries = await fs.readdir(sourceDir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.name === "config.json") {
      continue;
    }

    const sourcePath = path.join(sourceDir, entry.name);
    const targetPath = path.join(targetDir, entry.name);

    if (entry.isDirectory()) {
      await fs.ensureDir(targetPath);
      await copyDocsRecursive(sourcePath, targetPath);
      continue;
    }

    if (/\.(md|mdx)$/i.test(entry.name)) {
      await fs.ensureDir(path.dirname(targetPath));
      await fs.copyFile(sourcePath, targetPath);
    }
  }
}

async function writeAstroConfig(input: {
  cwd: string;
  themeDir: string;
  config: SiteConfig;
}) {
  await fs.remove(path.join(input.themeDir, ".daoke"));
  const runtimeDir = path.join(input.themeDir, ".stropress");
  const astroConfigPath = path.join(runtimeDir, "astro.config.mjs");
  const serializedConfig = JSON.stringify(input.config);

  await fs.ensureDir(runtimeDir);

  const content = `import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import remarkGithubAlerts from "remark-github-alerts";

export default defineConfig({
  outDir: ${JSON.stringify(path.join(input.cwd, "dist"))},
  markdown: {
    remarkPlugins: [remarkGithubAlerts]
  },
  integrations: [
    mdx({
      remarkPlugins: [remarkGithubAlerts]
    })
  ],
  site: "http://localhost:4321",
  vite: {
    define: {
      "import.meta.env.STROPRESS_SITE_CONFIG": ${JSON.stringify(serializedConfig)}
    }
  }
});
`;

  await fs.writeFile(astroConfigPath, content, "utf8");
  return astroConfigPath;
}

program
  .name("stropress")
  .description("Build Astro docs from a local docs directory");

function registerCommand(name: "dev" | "build") {
  program
    .command(name)
    .option(
      "--dir <dir>",
      "Directory containing docs content and config.json",
      "docs",
    )
    .action(async (options: RunOptions) => run(name, options));
}

registerCommand("dev");
registerCommand("build");

program.parseAsync(process.argv).catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[stropress] ${message}`);
  process.exitCode = 1;
});
