---
title: 快速开始
description: 快速启动你的文档站点
---

# 快速开始

`docs/` 目录下的 Markdown 文件会被渲染为静态页面。

## 安装 Stropress

如果你准备在项目中使用 Stropress，可以先通过 npm 安装：

```bash
npm install -D stropress
```

如果只是想快速体验，也可以直接使用：

```bash
npx stropress dev --dir docs
```

## 运行开发环境

```bash
npx stropress dev --dir docs
```

## 构建生产版本

```bash
npx stropress build --dir docs
```

## 目录建议

```text
docs/
  config.json
  index.md
  guide/
    getting-started.md
    configuration.mdx
```
