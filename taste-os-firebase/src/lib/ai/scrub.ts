import "server-only";

/**
 * Lightweight PII scrub applied to free emotional writing before it is
 * embedded or sent to OpenAI. Not a replacement for a full NER pass, but it
 * removes the obvious identifiers — the system wants the *feeling*, not the
 * facts of a life. (See ai-integration.md §9.)
 */
export function scrub(text: string): string {
  return text
    .replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, "—") // emails
    .replace(/(\+?\d[\d\s-]{7,}\d)/g, "—") // phone-like numbers
    .replace(/https?:\/\/\S+/g, "—") // urls
    .replace(/@[A-Za-z0-9_]{2,}/g, "—") // @handles
    .trim();
}
