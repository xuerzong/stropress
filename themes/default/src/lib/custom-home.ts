export interface CustomHomeModule {
  default: any;
  title?: string;
  description?: string;
  sidebar?: boolean;
  contentClass?: string;
}

const customHomeModules = import.meta.glob<CustomHomeModule>(
  "../content/docs/**/index.astro",
);

const normalizePathname = (pathname: string) => {
  if (!pathname || pathname === "/") {
    return "/";
  }

  return pathname.endsWith("/") ? pathname : `${pathname}/`;
};

const getCustomHomeModulePath = (pathname: string) => {
  const normalizedPath = normalizePathname(pathname);

  if (normalizedPath === "/") {
    return "../content/docs/index.astro";
  }

  return `../content/docs${normalizedPath.slice(0, -1)}/index.astro`;
};

export const getCustomHomeModule = async (pathname: string) => {
  const modulePath = getCustomHomeModulePath(pathname);
  const loader = customHomeModules[modulePath];

  if (!loader) {
    return null;
  }

  return loader();
};
