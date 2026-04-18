export interface CustomNotFoundModule {
  default: any
  title?: string
  description?: string
  sidebar?: boolean
  contentClass?: string
}

const customNotFoundModules = import.meta.glob<CustomNotFoundModule>(
  '../content/docs/**/404.astro'
)

const normalizePathname = (pathname: string) => {
  if (!pathname || pathname === '/') {
    return '/'
  }

  return pathname.endsWith('/') ? pathname : `${pathname}/`
}

const getCustomNotFoundModuleCandidates = (pathname: string) => {
  const normalizedPath = normalizePathname(pathname)
  const exactPath = `../content/docs${normalizedPath.slice(0, -1)}.astro`

  if (exactPath === '../content/docs/404.astro') {
    return [exactPath]
  }

  return [exactPath, '../content/docs/404.astro']
}

export const getCustomNotFoundModule = async (pathname: string) => {
  for (const modulePath of getCustomNotFoundModuleCandidates(pathname)) {
    const loader = customNotFoundModules[modulePath]
    if (loader) {
      return loader()
    }
  }

  return null
}
