// This manifest selects a verified byte-for-byte mirror. Missing configuration
// keeps ordinary relative URLs working for local previews and static hosting.
let assetBase = "";
let localAssetPrefixes = [];
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 3000);
try {
  const response = await fetch("content/media-delivery.json?v=planetary-curves-v1-20261029", { signal: controller.signal });
  if (response.ok) {
    const config = await response.json();
    if (Array.isArray(config.localAssetPrefixes)) {
      localAssetPrefixes = config.localAssetPrefixes.filter((prefix) => typeof prefix === "string")
        .map((prefix) => prefix.trim().replace(/^\/+/, "").replace(/^assets\//, "").replace(/\/+$/, ""))
        .filter(Boolean).map((prefix) => `${prefix}/`);
    }
    if (config.enabled !== false && config.assetBaseUrl) {
      const base = new URL(config.assetBaseUrl);
      if (base.protocol === "https:") assetBase = base.href.replace(/\/?$/, "/");
    }
  }
} catch { /* The local assets remain a complete fallback. */ }
finally { clearTimeout(timeout); }

function assetPath(source) {
  if (!source) return null;
  const value = String(source);
  try {
    const url = new URL(value, document.baseURI);
    const localBase = new URL("assets/", document.baseURI);
    if (url.origin === localBase.origin && url.pathname.startsWith(localBase.pathname)) {
      return url.pathname.slice(localBase.pathname.length) + url.search + url.hash;
    }
    if (assetBase) {
      const mirrorBase = new URL("assets/", assetBase);
      if (url.origin === mirrorBase.origin && url.pathname.startsWith(mirrorBase.pathname)) {
        return url.pathname.slice(mirrorBase.pathname.length) + url.search + url.hash;
      }
    }
  } catch { /* Non-asset inputs are left unchanged. */ }
  return null;
}

export function mediaUrl(source) {
  const relative = assetPath(source);
  // Compare whole directory prefixes, including for already mirrored URLs.
  if (relative !== null && localAssetPrefixes.some((prefix) => relative.startsWith(prefix))) {
    return originalMediaUrl(source);
  }
  return assetBase && relative !== null ? new URL(`assets/${relative}`, assetBase).href : source;
}

export function originalMediaUrl(source) {
  const relative = assetPath(source);
  return relative === null ? source : new URL(`assets/${relative}`, document.baseURI).href;
}

const records = new WeakMap();

function useLocalSource(element, record) {
  if (!record || record.fallback || !record.mirrored) return;
  record.fallback = true;
  element.setAttribute("src", record.local);
  if (element instanceof HTMLVideoElement) {
    element.load();
    element.dispatchEvent(new Event("mediafallback"));
  }
}

/** Apply the mirror, falling back once if that individual resource fails. */
export function setMediaUrl(element, attribute, source) {
  if (!source) return;
  const local = originalMediaUrl(source);
  const delivered = mediaUrl(source);
  let attributes = records.get(element);
  if (!attributes) {
    attributes = new Map();
    records.set(element, attributes);
    element.addEventListener("error", () => useLocalSource(element, attributes.get("src")));
  }
  const mirrored = new URL(delivered, document.baseURI).href !== new URL(local, document.baseURI).href;
  const record = { local, delivered, mirrored, fallback: false };
  attributes.set(attribute, record);
  const current = element.getAttribute(attribute);
  if (!current || new URL(current, document.baseURI).href !== new URL(delivered, document.baseURI).href) {
    element.setAttribute(attribute, delivered);
  }
  // The hero starts from HTML before modules arrive. Catch an earlier failure
  // as well as future error events without restarting a healthy initial load.
  if (attribute === "src" && mirrored && (
    (element instanceof HTMLVideoElement && element.error) ||
    (element instanceof HTMLImageElement && element.complete && !element.naturalWidth)
  )) useLocalSource(element, record);
  // Poster failures do not produce a video error event. The browser shares this
  // image request/cache entry with the poster; the probe supplies its error hook.
  if (attribute === "poster" && mirrored) {
    const probe = new Image();
    probe.decoding = "async";
    probe.onerror = () => {
      if (attributes.get(attribute) === record) element.setAttribute(attribute, local);
    };
    probe.src = delivered;
  }
}
