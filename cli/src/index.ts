#!/usr/bin/env node
import { build, dev } from "astro";
import { program } from "commander";
import fs from "fs-extra";
import { watch } from "node:fs";
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

type CodeThemeConfig =
  | string
  | {
      light: string;
      dark: string;
    };

interface MarkdownConfig {
  codeTheme?: CodeThemeConfig;
}

interface SiteConfig {
  site?: {
    url?: string;
    title?: string;
    description?: string;
  };
  home?: {
    title?: string;
    description?: string;
  };
  locales?: Record<
    string,
    {
      site?: {
        title?: string;
        description?: string;
      };
    }
  >;
  navbar?: NavItem[];
  sidebar?: SidebarGroup[];
  markdown?: MarkdownConfig;
}

interface RunOptions {
  dir: string;
}

const currentFilePath = fileURLToPath(import.meta.url);
const currentDir = path.dirname(currentFilePath);

const run = async (mode: "dev" | "build", options: RunOptions) => {
  const cwd = process.cwd();
  const docsDir = path.resolve(cwd, options.dir || "docs");
  const configPath = path.join(docsDir, "config.json");
  const themeDir = await resolveThemeDir();
  const themeContentDir = path.join(themeDir, "src/content/docs");

  const loadAstroConfig = async (config: SiteConfig) => {
    const astroConfigPath = await writeAstroConfig({
      cwd,
      themeDir,
      config,
    });
    const astroConfigModule = await import(
      `${pathToFileURL(astroConfigPath).href}?t=${Date.now()}`
    );
    return astroConfigModule.default;
  };

  if (!(await fs.pathExists(themeDir))) {
    throw new Error(`Missing theme directory: ${themeDir}`);
  }

  if (!(await fs.pathExists(docsDir))) {
    throw new Error(`Missing docs directory: ${docsDir}`);
  }

  const docSources = await collectDocSources(docsDir);
  if (docSources.length === 0) {
    throw new Error(
      "No supported docs files found under docs/. Add .md/.mdx content or index.astro homepage files.",
    );
  }

  await syncDocs(docsDir, themeContentDir);

  if (mode === "dev") {
    let devServer: Awaited<ReturnType<typeof dev>> | undefined;
    let restarting = false;
    let pendingRestart = false;

    const startDevServer = async () => {
      const config = await readConfig(configPath);
      const astroConfig = await loadAstroConfig(config);

      devServer = await dev({
        ...astroConfig,
        root: themeDir,
        site: astroConfig.site,
        devOutput: "static",
      });
    };

    const restartDevServer = async () => {
      if (restarting) {
        pendingRestart = true;
        return;
      }

      restarting = true;
      try {
        console.log(
          "[stropress] Detected config.json changes. Restarting dev server...",
        );
        if (devServer) {
          await devServer.stop();
        }
        await startDevServer();
        console.log("[stropress] Dev server restarted.");
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`[stropress] Failed to restart dev server: ${message}`);
      } finally {
        restarting = false;
        if (pendingRestart) {
          pendingRestart = false;
          restartDevServer();
        }
      }
    };

    await startDevServer();

    const stopWatching = watchDocsForChanges({
      sourceDir: docsDir,
      targetDir: themeContentDir,
      onConfigChange: restartDevServer,
    });

    const shutdown = () => {
      stopWatching();
      if (devServer) {
        devServer.stop();
      }
    };

    process.once("SIGINT", shutdown);
    process.once("SIGTERM", shutdown);
    return;
  }

  const config = await readConfig(configPath);
  const astroConfig = await loadAstroConfig(config);

  await build({
    ...astroConfig,
    root: themeDir,
    site: astroConfig.site,
    devOutput: "static",
  });
};

const resolveThemeDir = async () => {
  const candidates = [
    path.resolve(currentDir, "theme-default"),
    path.resolve(currentDir, "../theme-default"),
    path.resolve(currentDir, "../../themes/default"),
  ];

  for (const candidate of candidates) {
    if (await fs.pathExists(candidate)) {
      return candidate;
    }
  }

  throw new Error("Missing bundled default theme");
};

const collectDocSources = async (currentDir: string): Promise<string[]> => {
  const entries = await fs.readdir(currentDir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    if (entry.name === "config.json") {
      continue;
    }

    const fullPath = path.join(currentDir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectDocSources(fullPath)));
      continue;
    }

    if (isSupportedDocFile(entry.name, fullPath)) {
      files.push(fullPath);
    }
  }

  return files;
};

const isSupportedDocFile = (fileName: string, filePath: string) => {
  if (/\.(md|mdx)$/i.test(fileName)) {
    return true;
  }

  return fileName === "index.astro" && isHomepageAstroFile(filePath);
};

const isHomepageAstroFile = (filePath: string) => {
  const normalizedPath = filePath.replaceAll("\\", "/");
  return /(^|\/)index\.astro$/i.test(normalizedPath);
};

const readConfig = async (configPath: string): Promise<SiteConfig> => {
  if (!(await fs.pathExists(configPath))) {
    return {};
  }

  return fs.readJson(configPath) as Promise<SiteConfig>;
};

const syncDocs = async (sourceDir: string, targetDir: string) => {
  await fs.emptyDir(targetDir);
  await copyDocsRecursive(sourceDir, targetDir);
};

const watchDocsForChanges = (input: {
  sourceDir: string;
  targetDir: string;
  onConfigChange?: () => void | Promise<void>;
}) => {
  let timer: NodeJS.Timeout | undefined;
  let configTimer: NodeJS.Timeout | undefined;
  let syncing = false;
  let pending = false;

  const runSync = async () => {
    if (syncing) {
      pending = true;
      return;
    }

    syncing = true;
    try {
      await syncDocs(input.sourceDir, input.targetDir);
      console.log("[stropress] Synced docs changes.");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[stropress] Failed to sync docs changes: ${message}`);
    } finally {
      syncing = false;
      if (pending) {
        pending = false;
        runSync();
      }
    }
  };

  const queueSync = () => {
    if (timer) {
      clearTimeout(timer);
    }

    // Debounce fast consecutive writes from editors.
    timer = setTimeout(() => {
      runSync();
    }, 120);
  };

  const queueConfigRestart = () => {
    if (configTimer) {
      clearTimeout(configTimer);
    }

    // Debounce duplicate fs events so one save causes one restart.
    configTimer = setTimeout(() => {
      input.onConfigChange?.();
    }, 160);
  };

  const watcher = watch(
    input.sourceDir,
    { recursive: true },
    (_eventType, filename) => {
      const changedPath = typeof filename === "string" ? filename : "";
      const normalizedPath = changedPath.replaceAll("\\", "/");

      if (!changedPath) {
        queueSync();
        return;
      }

      if (normalizedPath === "config.json") {
        queueConfigRestart();
        return;
      }

      if (
        !/\.(md|mdx)$/i.test(normalizedPath) &&
        !(
          normalizedPath.endsWith("/index.astro") ||
          normalizedPath === "index.astro"
        )
      ) {
        return;
      }

      queueSync();
    },
  );

  console.log(`[stropress] Watching docs changes: ${input.sourceDir}`);
  return () => {
    watcher.close();
    if (timer) {
      clearTimeout(timer);
    }
    if (configTimer) {
      clearTimeout(configTimer);
    }
  };
};

const copyDocsRecursive = async (sourceDir: string, targetDir: string) => {
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

    if (isSupportedDocFile(entry.name, sourcePath)) {
      await fs.ensureDir(path.dirname(targetPath));
      await fs.copyFile(sourcePath, targetPath);
    }
  }
};

const writeAstroConfig = async (input: {
  cwd: string;
  themeDir: string;
  config: SiteConfig;
}) => {
  await fs.remove(path.join(input.themeDir, ".daoke"));
  const runtimeDir = path.join(input.themeDir, ".stropress");
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

const resolveSiteUrl = (config: SiteConfig) => {
  const configuredUrl = config.site?.url?.trim();

  if (!configuredUrl) {
    return "http://localhost:4321";
  }

  try {
    return new URL(configuredUrl).toString();
  } catch {
    throw new Error(
      `Invalid site.url in config.json: ${configuredUrl}. Expected a full URL such as https://docs.example.com`,
    );
  }
};

program
  .name("stropress")
  .description("Build Astro docs from a local docs directory");

const registerCommand = (name: "dev" | "build") => {
  program
    .command(name)
    .option(
      "--dir <dir>",
      "Directory containing docs content and config.json",
      "docs",
    )
    .action(async (options: RunOptions) => run(name, options));
};

registerCommand("dev");
registerCommand("build");

program.parseAsync(process.argv).catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[stropress] ${message}`);
  process.exitCode = 1;
});
