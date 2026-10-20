import { DEFAULT_SETTINGS, PAGE_SIZE, SEARCH_DEBOUNCE_MS } from "./config.js";
import {
  isConfigured,
  fetchStoreSettings,
  fetchCategories,
  fetchBrands,
  fetchFeatured,
  fetchProductsPage,
  fetchProductBySlug
} from "./api.js";
import {
  normalizeProduct,
  productCardTemplate,
  skeletonCards,
  featuredCardTemplate,
  categoryCardTemplate,
  filterButtonsTemplate,
  brandOptionsTemplate
} from "./render.js";
import { setWhatsappPhone, whatsappLink } from "./whatsapp.js";
import { initViewer, openViewer, closeViewer, isViewerOpen } from "./viewer.js";
import { applyProductMeta, resetMeta } from "./seo.js";
import { debounce } from "./utils.js";
import { initTheme } from "./theme.js";

const $ = (id) => document.getElementById(id);

const els = {
  grid: $("productGrid"),
  count: $("resultCount"),
  loadMore: $("loadMoreBtn"),
  sentinel: $("loadMoreSentinel"),
  filterButtons: $("filterButtons"),
  brandSelect: $("brandFilter"),
  statusSelect: $("statusFilter"),
  sortSelect: $("sortSelect"),
  search: $("searchInput"),
  categoryGrid: $("categoryGrid"),
  featuredGrid: $("featuredGrid")
};

const state = {
  filters: { search: "", category: "all", brand: "all", status: "all", sort: "default" },
  page: 0,
  total: 0,
  loading: false,
  done: false,
  controller: null,
  // Productos ya cargados por slug: el visor los abre sin otra consulta
  bySlug: new Map(),
  storeName: DEFAULT_SETTINGS.store_name
};

// ---------- Ajustes de tienda ----------

function applyStoreSettings(settings) {
  const s = { ...DEFAULT_SETTINGS, ...(settings ?? {}) };
  state.storeName = s.store_name;
  setWhatsappPhone(s.whatsapp_number);

  $("storeNameHeader").textContent = s.store_name;
  $("storeNameFooter").textContent = s.store_name;
  $("heroKicker").textContent = s.hero_kicker;
  $("heroTitle").textContent = s.hero_title;
  $("heroText").textContent = s.hero_subtitle;
  $("heroPrimaryCta").textContent = s.hero_primary_cta_label;
  $("heroPrimaryCta").href = s.hero_primary_cta_target || "#catalogo";
  $("heroSecondaryCta").textContent = s.hero_secondary_cta_label;
  $("heroSecondaryCta").href = s.hero_secondary_cta_target || "#contacto";
  $("contactTitle").textContent = s.contact_title;
  $("contactText").textContent = s.contact_body;
  $("contactButton").textContent = s.contact_button_label;
  $("contactButton").href = whatsappLink(`Hola, vengo del catalogo de ${s.store_name}.`);
}

// ---------- Catalogo paginado ----------

function remember(products) {
  products.forEach((product) => state.bySlug.set(product.slug, product));
}

function updateCount() {
  els.count.textContent = state.total === 1 ? "1 producto" : `${state.total} productos`;
}

function setEmpty(message) {
  els.grid.innerHTML = `<div class="empty-state">${message}</div>`;
}

async function loadNextPage({ reset = false } = {}) {
  if (reset) {
    state.controller?.abort();
    state.page = 0;
    state.done = false;
    state.loading = false;
    els.grid.innerHTML = skeletonCards(8);
  }

  if (state.loading || state.done) {
    return;
  }

  state.loading = true;
  els.loadMore.hidden = true;
  const controller = new AbortController();
  state.controller = controller;

  try {
    const { data, count } = await fetchProductsPage({ ...state.filters, page: state.page, signal: controller.signal });

    if (controller.signal.aborted) {
      return;
    }

    const products = data.map(normalizeProduct);
    remember(products);
    state.total = count;
    updateCount();

    const offset = state.page * PAGE_SIZE;

    if (state.page === 0) {
      els.grid.innerHTML = products.length
        ? products.map((product, index) => productCardTemplate(product, index)).join("")
        : "";

      if (!products.length) {
        setEmpty("No encontramos productos con esos filtros. Prueba otra busqueda.");
      }
    } else {
      els.grid.insertAdjacentHTML("beforeend", products.map((product, index) => productCardTemplate(product, offset + index)).join(""));
    }

    state.page += 1;
    state.done = state.page * PAGE_SIZE >= count;
  } catch (error) {
    if (error?.name === "AbortError" || controller.signal.aborted) {
      return;
    }

    console.error(error);

    if (state.page === 0) {
      setEmpty('No pudimos cargar el catalogo. <button class="btn btn-ghost" type="button" data-retry>Reintentar</button>');
    }
  } finally {
    if (state.controller === controller) {
      state.loading = false;
      els.loadMore.hidden = state.done;
    }
  }
}

const reload = () => loadNextPage({ reset: true });

// ---------- Filtros ----------

function setCategory(slug) {
  state.filters.category = slug;
  els.filterButtons.querySelectorAll(".filter-btn").forEach((button) => {
    const active = button.dataset.filter === slug;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  reload();
}

function wireFilters() {
  els.filterButtons.addEventListener("click", (event) => {
    const button = event.target.closest("[data-filter]");
    if (button) setCategory(button.dataset.filter);
  });

  els.categoryGrid.addEventListener("click", (event) => {
    const card = event.target.closest("[data-category]");
    if (!card) return;
    setCategory(card.dataset.category);
    document.getElementById("catalogo").scrollIntoView({ behavior: "smooth" });
  });

  els.search.addEventListener("input", debounce(() => {
    state.filters.search = els.search.value;
    reload();
  }, SEARCH_DEBOUNCE_MS));

  els.brandSelect.addEventListener("change", () => {
    state.filters.brand = els.brandSelect.value;
    reload();
  });

  els.statusSelect.addEventListener("change", () => {
    state.filters.status = els.statusSelect.value;
    reload();
  });

  els.sortSelect.addEventListener("change", () => {
    state.filters.sort = els.sortSelect.value;
    reload();
  });

  els.loadMore.addEventListener("click", () => loadNextPage());

  els.grid.addEventListener("click", (event) => {
    if (event.target.closest("[data-retry]")) reload();
  });
}

// Scroll infinito: pide la siguiente pagina antes de llegar al final.
// El boton "Cargar mas" queda como respaldo accesible.
function wireInfiniteScroll() {
  if (!("IntersectionObserver" in window)) {
    return;
  }

  new IntersectionObserver((entries) => {
    if (entries.some((entry) => entry.isIntersecting)) loadNextPage();
  }, { rootMargin: "600px 0px" }).observe(els.sentinel);
}

// ---------- Rutas /p/:slug ----------

function slugFromPath() {
  const match = window.location.pathname.match(/^\/p\/([^/]+)\/?$/);
  return match ? decodeURIComponent(match[1]) : null;
}

async function showProduct(slug, { push = false } = {}) {
  let product = state.bySlug.get(slug);

  if (!product) {
    const record = await fetchProductBySlug(slug).catch(() => null);

    if (!record) {
      if (!push) history.replaceState(null, "", "/");
      return;
    }

    product = normalizeProduct(record);
    remember([product]);
  }

  if (push) {
    history.pushState({ slug }, "", `/p/${encodeURIComponent(slug)}`);
  }

  applyProductMeta(product, state.storeName);
  openViewer(product, {
    onClose: () => {
      resetMeta();
      if (slugFromPath()) history.pushState(null, "", "/");
    }
  });
}

function wireRouting() {
  // Los enlaces son <a href="/p/slug"> reales (rastreables); aqui se interceptan para abrir el visor
  document.addEventListener("click", (event) => {
    const link = event.target.closest("a[data-slug]");

    if (!link || event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) {
      return;
    }

    event.preventDefault();
    showProduct(link.dataset.slug, { push: true });
  });

  window.addEventListener("popstate", () => {
    const slug = slugFromPath();

    if (slug) {
      showProduct(slug);
    } else if (isViewerOpen()) {
      closeViewer({ silent: true });
      resetMeta();
    }
  });
}

// ---------- Arranque ----------

async function loadSecondaryData() {
  const [settings, categories, brands, featured] = await Promise.allSettled([
    fetchStoreSettings(),
    fetchCategories(),
    fetchBrands(),
    fetchFeatured()
  ]);

  if (settings.status === "fulfilled") {
    applyStoreSettings(settings.value);
  }

  if (categories.status === "fulfilled") {
    els.filterButtons.innerHTML = filterButtonsTemplate(categories.value, state.filters.category);
    els.categoryGrid.innerHTML = categories.value.map(categoryCardTemplate).join("");
  }

  if (brands.status === "fulfilled") {
    els.brandSelect.innerHTML = brandOptionsTemplate(brands.value);
  }

  if (featured.status === "fulfilled") {
    const products = featured.value.map(normalizeProduct);
    remember(products);
    els.featuredGrid.innerHTML = products.map(featuredCardTemplate).join("");
  }
}

async function init() {
  initTheme();
  initViewer();
  applyStoreSettings(null);

  if (!isConfigured) {
    setEmpty("Configura Supabase en supabase-config.js para cargar el catalogo.");
    return;
  }

  wireFilters();
  wireRouting();

  // Los ajustes van primero: el numero de WhatsApp se usa al pintar las tarjetas
  const secondary = loadSecondaryData();
  const firstPage = secondary.then(() => loadNextPage({ reset: true }));

  const slug = slugFromPath();

  if (slug) {
    await secondary;
    showProduct(slug);
  }

  await firstPage;
  wireInfiniteScroll();
}

init();
