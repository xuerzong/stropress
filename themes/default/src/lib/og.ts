import { constants as fsConstants } from 'node:fs'
import { access, readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import path from 'node:path'
import satori from 'satori'
import { html } from 'satori-html'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const { Resvg } = require('@resvg/resvg-js') as typeof import('@resvg/resvg-js')

interface LoadedFont {
  name: string
  data: ArrayBuffer
  weight: 400 | 700
  style: 'normal'
}

export interface OgRenderInput {
  title: string
  description?: string
  siteTitle?: string
  routePath?: string
}

let cachedOgFonts: LoadedFont[] | null = null

const moduleDir = path.dirname(fileURLToPath(import.meta.url))

export const renderOgPng = async (input: OgRenderInput) => {
  const fonts = await loadOgFonts()
  const svg = await buildOgSvg({
    title: truncateText(input.title || 'Untitled', 84),
    description: truncateText(input.description || '', 160),
    siteTitle: truncateText(input.siteTitle || 'Stropress Docs', 60),
    routePath: input.routePath || '/preview',
    fonts,
  })

  return renderSvgToPng(svg)
}

const loadOgFonts = async (): Promise<LoadedFont[]> => {
  if (cachedOgFonts) {
    return cachedOgFonts
  }

  const regularPath = await resolveFontsourceFontFile(
    '@fontsource/inter',
    '400'
  )
  const boldPath = await resolveFontsourceFontFile('@fontsource/inter', '700')

  const regular = await readFile(regularPath)
  const bold = await readFile(boldPath)

  cachedOgFonts = [
    {
      name: 'OG Sans',
      data: regular.buffer.slice(
        regular.byteOffset,
        regular.byteOffset + regular.byteLength
      ),
      weight: 400,
      style: 'normal',
    },
    {
      name: 'OG Sans',
      data: bold.buffer.slice(
        bold.byteOffset,
        bold.byteOffset + bold.byteLength
      ),
      weight: 700,
      style: 'normal',
    },
  ]

  return cachedOgFonts
}

const resolveFontsourceFontFile = async (
  packageName: string,
  weight: '400' | '700'
) => {
  const cssCandidates = [
    path.resolve(process.cwd(), `node_modules/${packageName}/${weight}.css`),
    path.resolve(
      process.cwd(),
      `themes/default/node_modules/${packageName}/${weight}.css`
    ),
    path.resolve(
      process.cwd(),
      `cli/node_modules/${packageName}/${weight}.css`
    ),
    path.resolve(moduleDir, `../node_modules/${packageName}/${weight}.css`),
    path.resolve(moduleDir, `../../node_modules/${packageName}/${weight}.css`),
  ]

  const cssPath = await resolvePathCandidate(cssCandidates)
  const cssContent = await readFile(cssPath, 'utf8')
  const fontUrl = extractFontUrlFromCss(cssContent)

  return path.resolve(path.dirname(cssPath), fontUrl)
}

const resolvePathCandidate = async (candidates: string[]) => {
  for (const candidate of candidates) {
    if (await pathExists(candidate)) {
      return candidate
    }
  }

  throw new Error(
    'Could not locate Fontsource CSS files for OG generation. Ensure @fontsource/inter is installed.'
  )
}

const pathExists = async (filePath: string) => {
  try {
    await access(filePath, fsConstants.R_OK)
    return true
  } catch {
    return false
  }
}

const extractFontUrlFromCss = (css: string) => {
  const match =
    css.match(
      /url\(([^)]+)\)\s+format\(['\"]?(woff2?|truetype|opentype)['\"]?\)/i
    ) || css.match(/url\(([^)]+)\)/i)

  if (!match) {
    throw new Error('Could not parse a font URL from Fontsource CSS.')
  }

  const rawUrl = match[1].trim().replace(/^['\"]|['\"]$/g, '')
  if (!rawUrl || rawUrl.startsWith('data:')) {
    throw new Error('Unsupported Fontsource URL format for OG generation.')
  }

  return rawUrl
}

const buildOgSvg = async (input: {
  title: string
  description: string
  siteTitle: string
  routePath: string
  fonts: LoadedFont[]
}) => {
  const routeText = input.routePath === '/' ? 'home' : input.routePath

  try {
    return await satori(
      html`<div
        style="
        width: 1200px;
        height: 630px;
        display: flex;
        position: relative;
        overflow: hidden;
        background: linear-gradient(120deg, #0f172a 0%, #1e293b 100%);
        color: #f8fafc;
        font-family: 'OG Sans';
        box-sizing: border-box;
        padding: 56px;
      "
      >
        <div
          style="
          width: 100%;
          height: 100%;
          border-radius: 24px;
          border: 1px solid rgba(148, 163, 184, 0.3);
          background: rgba(15, 23, 42, 0.68);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 42px;
          box-sizing: border-box;
        "
        >
          <div
            style="
            font-size: 30px;
            color: #93c5fd;
            font-weight: 700;
          "
          >
            ${input.siteTitle}
          </div>
          <div style="display: flex; flex-direction: column; gap: 18px;">
            <div
              style="
              font-size: 56px;
              color: #f8fafc;
              font-weight: 700;
              line-height: 1.2;
            "
            >
              ${input.title}
            </div>
            <div
              style="
              font-size: 30px;
              color: #cbd5e1;
              line-height: 1.45;
            "
            >
              ${input.description}
            </div>
          </div>
          <div
            style="
            font-size: 24px;
            color: #94a3b8;
          "
          >
            ${routeText}
          </div>
        </div>
      </div>`,
      {
        width: 1200,
        height: 630,
        fonts: input.fonts,
      }
    )
  } catch {
    // Fallback for environments where ultrahtml/satori-html has parser incompatibilities.
    return `<svg width="1200" height="630" viewBox="0 0 1200 630" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1200" y2="630" gradientUnits="userSpaceOnUse">
      <stop stop-color="#0f172a"/>
      <stop offset="1" stop-color="#1e293b"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect x="56" y="56" width="1088" height="518" rx="24" fill="rgba(15, 23, 42, 0.68)" stroke="rgba(148, 163, 184, 0.30)"/>
  <text x="96" y="132" fill="#93c5fd" font-size="30" font-family="Arial, sans-serif" font-weight="700">${escapeXml(input.siteTitle)}</text>
  <text x="96" y="228" fill="#f8fafc" font-size="56" font-family="Arial, sans-serif" font-weight="700">${escapeXml(input.title)}</text>
  <text x="96" y="304" fill="#cbd5e1" font-size="30" font-family="Arial, sans-serif" font-weight="400">${escapeXml(input.description)}</text>
  <text x="96" y="532" fill="#94a3b8" font-size="24" font-family="Arial, sans-serif" font-weight="400">${escapeXml(routeText)}</text>
</svg>`
  }
}

const renderSvgToPng = (svg: string) => {
  return new Resvg(svg, {
    fitTo: {
      mode: 'width',
      value: 1200,
    },
  })
    .render()
    .asPng()
}

const escapeXml = (value: string) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')

const truncateText = (value: string, maxLength: number) => {
  if (value.length <= maxLength) {
    return value
  }

  return `${value.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`
}
