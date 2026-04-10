const normalizePath = (filePath: string) => filePath.replaceAll('\\', '/')

export const isHomepageAstroFile = (filePath: string) => {
  const normalizedPath = normalizePath(filePath)
  return /(^|\/)index\.astro$/i.test(normalizedPath)
}

export const isRootCustomStyleFile = (filePath: string) => {
  const normalizedPath = normalizePath(filePath)
  return /(^|\/)docs\/index\.css$/i.test(normalizedPath)
}

export const isSupportedDocFile = (fileName: string, filePath: string) => {
  if (/\.(md|mdx)$/i.test(fileName)) {
    return true
  }

  if (fileName === 'index.css' && isRootCustomStyleFile(filePath)) {
    return true
  }

  return fileName === 'index.astro' && isHomepageAstroFile(filePath)
}
