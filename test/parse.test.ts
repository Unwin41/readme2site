import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parseReadme } from '../src/parse';
import type { RepoMeta, UrlContext } from '../src/types';

const meta: RepoMeta = { owner: 'acme', name: 'tool', topics: [], branch: 'main' };
const ctx: UrlContext = { kind: 'github', owner: 'acme', repo: 'tool', branch: 'main' };
const fixture = readFileSync(new URL('./fixtures/badges.md', import.meta.url), 'utf8');
const data = parseReadme(fixture, meta, ctx);

describe('parseReadme', () => {
  it('finds the name in an html <h1>', () => {
    expect(data.name).toBe('Acme Tool');
  });

  it('skips badge lines when picking the tagline', () => {
    expect(data.tagline).toMatch(/^A tiny command line tool/);
  });

  it('picks the first non-badge image and makes it absolute', () => {
    expect(data.heroImage).toBe('https://raw.githubusercontent.com/acme/tool/main/assets/logo.png');
  });

  it('finds the install command and strips the prompt', () => {
    expect(data.install?.cmd).toBe('npm install -g acme-tool');
  });

  it('turns the Features list into cards', () => {
    expect(data.features).toHaveLength(3);
    expect(data.features[0]).toEqual({ title: 'Fast', body: 'handles 100k files in under a second' });
    expect(data.features[1]?.title).toBe('Safe');
    expect(data.features[2]).toEqual({ title: '', body: 'Works on Windows, macOS and Linux' });
  });

  it('drops Features, TOC, Contributing and License from the sections', () => {
    expect(data.sections.map((s) => s.title)).toEqual(['Install', 'Usage']);
  });

  it('rewrites relative links to the repo', () => {
    const usage = data.sections.find((s) => s.title === 'Usage')!;
    expect(usage.html).toContain('href="https://github.com/acme/tool/blob/main/docs/usage.md"');
  });

  it('removes scripts, event handlers and javascript: links', () => {
    const html = data.sections.map((s) => s.html).join('');
    expect(html).not.toMatch(/<script/i);
    expect(html).not.toMatch(/onerror/i);
    expect(html).not.toMatch(/javascript:/i);
  });

  it('falls back to repo metadata when the README has no title or prose', () => {
    const bare = parseReadme('## Usage\n\nRun it.\n', { ...meta, description: 'From the API' }, ctx);
    expect(bare.name).toBe('tool');
    expect(bare.tagline).toBe('From the API');
    expect(bare.sections).toHaveLength(1);
  });

  it('is deterministic', () => {
    expect(parseReadme(fixture, meta, ctx)).toEqual(data);
  });
});
