import { escapeHtml, formatPrice, formatStockLabel } from "./utils.js";
import { productWhatsappLink } from "./whatsapp.js";

// Las primeras tarjetas suelen estar en pantalla: se cargan sin lazy para mejorar el LCP
const EAGER_IMAGES = 4;

export function normalizeProduct(record) {
  const accentFrom = record.accent_from || "#ff9f1c";
  const accentTo = record.accent_to || "#ff4d6d";

  return {
    id: record.id,
    slug: record.slug,
    sku: record.sku || "",
    name: record.name,
    category: record.category_slug,
    categoryLabel: record.category_name,
    brand: record.brand_slug || "",
    brandLabel: record.brand_name || "",
    type: record.product_type,
    price: Number(record.price_mxn ?? 0),
    compareAtPrice: record.compare_at_price_mxn ? Number(record.compare_at_price_mxn) : null,
    stockStatus: record.stock_status,
    stock: formatStockLabel(record.stock_status, record.stock_quantity),
    color: `linear-gradient(145deg, ${accentFrom}, ${accentTo})`,
    thumbUrl: record.image_thumb_url || "",
    hdUrl: record.image_hd_url || "",
    imageAlt: record.image_alt || record.name,
    imageWidth: record.image_width,
    imageHeight: record.image_height,
    imageCount: record.image_count ?? 0,
    badge: record.badge || "",
    summary: record.short_description || record.description || "",
    description: record.description || record.short_description || "",
    whatsappMessageTemplate: record.whatsapp_message_template || ""
  };
}

function productImage(product, index) {
  const eager = index < EAGER_IMAGES;
  // srcset solo cuando hay miniatura real distinta de la HD (imagenes nuevas del admin)
  const srcset = product.thumbUrl !== product.hdUrl
    ? `srcset="${escapeHtml(product.thumbUrl)} 600w, ${escapeHtml(product.hdUrl)} 1600w" sizes="(max-width: 520px) 50vw, 280px"`
    : "";

  return `<img class="product-image"
    src="${escapeHtml(product.thumbUrl)}" ${srcset}
    alt="${escapeHtml(product.imageAlt)}"
    width="600" height="600"
    loading="${eager ? "eager" : "lazy"}"
    ${eager ? 'fetchpriority="high"' : ""}
    decoding="async" />`;
}

export function productCardTemplate(product, index = 0) {
  const href = `/p/${encodeURIComponent(product.slug)}`;
  const moreImages = product.imageCount > 1
    ? `<span class="photo-count">${product.imageCount} fotos</span>`
    : "";

  const media = product.thumbUrl
    ? `<a class="product-gallery-main" href="${href}" data-slug="${escapeHtml(product.slug)}" aria-label="Ver detalle de ${escapeHtml(product.name)}">${productImage(product, index)}${moreImages}</a>`
    : `<div class="gallery-placeholder">${escapeHtml(product.categoryLabel)}</div>`;

  const comparePrice = product.compareAtPrice
    ? `<s class="compare-price">${formatPrice(product.compareAtPrice)}</s>`
    : "";

  return `
    <article class="product-card" data-status="${escapeHtml(product.stockStatus)}">
      <div class="product-media" style="background: ${escapeHtml(product.color)}">
        ${product.badge ? `<span class="pill product-badge">${escapeHtml(product.badge)}</span>` : ""}
        ${media}
      </div>
      <div class="product-body">
        <h3><a class="product-link" href="${href}" data-slug="${escapeHtml(product.slug)}">${escapeHtml(product.name)}</a></h3>
        <p class="meta">${escapeHtml(product.brandLabel || product.type)} | ${escapeHtml(product.categoryLabel)}</p>
        <p class="price">${formatPrice(product.price)} ${comparePrice}</p>
        <p class="stock stock-${escapeHtml(product.stockStatus)}">${escapeHtml(product.stock)}</p>
        <div class="product-actions">
          <a class="product-whatsapp" href="${escapeHtml(productWhatsappLink(product))}" target="_blank" rel="noopener noreferrer">Pedir por WhatsApp</a>
        </div>
      </div>
    </article>
  `;
}

export function skeletonCards(count) {
  return Array.from({ length: count }, () => '<div class="product-card skeleton" aria-hidden="true"></div>').join("");
}

export function featuredCardTemplate(product) {
  return `
    <a class="featured-card" href="/p/${encodeURIComponent(product.slug)}" data-slug="${escapeHtml(product.slug)}" style="background: ${escapeHtml(product.color)}">
      <p class="pill">${escapeHtml(product.brandLabel || product.categoryLabel)}</p>
      <h3>${escapeHtml(product.name)}</h3>
      <p>${escapeHtml(product.summary || "Pieza destacada del catalogo.")}</p>
    </a>
  `;
}

export function categoryCardTemplate(category) {
  return `
    <button class="category-card" type="button" data-category="${escapeHtml(category.slug)}">
      <h3>${escapeHtml(category.name)}</h3>
      <p>${escapeHtml(category.description || "Explora esta categoria en el catalogo.")}</p>
    </button>
  `;
}

export function filterButtonsTemplate(categories, active) {
  return [{ slug: "all", name: "Todos" }, ...categories]
    .map((item) => `<button class="filter-btn ${item.slug === active ? "active" : ""}" type="button" data-filter="${escapeHtml(item.slug)}" aria-pressed="${item.slug === active}">${escapeHtml(item.name)}</button>`)
    .join("");
}

export function brandOptionsTemplate(brands) {
  return [
    '<option value="all">Todas las franquicias</option>',
    ...brands.map((brand) => `<option value="${escapeHtml(brand.slug)}">${escapeHtml(brand.name)} (${brand.product_count})</option>`)
  ].join("");
}
