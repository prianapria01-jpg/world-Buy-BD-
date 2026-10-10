const translationMemoryCache = new Map<string, string>();
const STORAGE_KEY = "wb_translation_cache_v1";

try {
  if (typeof window !== "undefined" && window.localStorage) {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        for (const [k, v] of Object.entries(parsed)) {
          if (typeof v === "string") translationMemoryCache.set(k, v);
        }
      }
    }
  }
} catch {}

function persistTranslationCache() {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      const entries = Array.from(translationMemoryCache.entries()).slice(-300);
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(Object.fromEntries(entries)));
    }
  } catch {}
}

export async function translateText(text: string): Promise<string> {
  if (!text) return "";
  const trimmed = text.trim();
  if (!trimmed) return "";

  const cached = translationMemoryCache.get(trimmed);
  if (cached) return cached;

  try {
    const res = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=en&dt=t&q=${encodeURIComponent(trimmed)}`);
    const data = await res.json();
    const result = data[0].map((item: any) => item[0]).join("");
    if (result) {
      translationMemoryCache.set(trimmed, result);
      persistTranslationCache();
    }
    return result || text;
  } catch (err) {
    console.error("Translation failed:", err);
    return text;
  }
}
