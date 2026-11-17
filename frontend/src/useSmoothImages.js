import { useEffect } from "react";

/**
 * Fade every <img> in smoothly once it finishes loading.
 * Cached images skip the fade so they don't flicker.
 */
function enhanceImage(img) {
  if (!(img instanceof HTMLImageElement)) return;
  if (img.dataset.smoothImg === "1") return;
  img.dataset.smoothImg = "1";

  const finish = (cached) => {
    if (cached) img.classList.add("img-cached");
    img.classList.add("is-loaded");
  };

  img.classList.add("img-smooth");

  if (img.complete && img.naturalWidth > 0) {
    finish(true);
    return;
  }

  const onDone = () => finish(false);
  img.addEventListener("load", onDone, { once: true });
  img.addEventListener("error", onDone, { once: true });
}

function enhanceTree(root) {
  if (!root) return;
  if (root instanceof HTMLImageElement) enhanceImage(root);
  if (typeof root.querySelectorAll === "function") {
    root.querySelectorAll("img").forEach(enhanceImage);
  }
}

export function useSmoothImages(enabled = true) {
  useEffect(() => {
    if (!enabled || typeof document === "undefined") return undefined;

    enhanceTree(document.body);

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          enhanceTree(node);
        }
        if (
          mutation.type === "attributes" &&
          mutation.target instanceof HTMLImageElement &&
          mutation.attributeName === "src"
        ) {
          const img = mutation.target;
          delete img.dataset.smoothImg;
          img.classList.remove("img-smooth", "is-loaded", "img-cached");
          enhanceImage(img);
        }
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["src"],
    });

    return () => observer.disconnect();
  }, [enabled]);
}
