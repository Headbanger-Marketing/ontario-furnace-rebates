// Derive markup from the rendered questions so hidden or stale answers cannot drift.
const plain = html => html.replace(/<[^>]*>/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, ' ').trim();
export function faqSchemaForPage(page, base) {
  const pairs = [...page.body.matchAll(/<details[^>]*>\s*<summary[^>]*>([^]*?)<\/summary>([^]*?)<\/details>/g)].map(m => [plain(m[1]), plain(m[2])]);
  if (page.url === '/faq/') {
    for (const match of page.body.replace(/<aside[^]*?<\/aside>/g, '').matchAll(/<h2[^>]*>([^]*?)<\/h2>\s*<p>([^]*?)<\/p>/g)) {
      const question = plain(match[1]);
      if (question.endsWith('?')) pairs.push([question, plain(match[2])]);
    }
  }
  if (!pairs.length) return [];
  if (new Set(pairs.map(([q]) => q)).size !== pairs.length) throw new Error(`Duplicate FAQ on ${page.url}`);
  return [{'@context':'https://schema.org','@type':'FAQPage','@id':base+page.url+'#faq',mainEntity:pairs.map(([name,text])=>({'@type':'Question',name,acceptedAnswer:{'@type':'Answer',text}}))}];
}
