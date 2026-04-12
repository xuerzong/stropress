import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { Resvg } = require('@resvg/resvg-js') as typeof import('@resvg/resvg-js')

export interface OgRenderInput {
  title: string
  description?: string
  siteTitle?: string
  routePath?: string
}

export const renderOgPng = async (input: OgRenderInput) => {
  const svg = await buildOgSvg({
    title: truncateText(input.title || 'Untitled', 84),
    description: truncateText(input.description || '', 160),
    siteTitle: truncateText(input.siteTitle || 'Stropress Docs', 60),
    routePath: input.routePath || '/preview',
  })

  return renderSvgToPng(svg)
}

const buildOgSvg = async (input: {
  title: string
  description: string
  siteTitle: string
  routePath: string
}) => {
  const routeText = input.routePath === '/' ? 'home' : input.routePath

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
