// Actualiza title/description/canonical al navegar entre productos sin recargar.
// Los crawlers (Google, WhatsApp) reciben estas etiquetas ya resueltas desde
// functions/p/[slug].js; esto solo mantiene coherente la pestana del navegador.
import { formatPrice } from "./utils.js";

const defaults = {
  title: document.title,
  description: document.querySelector('meta[name="description"]')?.content ?? "",
  canonical: document.querySelector('link[rel="canonical"]')?.href ?? `${window.location.origin}/`
};

function setMeta(selector, value) {
  const element = document.querySelector(selector);

  if (element) {
    element.setAttribute(element.tagName === "LINK" ? "href" : "content", value);
  }
}

export function applyProductMeta(product, storeName) {
  const title = `${product.name} | ${storeName}`;
  const description = `${product.name} - ${formatPrice(product.price)} MXN. ${product.stock}. ${product.summary}`.trim().slice(0, 160);
  const url = `${window.location.origin}/p/${encodeURIComponent(product.slug)}`;

  document.title = title;
  setMeta('meta[name="description"]', description);
  setMeta('link[rel="canonical"]', url);
  setMeta('meta[property="og:title"]', title);
  setMeta('meta[property="og:description"]', description);
  setMeta('meta[property="og:url"]', url);

  if (product.thumbUrl) {
    setMeta('meta[property="og:image"]', product.thumbUrl);
  }
}

export function resetMeta() {
  document.title = defaults.title;
  setMeta('meta[name="description"]', defaults.description);
  setMeta('link[rel="canonical"]', defaults.canonical);
  setMeta('meta[property="og:title"]', defaults.title);
  setMeta('meta[property="og:description"]', defaults.description);
  setMeta('meta[property="og:url"]', defaults.canonical);
}
