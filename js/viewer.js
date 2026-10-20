import { fetchGallery } from "./api.js";
import { escapeHtml, formatPrice } from "./utils.js";
import { productWhatsappLink } from "./whatsapp.js";

const els = {
  root: document.getElementById("imageViewer"),
  close: document.getElementById("viewerClose"),
  prev: document.getElementById("viewerPrev"),
  next: document.getElementById("viewerNext"),
  image: document.getElementById("viewerImage"),
  caption: document.getElementById("viewerCaption"),
  thumbs: document.getElementById("viewerThumbs"),
  badge: document.getElementById("viewerBadge"),
  title: document.getElementById("viewerTitle"),
  meta: document.getElementById("viewerMeta"),
  price: document.getElementById("viewerPrice"),
  stock: document.getElementById("viewerStock"),
  description: document.getElementById("viewerDescription"),
  whatsapp: document.getElementById("viewerWhatsapp")
};

const state = {
  product: null,
  gallery: [],
  index: 0,
  lastFocus: null,
  onClose: null
};

// Cache por producto para no repetir la consulta al reabrir
const galleryCache = new Map();

function fallbackGallery(product) {
  return product.hdUrl
    ? [{ hd: product.hdUrl, thumb: product.thumbUrl, alt: product.imageAlt }]
    : [];
}

async function loadGallery(product) {
  if (galleryCache.has(product.id)) {
    return galleryCache.get(product.id);
  }

  if (product.imageCount <= 1) {
    return fallbackGallery(product);
  }

  try {
    const rows = await fetchGallery(product.id);
    const gallery = rows.map((row) => ({
      hd: row.image_url,
      thumb: row.thumb_url || row.image_url,
      alt: row.alt_text || product.name
    }));
    galleryCache.set(product.id, gallery);
    return gallery;
  } catch (error) {
    console.error(error);
    return fallbackGallery(product);
  }
}

function renderDetails(product) {
  els.title.textContent = product.name;
  els.meta.textContent = [product.type, product.brandLabel, product.categoryLabel].filter(Boolean).join(" | ");
  els.price.textContent = formatPrice(product.price);
  els.stock.textContent = product.stock;
  els.description.textContent = product.description || "Consulta con nosotros para conocer mas detalles de esta pieza.";
  els.whatsapp.href = productWhatsappLink(product);
  els.badge.textContent = product.badge;
  els.badge.classList.toggle("hidden", !product.badge);
}

function renderImage() {
  const image = state.gallery[state.index];
  const hasMany = state.gallery.length > 1;

  els.prev.hidden = !hasMany;
  els.next.hidden = !hasMany;

  if (!image) {
    els.image.removeAttribute("src");
    els.image.alt = "";
    els.caption.textContent = "";
    els.thumbs.innerHTML = "";
    return;
  }

  // Muestra la miniatura (ya en cache del navegador) mientras llega la HD
  els.image.src = image.thumb;
  const hd = new Image();
  hd.onload = () => {
    if (state.gallery[state.index] === image) {
      els.image.src = image.hd;
    }
  };
  hd.src = image.hd;

  els.image.alt = image.alt;
  els.caption.textContent = hasMany ? `Imagen ${state.index + 1} de ${state.gallery.length}` : "";

  els.thumbs.innerHTML = hasMany
    ? state.gallery.map((item, index) => `
      <button class="viewer-thumb ${index === state.index ? "active" : ""}" type="button" data-index="${index}" aria-label="Imagen ${index + 1}">
        <img src="${escapeHtml(item.thumb)}" alt="" loading="lazy" decoding="async" />
      </button>
    `).join("")
    : "";
}

function step(direction) {
  if (state.gallery.length < 2) {
    return;
  }

  state.index = (state.index + direction + state.gallery.length) % state.gallery.length;
  renderImage();
}

export async function openViewer(product, { onClose } = {}) {
  state.product = product;
  state.gallery = fallbackGallery(product);
  state.index = 0;
  state.onClose = onClose ?? null;
  state.lastFocus = document.activeElement;

  renderDetails(product);
  renderImage();

  els.root.classList.remove("hidden");
  els.root.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  els.close.focus();

  const gallery = await loadGallery(product);

  if (state.product === product && gallery.length) {
    state.gallery = gallery;
    renderImage();
  }
}

export function closeViewer({ silent = false } = {}) {
  if (!state.product) {
    return;
  }

  state.product = null;
  els.root.classList.add("hidden");
  els.root.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
  state.lastFocus?.focus?.();

  if (!silent) {
    state.onClose?.();
  }
}

export function isViewerOpen() {
  return Boolean(state.product);
}

export function initViewer() {
  els.close.addEventListener("click", () => closeViewer());
  els.prev.addEventListener("click", () => step(-1));
  els.next.addEventListener("click", () => step(1));

  els.thumbs.addEventListener("click", (event) => {
    const button = event.target.closest("[data-index]");

    if (button) {
      state.index = Number(button.dataset.index);
      renderImage();
    }
  });

  els.root.addEventListener("click", (event) => {
    if (event.target === els.root) {
      closeViewer();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (!isViewerOpen()) return;
    if (event.key === "Escape") closeViewer();
    if (event.key === "ArrowLeft") step(-1);
    if (event.key === "ArrowRight") step(1);
  });
}
