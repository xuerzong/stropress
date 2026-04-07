---
title: 快速开始
description: 快速启动你的文档站点
---

# 快速开始

`docs/` 目录下的 Markdown 文件会被渲染为静态页面。

## 运行开发环境

```bash
bun run dev --dir=docs
```

## 构建生产版本

```bash
bun run build --dir=docs
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
