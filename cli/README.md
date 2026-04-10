# Stropress

Vitepress, but powered by [Astro](https://astro.build/).

## Install

```bash
npx stropress dev --dir docs
npx stropress build --dir docs
```

Or install locally:

```bash
bun add -D stropress
bun stropress dev --dir docs
bun stropress build --dir docs
```

## Commands

- `dev`: Start dev server with hot reload
- `build`: Build to `dist/`

## Options

- `--dir <dir>`: Target docs directory (default: `docs`)

## Documentation

For full documentation including config, structure, and customization, see [Stropress](https://stropress.xuco.me)

## Development

```bash
bun install
bun run --cwd cli build
bun cli/src/index.ts dev --dir docs
```
