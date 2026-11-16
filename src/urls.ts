import { relative, resolve } from 'node:path';
import type { UrlContext } from './types';

// Anything with a scheme, protocol-relative, or a pure fragment is left alone.
const ABSOLUTE = /^([a-z][a-z0-9+.-]*:|\/\/|#)/i;

function clean(path: string): string {
  return path.replace(/^\.?\//, '').replace(/^\/+/, '');
}

function local(url: string, ctx: UrlContext): string {
  if (!ctx.baseDir || !ctx.outDir) return url;
  const rel = relative(resolve(ctx.outDir), resolve(ctx.baseDir, clean(url)));
  return rel.split('\\').join('/');
}

/** URL for something the page loads (images). */
export function resolveAsset(url: string, ctx: UrlContext): string {
  if (!url || ABSOLUTE.test(url)) return url;
  if (ctx.kind === 'local') return local(url, ctx);
  return `https://raw.githubusercontent.com/${ctx.owner}/${ctx.repo}/${ctx.branch ?? 'HEAD'}/${clean(url)}`;
}

/** URL for something the visitor clicks (links to files in the repo). */
export function resolveLink(url: string, ctx: UrlContext): string {
  if (!url || ABSOLUTE.test(url)) return url;
  if (ctx.kind === 'local') return local(url, ctx);
  return `https://github.com/${ctx.owner}/${ctx.repo}/blob/${ctx.branch ?? 'HEAD'}/${clean(url)}`;
}
