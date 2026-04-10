import type { APIRoute } from 'astro'
import { renderLlmsText } from '../lib/llms'

export const prerender = true

export const GET: APIRoute = async () => {
  const body = await renderLlmsText()

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
    },
  })
}
