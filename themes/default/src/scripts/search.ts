import MiniSearch from "minisearch";

export interface SearchDocument {
  id: string;
  title: string;
  description: string;
  body: string;
  url: string;
}

type ResultDocument = SearchDocument & {
  score: number;
};

let initialized = false;
let cleanup: (() => void) | null = null;

const normalizeText = (value: string) =>
  value
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]+`/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[[^\]]+\]\([^)]*\)/g, "$1")
    .replace(/[#>*_~\-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const sliceSummary = (value: string, maxLength = 120) => {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 1).trimEnd()}...`;
};

const renderResultItem = (doc: ResultDocument) => {
  const item = document.createElement("li");
  item.className = "site-search-result-item";

  const link = document.createElement("a");
  link.className = "site-search-result-link";
  link.href = doc.url;

  const title = document.createElement("span");
  title.className = "site-search-result-title";
  title.textContent = doc.title;

  const description = document.createElement("span");
  description.className = "site-search-result-desc";
  description.textContent = doc.description || sliceSummary(doc.body);

  link.append(title, description);
  item.append(link);
  return item;
};

const toSafeResult = (
  source: Partial<SearchDocument> & { score?: number },
  fallbackId: string,
): ResultDocument => ({
  id: source.id || fallbackId,
  title: source.title || "Untitled",
  description: source.description || "",
  body: source.body || "",
  url: source.url || "#",
  score: source.score || 0,
});

const buildSearch = (documents: SearchDocument[]) => {
  const docs = documents.map((doc) => ({
    ...doc,
    title: normalizeText(doc.title),
    description: normalizeText(doc.description),
    body: normalizeText(doc.body),
  }));

  const miniSearch = new MiniSearch<SearchDocument>({
    fields: ["title", "description", "body"],
    storeFields: ["id", "title", "description", "body", "url"],
    searchOptions: {
      prefix: true,
      fuzzy: 0.2,
      boost: {
        title: 3,
        description: 2,
      },
    },
  });

  miniSearch.addAll(docs);
  return miniSearch;
};

const searchLocal = (
  index: MiniSearch<SearchDocument>,
  sourceDocuments: SearchDocument[],
  query: string,
): ResultDocument[] => {
  const docById = new Map(sourceDocuments.map((doc) => [doc.id, doc]));

  return index
    .search(query, {
      combineWith: "AND",
      prefix: true,
      fuzzy: 0.2,
    })
    .map((hit, i) => {
      const id = String(hit.id);
      const source = docById.get(id);

      return toSafeResult(
        {
          id,
          title: source?.title,
          description: source?.description,
          body: source?.body,
          url: source?.url,
          score: hit.score,
        },
        `local-${i}`,
      );
    });
};

const mountSearch = (documents: SearchDocument[]) => {
  cleanup?.();

  const modal = document.querySelector<HTMLElement>("[data-search-modal]");
  const triggerButton = document.querySelector<HTMLButtonElement>(
    "[data-search-trigger]",
  );
  const openButtons = Array.from(
    document.querySelectorAll<HTMLElement>("[data-search-open]"),
  );
  const closeButtons = Array.from(
    document.querySelectorAll<HTMLElement>("[data-search-close]"),
  );
  const input = document.querySelector<HTMLInputElement>("[data-search-input]");
  const results = document.querySelector<HTMLUListElement>(
    "[data-search-results]",
  );
  const empty = document.querySelector<HTMLElement>("[data-search-empty]");

  if (!modal || !triggerButton || !input || !results || !empty) {
    cleanup = null;
    return;
  }

  const index = buildSearch(documents);
  let selectedIndex = -1;
  let searchToken = 0;

  const setModalOpen = (open: boolean) => {
    modal.dataset.state = open ? "open" : "closed";
    modal.setAttribute("aria-hidden", open ? "false" : "true");
    document.body.style.overflow = open ? "hidden" : "";

    if (open) {
      window.setTimeout(() => {
        input.focus();
        input.select();
      }, 0);
      return;
    }

    input.value = "";
    selectedIndex = -1;
    results.innerHTML = "";
    empty.hidden = true;
    triggerButton.blur();
  };

  const paintResults = async (query: string) => {
    results.innerHTML = "";
    selectedIndex = -1;
    const token = ++searchToken;

    const normalizedQuery = query.trim();
    if (!normalizedQuery) {
      empty.hidden = false;
      empty.textContent = "Start typing to search docs.";
      return;
    }

    let matches: ResultDocument[] = [];

    try {
      matches = searchLocal(index, documents, normalizedQuery);
    } catch (error) {
      console.error("[stropress] Search query failed:", error);
      matches = searchLocal(index, documents, normalizedQuery);
    }

    if (token !== searchToken) {
      return;
    }

    if (matches.length === 0) {
      empty.hidden = false;
      empty.textContent = "No results found.";
      return;
    }

    empty.hidden = true;
    matches.slice(0, 8).forEach((match) => {
      results.append(renderResultItem(match));
    });
  };

  const moveHighlight = (direction: 1 | -1) => {
    const items = Array.from(
      results.querySelectorAll<HTMLLIElement>(".site-search-result-item"),
    );

    if (items.length === 0) {
      return;
    }

    selectedIndex += direction;
    if (selectedIndex < 0) {
      selectedIndex = items.length - 1;
    }
    if (selectedIndex >= items.length) {
      selectedIndex = 0;
    }

    items.forEach((item, indexItem) => {
      item.dataset.state = indexItem === selectedIndex ? "active" : "inactive";
    });

    items[selectedIndex]?.scrollIntoView({ block: "nearest" });
  };

  const openSelectedResult = () => {
    const items = Array.from(
      results.querySelectorAll<HTMLLIElement>(".site-search-result-item"),
    );
    const activeItem = items[selectedIndex];
    activeItem?.querySelector<HTMLAnchorElement>("a")?.click();
  };

  const onTriggerClick = () => setModalOpen(true);
  const onCloseClick = () => setModalOpen(false);
  const onInput = () => {
    paintResults(input.value);
  };

  const onInputKeydown = (event: KeyboardEvent) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      moveHighlight(1);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      moveHighlight(-1);
      return;
    }

    if (event.key === "Enter") {
      const hasSelection = selectedIndex >= 0;
      if (hasSelection) {
        event.preventDefault();
        openSelectedResult();
      }
    }
  };

  const onGlobalKeydown = (event: KeyboardEvent) => {
    const commandPressed = event.metaKey || event.ctrlKey;

    if (commandPressed && event.key.toLowerCase() === "k") {
      event.preventDefault();
      setModalOpen(true);
      return;
    }

    if (event.key === "Escape") {
      if (modal.dataset.state === "open") {
        event.preventDefault();
        setModalOpen(false);
      }
    }
  };

  triggerButton.addEventListener("click", onTriggerClick);
  input.addEventListener("input", onInput);
  input.addEventListener("keydown", onInputKeydown);
  document.addEventListener("keydown", onGlobalKeydown);

  openButtons.forEach((button) => {
    button.addEventListener("click", onTriggerClick);
  });

  closeButtons.forEach((button) => {
    button.addEventListener("click", onCloseClick);
  });

  cleanup = () => {
    triggerButton.removeEventListener("click", onTriggerClick);
    input.removeEventListener("input", onInput);
    input.removeEventListener("keydown", onInputKeydown);
    document.removeEventListener("keydown", onGlobalKeydown);

    openButtons.forEach((button) => {
      button.removeEventListener("click", onTriggerClick);
    });

    closeButtons.forEach((button) => {
      button.removeEventListener("click", onCloseClick);
    });

    document.body.style.overflow = "";
  };
};

export const setupSearch = (documents: SearchDocument[]) => {
  mountSearch(documents);

  if (initialized) {
    return;
  }

  initialized = true;
  document.addEventListener("astro:page-load", () => {
    mountSearch(documents);
  });
};
