interface ImportMetaEnv {
  readonly STROPRESS_SITE_CONFIG?: string | Record<string, unknown>
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
