import { getCollection, type CollectionEntry } from "astro:content";
import { getResolvedSiteConfig, siteDescription, siteTitle } from "./config";

interface LlmsDocEntry {
  title: string;
  description?: string;
  routePath: string;
  url: string;
  localeKey: string;
  localeLabel: string;
}

const getRoutePathFromEntry = (entry: CollectionEntry<"docs">) => {
  if (entry.id === "index") {
    return "/";
  }

  if (entry.id.endsWith("/index")) {
    return `/${entry.id.slice(0, -"/index".length)}`;
  }

  return `/${entry.id}`;
};

const toAbsoluteUrl = (siteUrl: string | undefined, routePath: string) => {
  if (!siteUrl) {
    return routePath;
  }

  const normalizedSiteUrl = siteUrl.endsWith("/") ? siteUrl : `${siteUrl}/`;
  const normalizedRoutePath = routePath === "/" ? "" : routePath.slice(1);
  return new URL(normalizedRoutePath, normalizedSiteUrl).toString();
};

const compareDocs = (left: LlmsDocEntry, right: LlmsDocEntry) => {
  if (left.localeKey !== right.localeKey) {
    if (left.localeKey === "/") {
      return -1;
    }

    if (right.localeKey === "/") {
      return 1;
    }

    return left.localeKey.localeCompare(right.localeKey);
  }

  if (left.routePath === "/") {
    return -1;
  }

  if (right.routePath === "/") {
    return 1;
  }

  return left.routePath.localeCompare(right.routePath);
};

const groupDocsByLocale = (docs: LlmsDocEntry[]) => {
  const grouped = new Map<string, { label: string; docs: LlmsDocEntry[] }>();

  for (const doc of docs) {
    const existing = grouped.get(doc.localeKey);
    if (existing) {
      existing.docs.push(doc);
      continue;
    }

    grouped.set(doc.localeKey, {
      label: doc.localeLabel,
      docs: [doc],
    });
  }

  return [...grouped.entries()].sort(([leftKey], [rightKey]) => {
    if (leftKey === "/") {
      return -1;
    }

    if (rightKey === "/") {
      return 1;
    }

    return leftKey.localeCompare(rightKey);
  });
};

export const renderLlmsText = async () => {
  const collection = await getCollection("docs");
  const docs = collection
    .map((entry) => {
      const routePath = getRoutePathFromEntry(entry);
      const resolvedConfig = getResolvedSiteConfig(routePath);

      return {
        title: entry.data.title,
        description: entry.data.description,
        routePath,
        url: toAbsoluteUrl(resolvedConfig.siteUrl, routePath),
        localeKey: resolvedConfig.localeKey,
        localeLabel: resolvedConfig.localeLabel,
      } satisfies LlmsDocEntry;
    })
    .sort(compareDocs);

  const lines = [
    `# ${siteTitle}`,
    "",
    `> ${siteDescription}`,
    "",
    "This file is auto-generated from the Stropress docs collection.",
    "",
  ];

  for (const [, group] of groupDocsByLocale(docs)) {
    lines.push(`## ${group.label}`);
    lines.push("");

    for (const doc of group.docs) {
      const descriptionSuffix = doc.description ? ` - ${doc.description}` : "";
      lines.push(`- [${doc.title}](${doc.url})${descriptionSuffix}`);
    }

    lines.push("");
  }

  return `${lines.join("\n").trimEnd()}\n`;
};
