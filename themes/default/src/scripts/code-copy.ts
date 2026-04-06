import copy from "copy-to-clipboard";

const COPY_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>`;
const COPIED_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 15 2 2 4-4"/><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>`;

const attachCopyButtons = () => {
  const blocks = document.querySelectorAll(".markdown-content pre > code");

  for (const code of blocks) {
    const pre = code.parentElement;
    if (!(pre instanceof HTMLElement) || pre.dataset.copyReady === "true") {
      continue;
    }

    pre.dataset.copyReady = "true";
    pre.classList.add("code-block");

    const button = document.createElement("button");
    button.type = "button";
    button.className = "code-copy-button";
    button.innerHTML = COPY_SVG;
    button.setAttribute("aria-label", "Copy code to clipboard");

    button.addEventListener("click", () => {
      const source = code.textContent ?? "";
      if (!source) {
        return;
      }

      copy(source);
      button.innerHTML = COPIED_SVG;
      button.classList.add("is-copied");

      window.setTimeout(() => {
        button.innerHTML = COPY_SVG;
        button.classList.remove("is-copied");
      }, 1200);
    });

    pre.appendChild(button);
  }
};

export const setupCodeCopyButtons = () => {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", attachCopyButtons, {
      once: true,
    });
  } else {
    attachCopyButtons();
  }

  document.addEventListener("astro:page-load", attachCopyButtons);
};
