/**
 * Atribución de origen (D2) — SOLO CLIENTE.
 * First-touch: se captura una vez (UTM + referrer + landing) y se persiste
 * 90 días; las visitas siguientes NO la pisan. Los formularios la envían al
 * servidor junto con la participación/cupón.
 */
const CLAVE = "sv_attr";
const DIAS = 90;

export type Atribucion = {
  source?: string;
  medium?: string;
  campaign?: string;
  content?: string;
  term?: string;
  referrer?: string;
  landing?: string;
};

const UTM: [keyof Atribucion, string][] = [
  ["source", "utm_source"],
  ["medium", "utm_medium"],
  ["campaign", "utm_campaign"],
  ["content", "utm_content"],
  ["term", "utm_term"],
];

export function captureAttribution(): void {
  try {
    const guardada = localStorage.getItem(CLAVE);
    if (guardada) {
      const { exp } = JSON.parse(guardada) as { exp?: number };
      if (!exp || exp > Date.now()) return; // first-touch vigente: no pisar
    }
    const p = new URLSearchParams(location.search);
    const attr: Atribucion = {};
    for (const [k, param] of UTM) {
      const v = p.get(param);
      if (v) attr[k] = v.slice(0, 120);
    }
    // gclid/fbclid delatan el canal aunque falte el utm_source.
    if (!attr.source && p.get("fbclid")) attr.source = "facebook-ads";
    if (!attr.source && p.get("gclid")) attr.source = "google-ads";
    const tieneUtm = Object.keys(attr).length > 0;
    const referrer = document.referrer || "";
    // Sin UTM ni referrer externo no hay nada que atribuir todavía.
    if (!tieneUtm && (!referrer || referrer.includes(location.hostname))) return;
    if (referrer && !referrer.includes(location.hostname)) {
      attr.referrer = referrer.slice(0, 200);
    }
    attr.landing = location.pathname.slice(0, 120);
    localStorage.setItem(
      CLAVE,
      JSON.stringify({ attr, exp: Date.now() + DIAS * 86400000 })
    );
  } catch {
    /* sin memoria local */
  }
}

export function getAttribution(): Atribucion {
  try {
    const raw = localStorage.getItem(CLAVE);
    if (!raw) return {};
    const { attr, exp } = JSON.parse(raw) as { attr: Atribucion; exp?: number };
    if (exp && exp < Date.now()) return {};
    return attr ?? {};
  } catch {
    return {};
  }
}
