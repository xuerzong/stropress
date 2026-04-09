# stropress CLI

`stropress` is the CLI package for building an Astro-powered documentation site from a local docs directory.

It reads content from a target directory, loads `config.json` from the same place, copies supported source files into the bundled default theme, and then runs Astro in development or build mode.

## Install

```bash
bun add -D stropress
```

You can also run it without installing globally:

```bash
npx stropress dev
npx stropress build
```

## Commands

### `stropress dev`

Starts the Astro dev server and watches the docs directory for changes.

```bash
npx stropress dev --dir docs
```

### `stropress build`

Builds a static documentation site into `dist` under the current working directory.

```bash
npx stropress build --dir docs
```

### Options

- `--dir <dir>`: directory containing `config.json` and docs content. Defaults to `docs`.

The `--dir` value can be relative to the current working directory or an absolute path.

## Expected Docs Structure

```text
docs/
  config.json
  index.md
  index.css
  index.astro
  guide/
    getting-started.md
    configuration.mdx
  zh/
    index.md
  public/
    favicon.svg
```

Supported inputs:

- `*.md`
- `*.mdx`
- `index.astro` for a custom homepage
- localized `*/index.astro` homepages
- `index.css` for global style overrides
- `public/*` for static assets

If no supported docs files are found, the CLI exits with an error.

## `config.json`

Minimal example:

```json
{
  "site": {
    "url": "https://docs.example.com",
    "title": "Stropress",
    "description": "Astro-powered docs"
  },
  "home": {
    "title": "Build docs with Astro",
    "description": "Use markdown, MDX, and a bundled default theme."
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

Supported top-level fields used by the CLI and default theme:

- `site`: site metadata such as `url`, `title`, `description`, and `favicon`
- `home`: homepage content for the default landing page
- `locales`: localized site metadata overrides
- `navbar`: top navigation links
- `sidebar`: sidebar groups and links
- `markdown.codeTheme`: optional Shiki theme configuration

Notes:

- `site.url` should be a full URL such as `https://docs.example.com`
- if `site.url` is missing, development falls back to `http://localhost:4321`
- if `docs/index.astro` exists, it overrides the default homepage at `/`
- if `docs/<locale>/index.astro` exists, it overrides that locale homepage
- files under `docs/public` are copied to the final site root

## How It Works

When you run the CLI:

1. it resolves the bundled default theme
2. it reads `config.json` from the target docs directory
3. it copies supported docs files into the theme runtime content directory
4. it copies bundled public assets and then overlays `docs/public`
5. it generates a runtime Astro config
6. it starts Astro dev server or creates a production build

In `dev` mode, changes to docs content trigger sync, and changes to `config.json` trigger a dev server restart.

## Local Development

From the repository root:

```bash
bun install
bun run --cwd cli build
bun cli/src/index.ts dev --dir docs
```

Useful package scripts:

- `bun run --cwd cli build`
- `bun run --cwd cli dev`
- `bun run --cwd cli pack:check`
