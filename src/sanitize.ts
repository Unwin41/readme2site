import sanitizeHtml from 'sanitize-html';
import type { UrlContext } from './types';
import { resolveAsset, resolveLink } from './urls';

const ALLOWED_TAGS = [
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'a', 'ul', 'ol', 'li', 'b', 'i', 'strong', 'em',
  'del', 's', 'code', 'pre', 'hr', 'br', 'div', 'span', 'blockquote', 'table', 'thead',
  'tbody', 'tr', 'th', 'td', 'img', 'details', 'summary', 'kbd', 'sup', 'sub',
];

/**
 * README HTML is third-party content that ends up on a page the user hosts,
 * so everything goes through an allow-list: no scripts, iframes, forms, inline
 * styles, event handlers or javascript: URLs. Relative URLs are rewritten.
 */
export function cleanHtml(html: string, ctx: UrlContext): string {
  return sanitizeHtml(html, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: {
      a: ['href', 'title', 'name', 'rel'],
      img: ['src', 'alt', 'title', 'width', 'height'],
      code: ['class'],
      pre: ['class'],
      th: ['align'],
      td: ['align'],
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    allowedSchemesByTag: { img: ['http', 'https'] },
    transformTags: {
      a: (tagName, attribs) => {
        const next = { ...attribs, rel: 'noopener noreferrer' };
        if (attribs.href) next.href = resolveLink(attribs.href, ctx);
        return { tagName, attribs: next };
      },
      img: (tagName, attribs) => {
        const next = { ...attribs };
        if (attribs.src) next.src = resolveAsset(attribs.src, ctx);
        return { tagName, attribs: next };
      },
    },
  });
}
