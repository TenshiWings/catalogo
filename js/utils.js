export const STOCK_LABELS = {
  available: "Disponible",
  limited: "Stock limitado",
  preorder: "Preventa",
  sold_out: "Agotado"
};

export function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

const priceFormatter = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  maximumFractionDigits: 0
});

export function formatPrice(value) {
  return priceFormatter.format(Number(value ?? 0));
}

export function formatStockLabel(status, quantity) {
  if (status === "limited" && quantity === 1) {
    return "Ultima pieza";
  }

  return STOCK_LABELS[status] ?? STOCK_LABELS.available;
}

// Debe coincidir con products.search_text: minusculas y sin acentos
export function normalizeSearch(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

// Escapa comodines de LIKE para que "%" o "_" escritos por el usuario sean literales
export function escapeLike(value) {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`);
}

export function debounce(fn, wait) {
  let timer;

  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), wait);
  };
}

// wa.me exige codigo de pais. Numeros mexicanos de 10 digitos reciben el prefijo 52.
export function normalizePhone(value) {
  const digits = String(value ?? "").replace(/\D/g, "");
  return digits.length === 10 ? `52${digits}` : digits;
}

export function productUrl(slug) {
  return `${window.location.origin}/p/${encodeURIComponent(slug)}`;
}
