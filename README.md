# stropress

`stropress` is an npm CLI built on Astro.

It reads markdown content from a target docs directory, loads `config.json` from that same directory, and builds a static HTML documentation site.

## Structure

- `themes/default`: bundled Astro default documentation theme
- `cli`: TypeScript CLI packaged with `tsup`

## Docs Directory

The target directory should contain:

- `config.json`
- `*.md` and `*.mdx` files
- Optional homepage overrides via `index.astro` and localized `*/index.astro`
- Optional global style overrides via `index.css`

Example:

```text
docs/
  config.json
  index.css
  index.md
  index.astro
  public/
    favicon.svg
  zh/
    index.astro
  guide/
    getting-started.md
    configuration.mdx
```

## Commands

From any project:

```bash
npx stropress dev --dir=docs
npx stropress build --dir=docs
```

`--dir` supports both relative and absolute paths.

If omitted, it defaults to `docs` under the current working directory.

If `docs/index.astro` exists, it overrides the JSON-driven homepage for `/`.
If `docs/zh/index.astro` exists, it overrides the locale homepage for `/zh/`.
If `docs/index.css` exists, it is injected globally after the theme styles so you can override `:root` variables and component styles.
If `docs/public/*` exists, those files are copied to the site root as static assets, for example `docs/public/favicon.svg` becomes `/favicon.svg` and overrides the theme default at the same path.
The generated site also exposes an auto-generated `llms.txt` endpoint built from the docs collection.

These files are rendered inside the default docs layout. You can optionally export `title`, `description`, `sidebar`, or `contentClass` from the Astro file frontmatter to control the surrounding page metadata and layout.

## config.json

```json
{
  "site": {
    "title": "Stropress Docs",
    "description": "Documentation site powered by stropress",
    "favicon": "/favicon.svg"
  },
  "home": {
    "title": "Build documentation that feels like a product",
    "tagline": "A fast Astro-powered docs theme and CLI with a VitePress-style landing page.",
    "description": "Point Stropress at any docs directory, define your navbar and sidebar in config.json, and generate a polished static documentation site with one command.",
    "actions": [
      {
        "text": "Get Started",
        "link": "/guide/getting-started",
        "theme": "brand"
      },
      {
        "text": "Configuration",
        "link": "/guide/configuration",
        "theme": "alt"
      }
    ],
    "features": [
      {
        "icon": "Rocket",
        "title": "Astro Native",
        "details": "Use Astro and MDX to render a fast static docs site without building a custom markdown pipeline."
      }
    ]
  },
  "navbar": [
    {
      "icon": "BookOpen",
      "label": "Guide",
      "link": "/guide/getting-started"
    }
  ],
  "sidebar": [
    {
      "icon": "PanelsTopLeft",
      "label": "Guide",
      "items": [
        {
          "icon": "PlayCircle",
          "label": "Getting Started",
          "link": "/guide/getting-started"
        }
      ]
    }
  ]
}
```

By default, the theme uses `/favicon.svg` from the bundled theme public assets. Set `site.favicon` to switch to a different public path. For localized sites, you can also set `locales["/zh/"].site.favicon` to override it per locale.

`home.features[].icon`, `navbar[].icon`, `sidebar[].icon`, and `sidebar[].items[].icon` all use Lucide icon names such as `Rocket`, `BookOpen`, or `PanelsTopLeft`.

## Local Development

```bash
bun install
bun run --cwd cli build
bun cli/src/index.ts dev --dir=docs
```
