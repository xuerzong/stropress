---
title: Getting Started
description: Start your documentation site
---

# Getting Started

Markdown files under `docs/` are rendered into static HTML pages.

## Install Stropress

If you want to add Stropress to your project, install it with npm:

```bash
npm install -D stropress
```

You can also try it directly without installing:

```bash
npx stropress dev --dir docs
```

## Run the Development Server

```bash
npx stropress dev --dir docs
```

This starts a local Astro dev server and watches your docs content for changes.

To run the dev server on a custom port:

```bash
npx stropress dev --dir docs --port 3000
PORT=3000 npx stropress dev --dir docs
```

## Build for Production

```bash
npx stropress build --dir docs
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
