import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/+esm";
import { SUPABASE_URL, SUPABASE_ANON_KEY, PAGE_SIZE } from "./config.js";
import { escapeLike, normalizeSearch } from "./utils.js";

export const isConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

const client = isConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false } })
  : null;

// Solo las columnas que pinta la tarjeta: menos bytes por pagina
const LIST_COLUMNS = [
  "id", "slug", "sku", "name", "short_description", "description", "product_type",
  "price_mxn", "compare_at_price_mxn", "stock_status", "stock_quantity", "badge",
  "accent_from", "accent_to", "whatsapp_message_template", "is_featured",
  "category_name", "category_slug", "brand_name", "brand_slug",
  "image_thumb_url", "image_hd_url", "image_alt", "image_width", "image_height", "image_count"
].join(",");

const SORTS = {
  default: [["sort_order", true], ["created_at", false], ["id", true]],
  newest: [["created_at", false], ["id", true]],
  price_asc: [["price_mxn", true], ["id", true]],
  price_desc: [["price_mxn", false], ["id", true]]
};

const STATUS_GROUPS = {
  available: ["available", "limited"],
  preorder: ["preorder"],
  sold_out: ["sold_out"]
};

function unwrap({ data, error }) {
  if (error) {
    throw error;
  }

  return data;
}

export async function fetchStoreSettings() {
  return unwrap(await client.from("store_settings").select("*").limit(1).maybeSingle());
}

export async function fetchCategories() {
  return unwrap(await client
    .from("categories")
    .select("name, slug, description")
    .eq("is_active", true)
    .order("sort_order", { ascending: true }));
}

export async function fetchBrands() {
  return unwrap(await client
    .from("catalog_brands")
    .select("slug, name, product_count")
    .order("name", { ascending: true }));
}

export async function fetchFeatured(limit = 3) {
  return unwrap(await client
    .from("catalog_list")
    .select(LIST_COLUMNS)
    .eq("is_featured", true)
    .order("sort_order", { ascending: true })
    .limit(limit));
}

/**
 * Pagina del catalogo con filtros resueltos en Postgres.
 * Devuelve { data, count } donde count es el total que coincide con los filtros.
 */
export async function fetchProductsPage({ page = 0, search = "", category = "all", brand = "all", status = "all", sort = "default", signal } = {}) {
  const from = page * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = client
    .from("catalog_list")
    .select(LIST_COLUMNS, { count: "exact" });

  const term = normalizeSearch(search);

  if (term) {
    // Usa el indice trigram de products.search_text
    query = query.ilike("search_text", `%${escapeLike(term)}%`);
  }

  if (category !== "all") {
    query = query.eq("category_slug", category);
  }

  if (brand !== "all") {
    query = query.eq("brand_slug", brand);
  }

  if (STATUS_GROUPS[status]) {
    query = query.in("stock_status", STATUS_GROUPS[status]);
  }

  for (const [column, ascending] of SORTS[sort] ?? SORTS.default) {
    query = query.order(column, { ascending });
  }

  query = query.range(from, to);

  if (signal) {
    query = query.abortSignal(signal);
  }

  const { data, error, count } = await query;

  if (error) {
    throw error;
  }

  return { data, count: count ?? 0 };
}

export async function fetchProductBySlug(slug) {
  return unwrap(await client
    .from("catalog_list")
    .select(LIST_COLUMNS)
    .eq("slug", slug)
    .maybeSingle());
}

// La galeria completa se pide solo al abrir el visor
export async function fetchGallery(productId) {
  return unwrap(await client
    .from("product_images")
    .select("image_url, thumb_url, alt_text, width, height")
    .eq("product_id", productId)
    .order("is_primary", { ascending: false })
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true }));
}
