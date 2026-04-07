import fs from "fs-extra";
import path from "node:path";
import { Resvg } from "@resvg/resvg-js";

interface SiteConfig {
  site?: {
    title?: string;
    description?: string;
  };
  locales?: Record<
    string,
    {
      site?: {
        title?: string;
        description?: string;
      };
    }
  >;
}

interface GenerateOgImagesInput {
  docsDir: string;
  outputDir: string;
  config: SiteConfig;
}

export interface OgPreviewInput {
  title: string;
  description?: string;
  siteTitle?: string;
  routePath?: string;
}

export const generateOgImages = async (input: GenerateOgImagesInput) => {
  await fs.remove(input.outputDir);
  await fs.ensureDir(input.outputDir);

  const docsFiles = await collectMarkdownFiles(input.docsDir);
  for (const filePath of docsFiles) {
    const routePath = getRoutePathFromFile(input.docsDir, filePath);
    const docMeta = await readDocMeta(filePath);
    const siteTitle = getSiteTitleForRoute(routePath, input.config);

    const title = truncateText(docMeta.title || siteTitle, 84);
    const description = truncateText(
      docMeta.description || input.config.site?.description || "",
      160,
    );

    const svg = buildOgSvg({
      title,
      description,
      siteTitle,
      routePath,
    });
    const png = renderSvgToPng(svg);

    const outputPath = path.join(
      input.outputDir,
      `${routePathToFileStem(routePath)}.png`,
    );
    await fs.ensureDir(path.dirname(outputPath));
    await fs.writeFile(outputPath, png);
  }

  console.log(`[stropress] Generated ${docsFiles.length} OG images.`);
};

export const renderOgPng = (input: OgPreviewInput) => {
  const svg = buildOgSvg({
    title: truncateText(input.title || "Untitled", 84),
    description: truncateText(input.description || "", 160),
    siteTitle: truncateText(input.siteTitle || "Stropress Docs", 60),
    routePath: input.routePath || "/preview",
  });

  return renderSvgToPng(svg);
};

const collectMarkdownFiles = async (currentDir: string): Promise<string[]> => {
  const entries = await fs.readdir(currentDir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    if (entry.name === "config.json") {
      continue;
    }

    const fullPath = path.join(currentDir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectMarkdownFiles(fullPath)));
      continue;
    }

    if (/\.(md|mdx)$/i.test(entry.name)) {
      files.push(fullPath);
    }
  }

  return files;
};

const getRoutePathFromFile = (docsDir: string, filePath: string) => {
  const relativePath = normalizePath(path.relative(docsDir, filePath));
  const withoutExtension = relativePath.replace(/\.(md|mdx)$/i, "");

  if (withoutExtension === "index") {
    return "/";
  }

  if (withoutExtension.endsWith("/index")) {
    return `/${withoutExtension.slice(0, -"/index".length)}`;
  }

  return `/${withoutExtension}`;
};

const routePathToFileStem = (routePath: string) => {
  if (routePath === "/") {
    return "index";
  }

  return routePath.slice(1);
};

const getSiteTitleForRoute = (routePath: string, config: SiteConfig) => {
  const localeEntries = Object.entries(config.locales || {}).map(
    ([key, value]) => [normalizeLocaleKey(key), value] as const,
  );

  localeEntries.sort((a, b) => b[0].length - a[0].length);

  const matched = localeEntries.find(([localeKey]) => {
    if (localeKey === "/") {
      return true;
    }

    return (
      routePath === localeKey.slice(0, -1) ||
      routePath.startsWith(localeKey.slice(0, -1) + "/")
    );
  });

  return matched?.[1].site?.title || config.site?.title || "Stropress Docs";
};

const normalizeLocaleKey = (key: string) => {
  if (key === "/") {
    return "/";
  }

  const prefixed = key.startsWith("/") ? key : `/${key}`;
  return prefixed.endsWith("/") ? prefixed : `${prefixed}/`;
};

const readDocMeta = async (filePath: string) => {
  const raw = await fs.readFile(filePath, "utf8");
  const frontmatterMatch = raw.match(/^---\n([\s\S]*?)\n---/);
  const frontmatter = frontmatterMatch?.[1] || "";

  const title =
    extractFrontmatterField(frontmatter, "title") ||
    extractHeading(raw) ||
    fallbackTitleFromFile(filePath);
  const description = extractFrontmatterField(frontmatter, "description") || "";

  return {
    title,
    description,
  };
};

const extractFrontmatterField = (frontmatter: string, field: string) => {
  const regex = new RegExp(`^${field}:\\s*(.+)$`, "m");
  const match = frontmatter.match(regex);
  if (!match) {
    return "";
  }

  return match[1].trim().replace(/^['\"]|['\"]$/g, "");
};

const extractHeading = (raw: string) => {
  const headingMatch = raw.match(/^#\s+(.+)$/m);
  return headingMatch?.[1]?.trim() || "";
};

const fallbackTitleFromFile = (filePath: string) => {
  const stem = path.basename(filePath, path.extname(filePath));
  if (stem === "index") {
    return "Home";
  }

  return stem.replace(/[-_]/g, " ");
};

const buildOgSvg = (input: {
  title: string;
  description: string;
  siteTitle: string;
  routePath: string;
}) => {
  const title = escapeXml(input.title);
  const description = escapeXml(input.description);
  const siteTitle = escapeXml(input.siteTitle);
  const routeText = escapeXml(
    input.routePath === "/" ? "home" : input.routePath,
  );

  return `<svg width="1200" height="630" viewBox="0 0 1200 630" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1200" y2="630" gradientUnits="userSpaceOnUse">
      <stop stop-color="#0f172a"/>
      <stop offset="1" stop-color="#1e293b"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <circle cx="1030" cy="110" r="240" fill="#38bdf8" fill-opacity="0.14"/>
  <circle cx="220" cy="640" r="300" fill="#22c55e" fill-opacity="0.12"/>
  <rect x="72" y="72" width="1056" height="486" rx="24" fill="rgba(15, 23, 42, 0.68)" stroke="rgba(148, 163, 184, 0.30)"/>
  <text x="112" y="146" fill="#93c5fd" font-size="30" font-family="Inter, Arial, sans-serif" font-weight="700">${siteTitle}</text>
  <text x="112" y="244" fill="#f8fafc" font-size="56" font-family="Inter, Arial, sans-serif" font-weight="800">${title}</text>
  <text x="112" y="322" fill="#cbd5e1" font-size="30" font-family="Inter, Arial, sans-serif" font-weight="500">${description}</text>
  <text x="112" y="512" fill="#94a3b8" font-size="24" font-family="Inter, Arial, sans-serif" font-weight="500">${routeText}</text>
</svg>`;
};

const renderSvgToPng = (svg: string) => {
  return new Resvg(svg, {
    fitTo: {
      mode: "width",
      value: 1200,
    },
  })
    .render()
    .asPng();
};

const escapeXml = (value: string) => {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
};

const normalizePath = (value: string) => {
  return value.replaceAll("\\", "/");
};

const truncateText = (value: string, maxLength: number) => {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`;
};
