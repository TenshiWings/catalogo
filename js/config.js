// supabase-config.js (script clasico) define la URL y la publishable key.
// Se comparte con /admin, por eso no se mueve.
const raw = window.SCREAMS_SUPABASE_CONFIG ?? {};

export const SUPABASE_URL = raw.url ?? "";
export const SUPABASE_ANON_KEY = raw.anonKey ?? "";
export const PAGE_SIZE = 24;
export const SEARCH_DEBOUNCE_MS = 250;

export const DEFAULT_SETTINGS = {
  store_name: "Screams Collector",
  whatsapp_number: "",
  hero_kicker: "Coleccionismo con actitud",
  hero_title: "Tu universo de Monster High, juguetes y juegos de mesa",
  hero_subtitle: "Figuras coleccionables, ediciones especiales y clasicos para jugar.",
  hero_primary_cta_label: "Ver catalogo",
  hero_primary_cta_target: "#catalogo",
  hero_secondary_cta_label: "Pedir por WhatsApp",
  hero_secondary_cta_target: "#contacto",
  contact_title: "Atencion personalizada",
  contact_body: "Tambien puedes usar los botones de cada producto para enviar un mensaje con informacion precargada.",
  contact_button_label: "Contactar por WhatsApp"
};
