// Centralized helpers for placeholder images used in mock mode.
// These return stable, cacheable URLs from public placeholder services.

/** Generate a deterministic avatar image URL for a given id. */
export function avatarUrl(id: string, size = 96) {
  // pravatar supports stable images by user seed param
  const seed = encodeURIComponent(id);
  return `https://i.pravatar.cc/${size}?u=${seed}`;
}

/** Generic random image (e.g., for attachments) with a stable seed. */
export function randomImage(seed: string | number, width = 800, height = 600) {
  const s = encodeURIComponent(String(seed));
  return `https://picsum.photos/seed/${s}/${width}/${height}`;
}

/** Simple course banner placeholder with text overlay. */
export function courseBanner(text: string, width = 1200, height = 400) {
  const t = encodeURIComponent(text);
  return `https://placehold.co/${width}x${height}/e5e7eb/111111?text=${t}`; // light gray bg, dark text
}
