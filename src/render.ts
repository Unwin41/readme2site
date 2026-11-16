import type { SiteData } from './types';
import { type Theme, themes } from './themes';

// TODO: point this at the real repository once it is published.
export const PROJECT_URL = 'https://github.com/OWNER/readme2site';

const HEX = /^#[0-9a-f]{6}$/i;

export function esc(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** 1234 -> 1.2k */
export function compact(n: number): string {
  if (n < 1000) return String(n);
  if (n < 1_000_000) return `${(n / 1000).toFixed(n < 10_000 ? 1 : 0).replace(/\.0$/, '')}k`;
  return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
}

function safeUrl(url: string | undefined): string | undefined {
  return url && /^https?:\/\//i.test(url) ? url : undefined;
}

export function renderSite(data: SiteData, themeId = 'minimal'): string {
  const theme: Theme = themes[themeId] ?? themes.minimal!;
  const accent = data.accent && HEX.test(data.accent) ? data.accent : theme.accent;
  const { repo } = data;
  const repoUrl = safeUrl(repo.url);
  const homepage = safeUrl(repo.homepage);
  const hero = data.heroImage;
  const title = `${data.name} — ${data.tagline}`.slice(0, 120);

  const stars = repo.stars !== undefined ? ` <span aria-label="${repo.stars} stars">${compact(repo.stars)}</span>` : '';
  const starBtn = repoUrl
    ? `<a class="btn primary" href="${esc(repoUrl)}">⭐ Star on GitHub${stars}</a>`
    : '';
  const startBtn = data.install
    ? `<a class="btn" href="#get-started">Get started</a>`
    : data.sections[0]
      ? `<a class="btn" href="#s0">Read more</a>`
      : '';

  const topics = repo.topics.length
    ? `<div class="topics">${repo.topics
        .slice(0, 8)
        .map((t) => `<span class="topic">${esc(t)}</span>`)
        .join('')}</div>`
    : '';

  const install = data.install
    ? `<div class="install" id="get-started"><code>${esc(data.install.cmd)}</code><button type="button" data-copy="${esc(data.install.cmd)}">Copy</button></div>`
    : '';

  const shot = hero ? `<img class="shot" src="${esc(hero)}" alt="${esc(data.name)} preview" loading="lazy">` : '';

  const features = data.features.length
    ? `<section class="block"><div class="wrap"><div class="features">${data.features
        .map(
          (f) =>
            `<div class="card">${f.icon ? `<div class="icon" aria-hidden="true">${esc(f.icon)}</div>` : ''}${
              f.title ? `<h3>${esc(f.title)}</h3>` : ''
            }<p>${esc(f.body)}</p></div>`,
        )
        .join('')}</div></div></section>`
    : '';

  const sections = data.sections
    .map(
      (s, i) =>
        `<section class="block" id="s${i}"><div class="wrap"><h2 class="heading">${esc(s.title)}</h2><div class="prose">${s.html}</div></div></section>`,
    )
    .join('\n');

  const navLinks = [
    homepage ? `<a class="hide-sm" href="${esc(homepage)}">Website</a>` : '',
    repoUrl ? `<a href="${esc(repoUrl)}">GitHub</a>` : '',
  ].join('');

  const meta = [
    `<meta name="description" content="${esc(data.tagline)}">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:title" content="${esc(title)}">`,
    `<meta property="og:description" content="${esc(data.tagline)}">`,
    hero && safeUrl(hero) ? `<meta property="og:image" content="${esc(hero)}">` : '',
    `<meta name="twitter:card" content="${hero && safeUrl(hero) ? 'summary_large_image' : 'summary'}">`,
  ]
    .filter(Boolean)
    .join('\n');

  const license = repo.license ? `<span>${esc(repo.license)} license</span>` : '<span></span>';

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
${meta}
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ctext y='.9em' font-size='90'%3E%F0%9F%93%84%3C/text%3E%3C/svg%3E">
<style>${theme.css.replace(':root{', () => `:root{--accent:${accent};`)}</style>
</head>
<body>
<nav><div class="wrap"><a class="brand" href="#">${esc(data.name)}</a><div class="navlinks">${navLinks}</div></div></nav>
<header class="hero"><div class="wrap">
<h1>${esc(data.name)}</h1>
<p class="tagline">${esc(data.tagline)}</p>
<div class="actions">${starBtn}${startBtn}</div>
${install}
${topics}
${shot}
</div></header>
<main>
${features}
${sections}
</main>
<footer><div class="wrap">${license}<span>Made with <a href="${PROJECT_URL}">readme2site</a></span></div></footer>
<script>document.querySelectorAll("[data-copy]").forEach(function(b){b.addEventListener("click",function(){navigator.clipboard.writeText(b.getAttribute("data-copy")).then(function(){b.textContent="Copied!";setTimeout(function(){b.textContent="Copy"},1500)})})})</script>
</body>
</html>
`;
}
