import { type Token, type Tokens, type TokensList, marked } from 'marked';
import { cleanHtml } from './sanitize';
import type { Feature, RepoMeta, Section, SiteData, UrlContext } from './types';
import { resolveAsset } from './urls';

const BADGE_URL =
  /(shields\.io|badgen|badge|travis-ci|circleci|codecov|coveralls|codacy|sonarcloud|bestpractices|opencollective\.com|github\.com\/[^/]+\/[^/]+\/(actions|workflows)|snyk\.io|app\.netlify)/i;
const INSTALL_LINE =
  /^(npm (i|install|create)\b|npx\s|pnpm (add|i|dlx|create)\b|yarn (add|global|create)\b|bun (add|create|x)\b|pip3? install\b|pipx (install|run)\b|uv (add|tool|pip)\b|brew install\b|cargo (install|add)\b|go (install|get)\b|docker (run|pull)\b|gem install\b|composer require\b|dotnet (add|tool)\b|curl\s.*\|\s*(ba)?sh)/i;
const FEATURE_TITLE = /^(key |main |core )?(features?|highlights|why\b|özellikler|what you get|what's included)/i;
const SKIP_TITLE =
  /^(table of contents|contents|toc|license|licen[cs]e|lisans|contributing|contributors|contribution|katk[ıi]|code of conduct|acknowledg|sponsors?|backers)/i;

/** Markdown/HTML snippet -> plain text. */
export function plain(md: string): string {
  return md
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '') // images
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') // links keep their text
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/[`*_~]/g, '')
    .replace(/^#+\s*/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function h1FromHtml(raw: string): string | undefined {
  const m = /<h1[^>]*>([\s\S]*?)<\/h1>/i.exec(raw);
  const text = m ? plain(m[1]!) : '';
  return text || undefined;
}

function firstImage(raw: string): string | undefined {
  const re = /!\[[^\]]*\]\(\s*<?([^)\s>]+)|<img[^>]+src\s*=\s*["']([^"']+)["']/gi;
  for (let m = re.exec(raw); m; m = re.exec(raw)) {
    const url = m[1] ?? m[2];
    if (url && !BADGE_URL.test(url)) return url;
  }
  return undefined;
}

function toList(tokens: Token[], links: TokensList['links']): TokensList {
  return Object.assign([...tokens], { links }) as unknown as TokensList;
}

function toFeature(text: string): Feature {
  const bold = /^\*\*(.+?)\*\*\s*[:\-–—]*\s*([\s\S]*)$/.exec(text);
  if (bold) return { title: plain(bold[1]!), body: plain(bold[2]!) };
  const lead = /^`?([^:—–]{2,40}?)`?\s*(?:[:—–]|\s-\s)\s*([\s\S]+)$/.exec(text);
  if (lead) return { title: plain(lead[1]!), body: plain(lead[2]!) };
  return { title: '', body: plain(text) };
}

/**
 * Turn a README into structured data. No network, no randomness: the same
 * README always gives the same SiteData.
 */
export function parseReadme(readme: string, meta: RepoMeta, ctx: UrlContext): SiteData {
  const lexed = marked.lexer(readme);
  const links = lexed.links;
  const tokens = [...lexed] as Token[];

  const firstH2 = tokens.findIndex((t) => t.type === 'heading' && (t as Tokens.Heading).depth === 2);
  const introEnd = firstH2 === -1 ? tokens.length : firstH2;
  const intro = tokens.slice(0, introEnd);

  // --- name ---
  let name: string | undefined;
  let nameIndex = -1;
  intro.some((t, i) => {
    if (t.type === 'heading' && (t as Tokens.Heading).depth === 1) {
      name = plain((t as Tokens.Heading).text);
    } else if (t.type === 'html') {
      name = h1FromHtml(t.raw);
    }
    if (name) nameIndex = i;
    return Boolean(name);
  });
  name = name || meta.name;

  // --- tagline: first real prose after the title (badge-only lines have no text) ---
  let tagline: string | undefined;
  let taglineIndex = -1;
  intro.some((t, i) => {
    if (i <= nameIndex) return false;
    if (t.type !== 'paragraph' && t.type !== 'blockquote') return false;
    const text = plain(t.raw.replace(/^>\s?/gm, ''));
    if (text.length < 12) return false;
    tagline = text.length > 220 ? `${text.slice(0, 217).trimEnd()}...` : text;
    taglineIndex = i;
    return true;
  });
  tagline = tagline || meta.description || `${name}`;

  // --- hero image: first non-badge image before the first "##" ---
  let heroImage: string | undefined;
  for (const t of intro) {
    const found = firstImage(t.raw);
    if (found) {
      heroImage = resolveAsset(found, ctx);
      break;
    }
  }

  // --- install command: first line in a code block that looks like one ---
  let install: SiteData['install'];
  for (const t of tokens) {
    if (t.type !== 'code') continue;
    const line = (t as Tokens.Code).text
      .split('\n')
      .map((l) => l.replace(/^\s*[$>]\s+/, '').trim())
      .find((l) => INSTALL_LINE.test(l));
    if (line) {
      install = { cmd: line };
      break;
    }
  }

  // --- sections ---
  const groups: { title: string; tokens: Token[] }[] = [];
  for (const t of tokens.slice(introEnd)) {
    if (t.type === 'heading' && (t as Tokens.Heading).depth === 2) {
      groups.push({ title: plain((t as Tokens.Heading).text), tokens: [] });
    } else {
      groups[groups.length - 1]?.tokens.push(t);
    }
  }

  // No "##" sections at all: fall back to whatever prose the intro has left.
  if (groups.length === 0) {
    const rest = intro.filter((t, i) => i !== nameIndex && i !== taglineIndex && t.type !== 'space' && plain(t.raw));
    if (rest.length > 0) groups.push({ title: 'Overview', tokens: rest });
  }

  const features: Feature[] = [];
  const sections: Section[] = [];
  for (const group of groups) {
    if (SKIP_TITLE.test(group.title)) continue;

    let body = group.tokens;
    if (features.length === 0 && FEATURE_TITLE.test(group.title)) {
      const listAt = body.findIndex((t) => t.type === 'list');
      if (listAt !== -1) {
        const list = body[listAt] as Tokens.List;
        features.push(...list.items.slice(0, 9).map((item) => toFeature(item.text)));
        body = body.filter((_, i) => i !== listAt);
      }
    }

    if (body.every((t) => t.type === 'space')) continue;
    const html = cleanHtml(marked.parser(toList(body, links)), ctx);
    if (!html.trim()) continue;
    sections.push({ title: group.title, html });
  }

  return {
    name,
    tagline,
    heroImage,
    install,
    features,
    sections,
    repo: meta,
  };
}
