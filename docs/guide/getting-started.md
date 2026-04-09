---
title: Getting Started
description: Start your documentation site
---

# Getting Started

Markdown files under `docs/` are rendered into static HTML pages.

## Run the Development Server

```bash
bun run dev --dir=docs
```

This starts a local Astro dev server and watches your docs content for changes.

## Build for Production

```bash
bun run build --dir=docs
```

The generated site is written to the build output directory as a static site.

## Recommended Directory Structure

```text
docs/
	config.json
	index.md
	guide/
		getting-started.md
		configuration.mdx
```

## Next Step

Once the basic structure is in place, continue with the configuration guide to set up navigation, sidebar items, homepage content, and locales.
