# Stropress

Vitepress, but powered by [Astro](https://astro.build/).

## Install

Use `npx` to try Stropress without adding it to your project:

```bash
npx stropress dev --dir docs
npx stropress build --dir docs
```

Or install it locally with npm:

```bash
npm install -D stropress
npx stropress dev --dir docs
npx stropress build --dir docs
```

## Documentation

For full documentation, see [Stropress](https://stropress.xuco.me).

## Structure

- `packages/ui`: Default Astro documentation theme package
- `cli`: TypeScript CLI

## Release

This repository publishes `@stropress/ui` and `stropress` through GitHub Actions.

- Add `NPM_TOKEN` to the repository secrets.
- Keep `cli/package.json` and `packages/ui/package.json` on the same `version`.
- Create and push a tag in the format `v<version>`, for example `v0.0.4`.

The workflow validates that the tag version matches both package versions, then publishes `@stropress/ui` first and `stropress` second.
