const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const PHONE_RE = /(?:\+|00)?\d[\d\s().-]{7,}\d/g;
const URL_RE = /https?:\/\/[^\s)]+/gi;
const WHATSAPP_RE = /whats?app|telegram|viber/gi;

export function sanitizePublicText(input?: string | null) {
  if (!input) return "";
  return input
    .replace(EMAIL_RE, "[coordonnées masquées]")
    .replace(URL_RE, "[lien masqué]")
    .replace(PHONE_RE, "[téléphone masqué]")
    .replace(WHATSAPP_RE, "[messagerie masquée]");
}

export function looksLikeContactLeak(input?: string | null) {
  if (!input) return false;
  return EMAIL_RE.test(input) || URL_RE.test(input) || PHONE_RE.test(input);
}

export function platformContactBlock(settings: {
  name: string;
  email: string;
  phone: string;
  address: string;
}) {
  return {
    displayedAs: settings.name,
    email: settings.email,
    phone: settings.phone,
    address: settings.address,
    note: "Les coordonnées du vendeur sont gérées exclusivement par la plateforme.",
  };
}
