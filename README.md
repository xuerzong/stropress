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

Example:

```text
docs/
  config.json
  index.md
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

## config.json

```json
{
  "site": {
    "title": "Stropress Docs",
    "description": "Documentation site powered by stropress"
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
        "icon": "A",
        "title": "Astro Native",
        "details": "Use Astro and MDX to render a fast static docs site without building a custom markdown pipeline."
      }
    ]
  },
  "navbar": [
    {
      "label": "Guide",
      "link": "/guide/getting-started"
    }
  ],
  "sidebar": [
    {
      "label": "Guide",
      "items": [
        {
          "label": "Getting Started",
          "link": "/guide/getting-started"
        }
      ]
    }
  ]
}
```

## Local Development

```bash
bun install
bun run --cwd cli build
bun cli/src/index.ts dev --dir=docs
```