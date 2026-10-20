const THEME_STORAGE_KEY = "sc-theme";
const SUPABASE_CONFIG = window.SCREAMS_SUPABASE_CONFIG ?? null;

const grid = document.getElementById("productGrid");
const filterButtonsContainer = document.getElementById("filterButtons");
const categoryGrid = document.getElementById("categoryGrid");
const featuredGrid = document.getElementById("featuredGrid");
const searchInput = document.getElementById("searchInput");
const themeToggle = document.getElementById("themeToggle");
const themeToggleText = document.getElementById("themeToggleText");
const storeNameHeader = document.getElementById("storeNameHeader");
const storeNameFooter = document.getElementById("storeNameFooter");
const heroKicker = document.getElementById("heroKicker");
const heroTitle = document.getElementById("heroTitle");
const heroText = document.getElementById("heroText");
const heroPrimaryCta = document.getElementById("heroPrimaryCta");
const heroSecondaryCta = document.getElementById("heroSecondaryCta");
const contactTitle = document.getElementById("contactTitle");
const contactText = document.getElementById("contactText");
const contactLink = document.getElementById("contactButton");
const imageViewer = document.getElementById("imageViewer");
const viewerClose = document.getElementById("viewerClose");
const viewerPrev = document.getElementById("viewerPrev");
const viewerNext = document.getElementById("viewerNext");
const viewerImage = document.getElementById("viewerImage");
const viewerCaption = document.getElementById("viewerCaption");
const viewerThumbs = document.getElementById("viewerThumbs");
const viewerBadge = document.getElementById("viewerBadge");
const viewerTitle = document.getElementById("viewerTitle");
const viewerMeta = document.getElementById("viewerMeta");
const viewerPrice = document.getElementById("viewerPrice");
const viewerStock = document.getElementById("viewerStock");
const viewerDescription = document.getElementById("viewerDescription");
const viewerWhatsapp = document.getElementById("viewerWhatsapp");

let activeFilter = "all";
let products = [];
let categories = [];
let featuredProducts = [];
let whatsappPhone = "5210000000000";
let activeGallery = [];
let activeGalleryIndex = 0;
let activeGalleryProduct = null;

const fallbackSettings = {
  store_name: "Screams Collector",
  whatsapp_number: "5210000000000",
  hero_kicker: "Coleccionismo con actitud",
  hero_title: "Tu universo de Monster High, juguetes y juegos de mesa",
  hero_subtitle: "En Screams Collector reunimos piezas que no pasan desapercibidas: figuras coleccionables, ediciones especiales y clasicos para jugar.",
  hero_primary_cta_label: "Ver catalogo",
  hero_primary_cta_target: "#catalogo",
  hero_secondary_cta_label: "Pedir por WhatsApp",
  hero_secondary_cta_target: "#contacto",
  contact_title: "Atencion personalizada",
  contact_body: "Tambien puedes usar los botones de cada producto para enviar un mensaje con informacion precargada.",
  contact_button_label: "Contactar por WhatsApp"
};

const fallbackProducts = [
  {
    name: "Monster High Draculaura Neon Frights",
    category: "monster-high",
    categoryLabel: "Monster High",
    type: "Figura",
    price: 1699,
    stock: "Stock limitado",
    color: "linear-gradient(145deg, #d22c7b, #4b1d46)",
    imageUrl: "",
    whatsappMessageTemplate: "Hola, vi este producto en su catalogo y quiero mas informacion sobre Monster High Draculaura Neon Frights."
  },
  {
    name: "Figura Coleccionable Horror Classic",
    category: "coleccionables",
    categoryLabel: "Coleccionables",
    type: "Edicion especial",
    price: 2399,
    stock: "Disponible",
    color: "linear-gradient(145deg, #20232d, #5f3f56)",
    imageUrl: "",
    whatsappMessageTemplate: "Hola, vi este producto en su catalogo y quiero mas informacion sobre Figura Coleccionable Horror Classic."
  },
  {
    name: "Juego de Mesa Estrategia Nocturna",
    category: "juegos-mesa",
    categoryLabel: "Juegos de Mesa",
    type: "Juego de mesa",
    price: 1399,
    stock: "Disponible",
    color: "linear-gradient(145deg, #1f395f, #4b2a5e)",
    imageUrl: "",
    whatsappMessageTemplate: "Hola, vi este producto en su catalogo y quiero mas informacion sobre Juego de Mesa Estrategia Nocturna."
  }
];

const fallbackCategories = [
  {
    slug: "monster-high",
    name: "Monster High",
    description: "Munecas, accesorios y ediciones para fans.",
    sort_order: 1
  },
  {
    slug: "coleccionables",
    name: "Coleccionables",
    description: "Lineas premium, sets tematicos y piezas de vitrina.",
    sort_order: 2
  },
  {
    slug: "juguetes",
    name: "Juguetes",
    description: "Opciones para regalar, jugar y coleccionar.",
    sort_order: 3
  },
  {
    slug: "juegos-mesa",
    name: "Juegos de Mesa",
    description: "Titulos familiares, party games y estrategia.",
    sort_order: 4
  }
];

const fallbackFeaturedProducts = [
  {
    categoryLabel: "Monster High",
    name: "Skullector y ediciones especiales",
    summary: "Piezas con alta demanda y unidades limitadas.",
    color: "linear-gradient(145deg, #ff5aa5, #5a2a88)"
  },
  {
    categoryLabel: "Juegos de Mesa",
    name: "Clasicos modernos para reunir amigos",
    summary: "Desde juegos rapidos hasta experiencias estrategicas.",
    color: "linear-gradient(145deg, #15c6b7, #2460ff)"
  },
  {
    categoryLabel: "Coleccionables",
    name: "Figuras para exhibicion",
    summary: "Materiales y acabados pensados para coleccionistas.",
    color: "linear-gradient(145deg, #6d7cff, #18c7c1)"
  }
];

function getPreferredTheme() {
  const stored = localStorage.getItem(THEME_STORAGE_KEY);

  if (stored === "light" || stored === "dark") {
    return stored;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme) {
  document.body.setAttribute("data-theme", theme);
  themeToggleText.textContent = theme === "dark" ? "Modo claro" : "Modo oscuro";
}

function toggleTheme() {
  const current = document.body.getAttribute("data-theme") || "light";
  const next = current === "dark" ? "light" : "dark";
  applyTheme(next);
  localStorage.setItem(THEME_STORAGE_KEY, next);
}

function formatPrice(value) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0
  }).format(value);
}

function formatStockLabel(status, quantity) {
  if (status === "limited") {
    return quantity === 1 ? "Ultima pieza" : "Stock limitado";
  }

  if (status === "preorder") {
    return "Preventa";
  }

  if (status === "sold_out") {
    return "Agotado";
  }

  return "Disponible";
}

function normalizePhone(value) {
  return (value ?? "").replace(/\D/g, "");
}

function slugify(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function applyStoreSettings(settings) {
  const merged = {
    ...fallbackSettings,
    ...(settings ?? {})
  };

  storeNameHeader.textContent = merged.store_name;
  storeNameFooter.textContent = merged.store_name;
  heroKicker.textContent = merged.hero_kicker;
  heroTitle.textContent = merged.hero_title;
  heroText.textContent = merged.hero_subtitle;
  heroPrimaryCta.textContent = merged.hero_primary_cta_label;
  heroPrimaryCta.href = merged.hero_primary_cta_target || "#catalogo";
  heroSecondaryCta.textContent = merged.hero_secondary_cta_label;
  heroSecondaryCta.href = merged.hero_secondary_cta_target || "#contacto";
  contactTitle.textContent = merged.contact_title;
  contactText.textContent = merged.contact_body;
  contactLink.textContent = merged.contact_button_label;

  const normalized = normalizePhone(merged.whatsapp_number);

  if (normalized) {
    whatsappPhone = normalized;
  }

  updateWhatsappContactLink();
}

function updateWhatsappContactLink() {
  contactLink.href = `https://wa.me/${whatsappPhone}`;
}

function normalizeProduct(record) {
  const accentFrom = record.accent_from || "#ff9f1c";
  const accentTo = record.accent_to || "#ff4d6d";
  const stock = formatStockLabel(record.stock_status, record.stock_quantity);
  const gallerySource = Array.isArray(record.image_gallery)
    ? record.image_gallery
    : typeof record.image_gallery === "string"
      ? JSON.parse(record.image_gallery)
      : [];

  const imageGallery = gallerySource
    .filter((image) => image?.image_url)
    .map((image) => ({
      imageUrl: image.image_url,
      altText: image.alt_text || record.name,
      isPrimary: Boolean(image.is_primary)
    }));

  return {
    id: record.id || record.slug || slugify(record.name),
    slug: record.slug || slugify(record.name),
    name: record.name,
    category: record.category_slug,
    categoryLabel: record.category_name,
    type: record.product_type,
    price: Number(record.price_mxn ?? 0),
    stock,
    stockQuantity: record.stock_quantity,
    color: `linear-gradient(145deg, ${accentFrom}, ${accentTo})`,
    imageUrl: record.primary_image_url || "",
    imageGallery,
    badge: record.badge || "",
    summary: record.short_description || record.description || "",
    description: record.description || record.short_description || "",
    whatsappMessageTemplate: record.whatsapp_message_template || ""
  };
}

function getGallery(product) {
  const gallery = product.imageGallery?.length
    ? product.imageGallery
    : product.imageUrl
      ? [{ imageUrl: product.imageUrl, altText: product.name, isPrimary: true }]
      : [];

  return gallery;
}

function renderImageViewer(product) {
  const image = activeGallery[activeGalleryIndex];

  if (!image) {
    return;
  }

  viewerImage.src = image.imageUrl;
  viewerImage.alt = image.altText || product.name;
  viewerCaption.textContent = `${product.name} · Imagen ${activeGalleryIndex + 1} de ${activeGallery.length}`;
  viewerTitle.textContent = product.name;
  viewerMeta.textContent = `${product.type} | ${product.categoryLabel}`;
  viewerPrice.textContent = formatPrice(product.price);
  viewerStock.textContent = product.stock;
  viewerDescription.textContent = product.description || product.summary || "Consulta con nosotros para conocer mas detalles de esta pieza.";
  viewerWhatsapp.href = buildWhatsappLink(product);

  if (product.badge) {
    viewerBadge.textContent = product.badge;
    viewerBadge.classList.remove("hidden");
  } else {
    viewerBadge.textContent = "";
    viewerBadge.classList.add("hidden");
  }

  viewerThumbs.innerHTML = activeGallery.map((item, index) => `
    <button class="viewer-thumb ${index === activeGalleryIndex ? "active" : ""}" type="button" data-index="${index}">
      <img src="${item.imageUrl}" alt="${item.altText || product.name}" />
    </button>
  `).join("");

  viewerThumbs.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => {
      activeGalleryIndex = Number(button.dataset.index || 0);
      renderImageViewer(product);
    });
  });
}

function openImageViewer(product, index = 0) {
  activeGalleryProduct = product;
  activeGallery = getGallery(product);

  if (activeGallery.length === 0) {
    return;
  }

  activeGalleryIndex = Math.min(Math.max(index, 0), activeGallery.length - 1);
  renderImageViewer(product);
  imageViewer.classList.remove("hidden");
  imageViewer.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closeImageViewer() {
  activeGalleryProduct = null;
  imageViewer.classList.add("hidden");
  imageViewer.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

function stepImageViewer(direction) {
  if (activeGallery.length === 0 || !activeGalleryProduct) {
    return;
  }

  activeGalleryIndex = (activeGalleryIndex + direction + activeGallery.length) % activeGallery.length;
  renderImageViewer(activeGalleryProduct);
}

function createFilterButtons(items) {
  const buttons = [
    '<button class="filter-btn active" data-filter="all">Todos</button>',
    ...items.map((item) => `<button class="filter-btn" data-filter="${item.slug}">${item.name}</button>`)
  ];

  filterButtonsContainer.innerHTML = buttons.join("");

  filterButtonsContainer.querySelectorAll(".filter-btn").forEach((button) => {
    button.addEventListener("click", () => {
      filterButtonsContainer.querySelectorAll(".filter-btn").forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
      activeFilter = button.dataset.filter;
      renderProducts();
    });
  });
}

function renderCategories() {
  categoryGrid.innerHTML = categories
    .map((category) => `
      <article class="category-card">
        <h3>${category.name}</h3>
        <p>${category.description || "Explora esta categoria en el catalogo."}</p>
      </article>
    `)
    .join("");
}

function renderFeatured() {
  featuredGrid.innerHTML = featuredProducts
    .slice(0, 3)
    .map((product) => `
      <article class="featured-card" style="background: ${product.color}">
        <p class="pill">${product.categoryLabel}</p>
        <h3>${product.name}</h3>
        <p>${product.summary || "Pieza destacada del catalogo."}</p>
      </article>
    `)
    .join("");
}

function showStatus(message) {
  grid.innerHTML = `<div class="empty-state">${message}</div>`;
}

async function loadStoreSettings(client) {
  const { data, error } = await client
    .from("store_settings")
    .select("*")
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  applyStoreSettings(data);
}

async function loadCategories(client) {
  const { data, error } = await client
    .from("categories")
    .select("name, slug, description, sort_order")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) {
    throw error;
  }

  categories = data?.length ? data : fallbackCategories;
  createFilterButtons(categories);
  renderCategories();
}

async function loadFeaturedProducts(client) {
  const { data, error } = await client
    .from("catalog_products")
    .select("name, short_description, description, badge, accent_from, accent_to, category_name, category_slug, product_type, price_mxn, stock_status, stock_quantity, primary_image_url, image_gallery, whatsapp_message_template")
    .eq("is_featured", true)
    .order("sort_order", { ascending: true })
    .limit(3);

  if (error) {
    throw error;
  }

  featuredProducts = data?.length ? data.map(normalizeProduct) : fallbackFeaturedProducts;
  renderFeatured();
}

async function loadProductsFromSupabase() {
  if (!SUPABASE_CONFIG?.url || !SUPABASE_CONFIG?.anonKey || !window.supabase) {
    products = fallbackProducts;
    categories = fallbackCategories;
    featuredProducts = fallbackFeaturedProducts;
    applyStoreSettings(fallbackSettings);
    createFilterButtons(categories);
    renderCategories();
    renderFeatured();
    showStatus("Configura Supabase en supabase-config.js para cargar tu catalogo real. Mientras tanto se muestra una vista de ejemplo.");
    renderProducts();
    return;
  }

  const client = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
  showStatus("Cargando catalogo...");

  try {
    await Promise.all([
      loadStoreSettings(client),
      loadCategories(client),
      loadFeaturedProducts(client)
    ]);

    const { data, error } = await client
      .from("catalog_products")
      .select("id, name, short_description, description, product_type, price_mxn, stock_status, stock_quantity, badge, accent_from, accent_to, whatsapp_message_template, category_name, category_slug, primary_image_url, image_gallery")
      .order("sort_order", { ascending: true });

    if (error) {
      throw error;
    }

    products = (data ?? []).map(normalizeProduct);

    if (products.length === 0) {
      showStatus("Tu catalogo en Supabase esta vacio. Ejecuta schema.sql y seed.sql para ver productos aqui.");
      return;
    }

    renderProducts();
  } catch (error) {
    console.error(error);
    products = fallbackProducts;
    categories = fallbackCategories;
    featuredProducts = fallbackFeaturedProducts;
    applyStoreSettings(fallbackSettings);
    createFilterButtons(categories);
    renderCategories();
    renderFeatured();
    showStatus("No se pudo cargar Supabase. Revisa la URL, la anon key y que hayas ejecutado schema.sql y seed.sql. Se muestra una vista de ejemplo.");
    renderProducts();
  }
}

function buildWhatsappLink(product) {
  const message = product.whatsappMessageTemplate || [
    "Hola, vi este producto en su catalogo y quiero mas informacion:",
    `Producto: ${product.name}`,
    `Categoria: ${product.categoryLabel}`,
    `Tipo: ${product.type}`,
    `Precio: ${formatPrice(product.price)}`,
    `Estatus: ${product.stock}`,
    "Me comparten disponibilidad y opciones de compra, por favor?"
  ].join("\n");

  return `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(message)}`;
}

function productCardTemplate(product) {
  const gallery = getGallery(product);
  const mainImage = gallery[0];
  const thumbnails = gallery.slice(0, 4).map((image, index) => `
    <button class="gallery-thumb ${index === 0 ? "active" : ""}" type="button" data-product="${product.id}" data-index="${index}" aria-label="Ver imagen ${index + 1} de ${product.name}">
      <img src="${image.imageUrl}" alt="${image.altText || product.name}" loading="lazy" />
    </button>
  `).join("");

  return `
    <article class="product-card">
      <div class="product-media" style="background: ${product.color}">
        ${mainImage
          ? `<button class="product-gallery-main" type="button" data-product="${product.id}" data-index="0" aria-label="Abrir galeria de ${product.name}"><img class="product-image" src="${mainImage.imageUrl}" alt="${mainImage.altText || product.name}" loading="lazy" /></button>`
          : `<div class="gallery-placeholder">${product.categoryLabel}</div>`}
      </div>
      <div class="product-body">
        <h3>${product.name}</h3>
        <p class="meta">${product.type} | ${product.categoryLabel}</p>
        ${thumbnails ? `<div class="product-gallery-strip">${thumbnails}</div>` : ""}
        <p class="price">${formatPrice(product.price)}</p>
        <p class="stock">${product.stock}</p>
        <div class="product-actions">
          <a class="product-whatsapp" href="${buildWhatsappLink(product)}" target="_blank" rel="noopener noreferrer">Pedir informes</a>
        </div>
      </div>
    </article>
  `;
}

function getFilteredProducts() {
  const query = searchInput.value.trim().toLowerCase();

  return products.filter((product) => {
    const matchesCategory = activeFilter === "all" || product.category === activeFilter;
    const matchesText =
      product.name.toLowerCase().includes(query) ||
      product.categoryLabel.toLowerCase().includes(query) ||
      product.type.toLowerCase().includes(query);

    return matchesCategory && matchesText;
  });
}

function renderProducts() {
  const result = getFilteredProducts();

  if (result.length === 0) {
    grid.innerHTML = '<div class="empty-state">No encontramos productos con ese filtro. Prueba otra busqueda.</div>';
    return;
  }

  grid.innerHTML = result.map(productCardTemplate).join("");

  grid.querySelectorAll(".product-gallery-main, .gallery-thumb").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();

      const product = result.find((item) => item.id === button.dataset.product);

      if (!product) {
        return;
      }

      openImageViewer(product, Number(button.dataset.index || 0));
    });
  });
}

searchInput.addEventListener("input", renderProducts);
themeToggle.addEventListener("click", toggleTheme);
viewerClose.addEventListener("click", closeImageViewer);
viewerPrev.addEventListener("click", () => stepImageViewer(-1));
viewerNext.addEventListener("click", () => stepImageViewer(1));
imageViewer.addEventListener("click", (event) => {
  if (event.target === imageViewer) {
    closeImageViewer();
  }
});
document.addEventListener("keydown", (event) => {
  if (imageViewer.classList.contains("hidden")) {
    return;
  }

  if (event.key === "Escape") {
    closeImageViewer();
  }

  if (event.key === "ArrowLeft") {
    stepImageViewer(-1);
  }

  if (event.key === "ArrowRight") {
    stepImageViewer(1);
  }
});

applyTheme(getPreferredTheme());
applyStoreSettings(fallbackSettings);

loadProductsFromSupabase();
