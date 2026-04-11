import type { APIRoute } from 'astro'
import { getCollection, type CollectionEntry } from 'astro:content'
import { getResolvedSiteConfig } from '../../lib/config'
import { renderOgPng } from '../../lib/og'

interface OgRouteProps {
  title: string
  description: string
  siteTitle: string
  routePath: string
}

export const prerender = true

export const getStaticPaths = async () => {
  const docs = await getCollection('docs')

  return docs.map((entry) => {
    const routePath = getRoutePathFromEntry(entry)

    return {
      params: {
        slug: routePathToOgSlug(routePath),
      },
      props: {
        title: entry.data.title,
        description: entry.data.description || '',
        siteTitle: getResolvedSiteConfig(routePath).siteTitle,
        routePath,
      } satisfies OgRouteProps,
    }
  })
}

export const GET: APIRoute = async ({ props }) => {
  const data = props as OgRouteProps
  const png = await renderOgPng({
    title: data.title,
    description: data.description,
    siteTitle: data.siteTitle,
    routePath: data.routePath,
  })

  return new Response(Buffer.from(png), {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  })
}

const getRoutePathFromEntry = (entry: CollectionEntry<'docs'>) => {
  if (entry.id === 'index') {
    return '/'
  }

  if (entry.id.endsWith('/index')) {
    return `/${entry.id.slice(0, -'/index'.length)}`
  }

  return `/${entry.id}`
}

const routePathToOgSlug = (routePath: string) => {
  if (routePath === '/') {
    return 'index'
  }

  return routePath.slice(1)
}
