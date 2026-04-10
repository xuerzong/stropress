const customStyleModules = import.meta.glob<string>(
  '../content/docs/index.css',
  {
    query: '?raw',
    import: 'default',
    eager: true,
  }
)

export const customGlobalStyle = customStyleModules['../content/docs/index.css']
