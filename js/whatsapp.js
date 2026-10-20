import { formatPrice, normalizePhone, productUrl } from "./utils.js";

let phone = "";

export function setWhatsappPhone(value) {
  phone = normalizePhone(value);
}

export function whatsappLink(message = "") {
  const base = `https://wa.me/${phone}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

/**
 * Mensaje prellenado con nombre exacto, precio, estado, referencia y enlace.
 * Si el producto tiene whatsapp_message_template se usa como saludo
 * y se le agregan los datos estructurados para que el vendedor identifique la pieza.
 */
export function buildProductMessage(product) {
  const greeting = product.whatsappMessageTemplate || "Hola, me interesa esta pieza del catalogo:";
  const reference = product.sku || product.slug;

  return [
    greeting,
    "",
    `Producto: ${product.name}`,
    product.brandLabel ? `Franquicia: ${product.brandLabel}` : null,
    `Precio: ${formatPrice(product.price)} MXN`,
    `Estado: ${product.stock}`,
    `Ref: ${reference}`,
    `Link: ${productUrl(product.slug)}`
  ]
    .filter((line) => line !== null)
    .join("\n");
}

export function productWhatsappLink(product) {
  return whatsappLink(buildProductMessage(product));
}
