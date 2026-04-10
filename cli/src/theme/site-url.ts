interface SiteUrlConfig {
  site?: {
    url?: string
  }
}

export const resolveSiteUrl = (config: SiteUrlConfig) => {
  const configuredUrl = config.site?.url?.trim()

  if (!configuredUrl) {
    return 'http://localhost:4321'
  }

  try {
    return new URL(configuredUrl).toString()
  } catch {
    throw new Error(
      `Invalid site.url in config.json: ${configuredUrl}. Expected a full URL such as https://docs.example.com`
    )
  }
}
