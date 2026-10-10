/**
 * Utilities to sanitize scraped product descriptions and description HTML,
 * removing raw JSON widget code (e.g. Alibaba 1688 offer-type-1 / sdmap JSON),
 * Baidu pan links, and layout template code.
 */

export function cleanProductDescription(
  rawDesc: string | null | undefined,
  fallbackTitle?: string
): string {
  if (!rawDesc || typeof rawDesc !== "string") {
    return fallbackTitle
      ? `Premium export quality ${fallbackTitle} imported directly from verified China manufacturing facilities. Engineered to rigorous international standards with durable materials. Fully inspected prior to international freight dispatch.`
      : "Direct factory wholesale supply. High quality materials with strict pre-shipment inspection.";
  }

  let text = rawDesc;

  // 1. Remove raw JSON blocks like {"styleType":"offer-type-1",...} and HTML-encoded variants
  text = text.replace(/\{(\s*|&quot;|")styleType(&quot;|"|\s*):[\s\S]*?\}/gi, " ");
  text = text.replace(/\{[\s\S]*?offer-type-[\s\S]*?\}/gi, " ");
  text = text.replace(/\{"items":"[\d,]+"[^}]*\}/gi, " ");
  text = text.replace(/\{&quot;items&quot;:&quot;[\d,]+&quot;[^}]*\}/gi, " ");
  text = text.replace(/"usemap":"_sdmap_\d+"/gi, " ");
  text = text.replace(/&quot;usemap&quot;:&quot;_sdmap_\d+&quot;/gi, " ");

  // 2. Remove any remaining JSON-like fragments that start with {" and end with }
  text = text.replace(/\{"[a-zA-Z0-9_-]+":\s*"[^"]*"(,\s*"[a-zA-Z0-9_-]+":\s*"[^"]*")*\}/g, " ");

  // 3. Remove Baidu cloud disk / raw image pack links
  text = text.replace(/图包下载链接[：:][\s\S]*?(https?:\/\/[^\s]+)(\?pwd=[a-zA-Z0-9]+)?/gi, " ");
  text = text.replace(/https?:\/\/pan\.baidu\.com\/[^\s]+/gi, " ");
  text = text.replace(/提取码[：:]\s*[a-zA-Z0-9]+/gi, " ");
  text = text.replace(/pwd=[a-zA-Z0-9]+/gi, " ");

  // 4. Decode HTML entities and strip unwanted tags
  text = text.replace(/<[^>]+>/g, " ");
  text = text
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ");

  // 5. Clean up duplicate punctuation, brackets and whitespace
  text = text.replace(/[{}\[\]"]+/g, " ");
  text = text.replace(/\s+/g, " ").trim();

  // 6. If the remaining text is too short, mostly Chinese template filler, or was completely garbage
  if (
    !text ||
    text.length < 15 ||
    text.includes("styleType") ||
    text.includes("offer-type") ||
    text.startsWith(":") ||
    text.startsWith("{")
  ) {
    return fallbackTitle
      ? `Premium export quality ${fallbackTitle} imported directly from verified China manufacturing facilities. Engineered to rigorous international standards with durable materials. Fully inspected prior to international freight dispatch.`
      : "Direct factory wholesale supply. High quality materials with strict pre-shipment inspection.";
  }

  return text;
}

export function cleanProductDescriptionHtml(
  rawHtml: string | null | undefined
): string | null {
  if (!rawHtml || typeof rawHtml !== "string") return null;

  let html = rawHtml;

  // Remove Alibaba recommendation widgets / dynamic offer templates
  html = html.replace(
    /<div[^>]*class="[^"]*sdmap-dynamic-offer-list[^"]*"[^>]*>[\s\S]*?<\/div>/gi,
    ""
  );
  html = html.replace(/<div[^>]*id="offer-template-\d+"[^>]*>[\s\S]*?<\/div>/gi, "");
  html = html.replace(/\{(&quot;|")styleType(&quot;|"):[\s\S]*?\}/gi, "");
  html = html.replace(/\{[\s\S]*?offer-type-[\s\S]*?\}/gi, "");

  // Remove Baidu pan links
  html = html.replace(/https?:\/\/pan\.baidu\.com\/[^\s"<]+/gi, "");
  html = html.replace(/图包下载链接[：:][\s\S]*?(\?pwd=[a-zA-Z0-9]+)?/gi, "");

  html = html.trim();
  // If only empty divs remain, return null
  const textOnly = html.replace(/<[^>]+>/g, "").trim();
  if (html.length < 30 && textOnly.length === 0) return null;

  return html;
}
