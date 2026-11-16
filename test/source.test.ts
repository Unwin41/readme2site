import { describe, expect, it } from 'vitest';
import { resolveSource } from '../src/source';
import { UserError } from '../src/types';
import { resolveAsset, resolveLink } from '../src/urls';

const never = () => false;
const always = () => true;

describe('resolveSource', () => {
  it('understands owner/repo', () => {
    expect(resolveSource('vercel/next.js', never)).toEqual({ kind: 'github', owner: 'vercel', repo: 'next.js' });
  });

  it('understands GitHub URLs, .git suffixes and branches', () => {
    expect(resolveSource('https://github.com/a/b', never)).toMatchObject({ owner: 'a', repo: 'b' });
    expect(resolveSource('https://github.com/a/b.git', never)).toMatchObject({ owner: 'a', repo: 'b' });
    expect(resolveSource('github.com/a/b/tree/dev/docs', never)).toMatchObject({ owner: 'a', repo: 'b', ref: 'dev' });
  });

  it('prefers an existing folder over owner/repo', () => {
    expect(resolveSource('docs/site', always).kind).toBe('local');
  });

  it('treats . as a folder', () => {
    expect(resolveSource('.', always).kind).toBe('local');
  });

  it('rejects nonsense with a friendly error', () => {
    expect(() => resolveSource('not a thing', never)).toThrow(UserError);
    expect(() => resolveSource('  ', never)).toThrow(UserError);
  });
});

describe('url resolution', () => {
  const gh = { kind: 'github' as const, owner: 'a', repo: 'b', branch: 'main' };

  it('rewrites relative paths for github sources', () => {
    expect(resolveAsset('./img/x.png', gh)).toBe('https://raw.githubusercontent.com/a/b/main/img/x.png');
    expect(resolveLink('docs/x.md', gh)).toBe('https://github.com/a/b/blob/main/docs/x.md');
  });

  it('leaves absolute, protocol-relative and fragment URLs alone', () => {
    for (const url of ['https://x.dev/a.png', '//x.dev/a.png', '#install', 'mailto:a@b.c']) {
      expect(resolveAsset(url, gh)).toBe(url);
    }
  });
});
