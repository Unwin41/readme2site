import { describe, expect, it } from 'vitest';
import { compact, esc, renderSite } from '../src/render';
import { themeIds } from '../src/themes';
import type { SiteData } from '../src/types';

const data: SiteData = {
  name: 'Acme <Tool>',
  tagline: 'Renames "files" & more',
  heroImage: 'https://example.com/shot.png',
  install: { cmd: 'npm i -g acme' },
  features: [{ title: 'Fast', body: 'Very fast', icon: '⚡' }],
  sections: [{ title: 'Usage', html: '<p>Run it</p>' }],
  repo: { name: 'tool', url: 'https://github.com/a/tool', stars: 12345, license: 'MIT', topics: ['cli'] },
  accent: '#ff0066',
};

describe('renderSite', () => {
  it.each(themeIds)('renders the %s theme as a complete document', (id) => {
    const html = renderSite(data, id);
    expect(html.startsWith('<!doctype html>')).toBe(true);
    expect(html).toContain('</html>');
    expect(html).toContain('--accent:#ff0066');
  });

  it('escapes text fields', () => {
    const html = renderSite(data);
    expect(html).toContain('Acme &lt;Tool&gt;');
    expect(html).toContain('Renames &quot;files&quot; &amp; more');
    expect(html).not.toContain('Acme <Tool>');
  });

  it('ignores an invalid accent color instead of injecting it', () => {
    const html = renderSite({ ...data, accent: 'red;}</style><script>alert(1)</script>' });
    expect(html).not.toContain('<script>alert(1)');
    expect(html).toContain('--accent:#2563eb');
  });

  it('only emits http(s) links for repo and homepage', () => {
    const html = renderSite({ ...data, repo: { ...data.repo, url: 'javascript:alert(1)', homepage: 'javascript:alert(2)' } });
    expect(html).not.toContain('javascript:');
  });

  it('shows a compact star count and the install command', () => {
    const html = renderSite(data);
    expect(html).toContain('12k');
    expect(html).toContain('npm i -g acme');
  });

  it('falls back to the minimal theme for unknown ids', () => {
    expect(renderSite(data, 'nope')).toContain('<!doctype html>');
  });
});

describe('helpers', () => {
  it('compacts numbers', () => {
    expect([999, 1000, 1234, 12345, 1_500_000].map(compact)).toEqual(['999', '1k', '1.2k', '12k', '1.5M']);
  });

  it('escapes quotes', () => {
    expect(esc(`<a href="x">'`)).toBe('&lt;a href=&quot;x&quot;&gt;&#39;');
  });
});
