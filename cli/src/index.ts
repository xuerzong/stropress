#!/usr/bin/env node
import { build, dev } from "astro";
import { program } from "commander";
import fs from "fs-extra";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { readSiteConfig } from "./config/loader";
import type { SiteConfig } from "./config/schema";
import { watchDocsChanges } from "./docs/change-watcher";
import { syncDocsContent } from "./docs/content-sync";
import { collectDocSources } from "./docs/source-collector";
import { writeAstroRuntimeConfig } from "./theme/runtime-config";
import { resolveThemeDir } from "./theme/directory-resolver";

interface RunOptions {
  dir: string;
}

const currentFilePath = fileURLToPath(import.meta.url);
const currentDir = path.dirname(currentFilePath);

const run = async (mode: "dev" | "build", options: RunOptions) => {
  const cwd = process.cwd();
  const docsDir = path.resolve(cwd, options.dir || "docs");
  const configPath = path.join(docsDir, "config.json");
  const themeDir = await resolveThemeDir(currentDir);
  const themeContentDir = path.join(themeDir, "src/content/docs");
  const themePublicDir = path.join(themeDir, ".stropress/public");

  const loadAstroConfig = async (config: SiteConfig) => {
    const astroConfigPath = await writeAstroRuntimeConfig({
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

  await syncDocsContent(docsDir, themeContentDir, themePublicDir);

  if (mode === "dev") {
    let devServer: Awaited<ReturnType<typeof dev>> | undefined;
    let restarting = false;
    let pendingRestart = false;

    const startDevServer = async () => {
      const config = await readSiteConfig(configPath);
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

    const stopWatching = watchDocsChanges({
      sourceDir: docsDir,
      targetDir: themeContentDir,
      publicDir: themePublicDir,
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

  const config = await readSiteConfig(configPath);
  const astroConfig = await loadAstroConfig(config);

  await build({
    ...astroConfig,
    root: themeDir,
    site: astroConfig.site,
    devOutput: "static",
  });
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
