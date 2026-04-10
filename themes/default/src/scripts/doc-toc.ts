type TocItem = HTMLElement & { dataset: DOMStringMap }

let initialized = false
let cleanup: (() => void) | null = null

const activateFromViewport = (items: TocItem[], headings: HTMLElement[]) => {
  if (headings.length === 0) {
    return
  }

  const offset = 140
  let currentId = headings[0].id

  for (const heading of headings) {
    if (heading.getBoundingClientRect().top - offset <= 0) {
      currentId = heading.id
    } else {
      break
    }
  }

  for (const item of items) {
    const isActive = item.dataset.targetId === currentId
    item.dataset.state = isActive ? 'active' : 'inactive'
    item
      .querySelector<HTMLAnchorElement>('.doc-toc-link')
      ?.setAttribute('aria-current', isActive ? 'location' : 'false')
  }
}

const mountToc = () => {
  cleanup?.()

  const items = Array.from(document.querySelectorAll<TocItem>('.doc-toc-item'))
  if (items.length === 0) {
    cleanup = null
    return
  }

  const headings = items
    .map((item) => item.dataset.targetId)
    .filter((id): id is string => Boolean(id))
    .map((id) => document.getElementById(id))
    .filter((heading): heading is HTMLElement => heading instanceof HTMLElement)

  if (headings.length === 0) {
    cleanup = null
    return
  }

  let rafId = 0
  const onScroll = () => {
    if (rafId) {
      return
    }

    rafId = window.requestAnimationFrame(() => {
      rafId = 0
      activateFromViewport(items, headings)
    })
  }

  const onHashChange = () => {
    const hash = window.location.hash
    if (!hash) {
      return
    }

    const id = decodeURIComponent(hash.slice(1))
    for (const item of items) {
      const isActive = item.dataset.targetId === id
      item.dataset.state = isActive ? 'active' : 'inactive'
      item
        .querySelector<HTMLAnchorElement>('.doc-toc-link')
        ?.setAttribute('aria-current', isActive ? 'location' : 'false')
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', onScroll)
  window.addEventListener('hashchange', onHashChange)

  onHashChange()
  activateFromViewport(items, headings)

  cleanup = () => {
    if (rafId) {
      window.cancelAnimationFrame(rafId)
      rafId = 0
    }

    window.removeEventListener('scroll', onScroll)
    window.removeEventListener('resize', onScroll)
    window.removeEventListener('hashchange', onHashChange)
  }
}

export const setupDocToc = () => {
  mountToc()

  if (initialized) {
    return
  }

  initialized = true
  document.addEventListener('astro:page-load', mountToc)
}
