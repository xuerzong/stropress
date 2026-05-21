export const setupSidebarDrawer = () => {
  const drawer = document.querySelector('[data-sidebar-drawer]')
  const backdrop = document.querySelector('[data-sidebar-backdrop]')
  const toggle = document.querySelector('[data-sidebar-toggle]')

  if (!(drawer instanceof HTMLElement)) {
    return () => {}
  }

  if (!(backdrop instanceof HTMLElement)) {
    return () => {}
  }

  if (!(toggle instanceof HTMLElement)) {
    return () => {}
  }

  const linkElements = Array.from(drawer.querySelectorAll('a'))

  const setOpen = (open: boolean) => {
    drawer.dataset.state = open ? 'open' : 'closed'
    backdrop.dataset.state = open ? 'open' : 'closed'
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false')
    document.body.style.overflow = open ? 'hidden' : ''
  }

  const close = () => setOpen(false)
  const onToggle = () => setOpen(drawer.dataset.state !== 'open')
  const onKeydown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      close()
    }
  }
  const onResize = () => {
    if (window.innerWidth > 900) {
      close()
    }
  }

  toggle.addEventListener('click', onToggle)
  backdrop.addEventListener('click', close)
  linkElements.forEach((element) => element.addEventListener('click', close))
  document.addEventListener('keydown', onKeydown)
  window.addEventListener('resize', onResize)

  return () => {
    toggle.removeEventListener('click', onToggle)
    backdrop.removeEventListener('click', close)
    linkElements.forEach((element) => element.removeEventListener('click', close))
    document.removeEventListener('keydown', onKeydown)
    window.removeEventListener('resize', onResize)
    document.body.style.overflow = ''
  }
}