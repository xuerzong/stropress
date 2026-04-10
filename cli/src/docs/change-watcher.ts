import { watch } from "node:fs";
import { syncDocsContent } from "./content-sync";

interface WatchDocsOptions {
  sourceDir: string;
  targetDir: string;
  publicDir: string;
  onConfigChange?: () => void | Promise<void>;
}

export const watchDocsChanges = (input: WatchDocsOptions) => {
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
      await syncDocsContent(input.sourceDir, input.targetDir, input.publicDir);
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

    timer = setTimeout(() => {
      runSync();
    }, 120);
  };

  const queueConfigRestart = () => {
    if (configTimer) {
      clearTimeout(configTimer);
    }

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
        normalizedPath !== "index.css" &&
        !normalizedPath.startsWith("public/") &&
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
