import { existsSync, watch } from 'node:fs'
import path from 'node:path'
import { isHomepageAstroFile, isRootCustomStyleFile } from './file-classifier'
import { syncDocsContent } from './content-sync'

interface WatchDocsOptions {
  sourceDir: string
  projectDir: string
  targetDir: string
  publicDir: string
  onConfigChange?: () => void | Promise<void>
}

export const watchDocsChanges = (input: WatchDocsOptions) => {
  let syncTimer: NodeJS.Timeout | undefined
  let restartTimer: NodeJS.Timeout | undefined
  let running = false
  let pendingSync = false
  let pendingRestart = false

  const normalizePath = (value: string) => value.replaceAll('\\', '/')

  const isConfigChange = (filePath: string) =>
    normalizePath(filePath) === 'config.json'

  const isContentChange = (filePath: string) => {
    const normalizedPath = normalizePath(filePath)

    if (/\.(md|mdx)$/i.test(normalizedPath)) {
      return true
    }

    if (/\.astro$/i.test(normalizedPath)) {
      return true
    }

    if (normalizedPath.startsWith('public/')) {
      return true
    }

    if (isRootCustomStyleFile(`docs/${normalizedPath}`)) {
      return true
    }

    return isHomepageAstroFile(normalizedPath)
  }

  const runSync = async () => {
    try {
      await syncDocsContent(
        input.sourceDir,
        input.targetDir,
        input.projectDir,
        input.publicDir
      )
      console.log('[stropress] Synced docs changes.')
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      console.error(`[stropress] Failed to sync docs changes: ${message}`)
    }
  }

  const runRestart = async () => {
    try {
      await syncDocsContent(
        input.sourceDir,
        input.targetDir,
        input.projectDir,
        input.publicDir
      )
      await input.onConfigChange?.()
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      console.error(
        `[stropress] Failed to restart after config changes: ${message}`
      )
    }
  }

  const flushQueue = async () => {
    if (running) {
      return
    }

    running = true
    try {
      while (pendingRestart || pendingSync) {
        if (pendingRestart) {
          pendingRestart = false
          pendingSync = false
          await runRestart()
          continue
        }

        pendingSync = false
        await runSync()
      }
    } finally {
      running = false
    }
  }

  const queueSync = () => {
    pendingSync = true

    if (syncTimer) {
      clearTimeout(syncTimer)
    }

    syncTimer = setTimeout(() => {
      void flushQueue()
    }, 120)
  }

  const queueConfigRestart = () => {
    pendingRestart = true

    if (restartTimer) {
      clearTimeout(restartTimer)
    }

    restartTimer = setTimeout(() => {
      void flushQueue()
    }, 160)
  }

  const handleChangedPath = (changedPath: string) => {
    if (!changedPath) {
      queueSync()
      return
    }

    if (isConfigChange(changedPath)) {
      queueConfigRestart()
      return
    }

    if (!isContentChange(changedPath)) {
      return
    }

    queueSync()
  }

  const watcher = watch(
    input.sourceDir,
    { recursive: true },
    (_eventType, filename) => {
      const changedPath = typeof filename === 'string' ? filename : ''

      handleChangedPath(changedPath)
    }
  )

  const projectPublicDir = path.join(input.projectDir, 'public')
  const publicWatcher = existsSync(projectPublicDir)
    ? watch(projectPublicDir, { recursive: true }, (_eventType, filename) => {
        const changedPath =
          typeof filename === 'string' ? `public/${filename}` : ''

        handleChangedPath(changedPath)
      })
    : null

  console.log(`[stropress] Watching docs changes: ${input.sourceDir}`)
  return () => {
    watcher.close()
    publicWatcher?.close()
    if (syncTimer) {
      clearTimeout(syncTimer)
    }
    if (restartTimer) {
      clearTimeout(restartTimer)
    }
  }
}
