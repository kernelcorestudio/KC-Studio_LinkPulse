// Tiny LRU cache for link lookups (redirect hot path). Invalidated on update/disable.
class LRUCache {
  constructor(max = 1000) {
    this.max = max;
    this.map = new Map();
  }
  get(key) {
    if (!this.map.has(key)) return undefined;
    const v = this.map.get(key);
    // refresh recency
    this.map.delete(key);
    this.map.set(key, v);
    return v;
  }
  has(key) {
    return this.map.has(key);
  }
  set(key, value) {
    if (this.map.has(key)) this.map.delete(key);
    else if (this.map.size >= this.max) {
      const oldest = this.map.keys().next().value;
      this.map.delete(oldest);
    }
    this.map.set(key, value);
  }
  delete(key) {
    this.map.delete(key);
  }
  clear() {
    this.map.clear();
  }
  get size() {
    return this.map.size;
  }
}

export const linkCache = new LRUCache(5000);

// Wrapper: cache a "not found" result too, so repeated hits on a bad code
// don't hammer the DB. null means "known missing".
export async function getCachedLink(code, loader) {
  if (linkCache.has(code)) {
    const hit = linkCache.get(code);
    return hit === null ? null : hit;
  }
  const row = await loader(code);
  linkCache.set(code, row || null);
  return row || null;
}
