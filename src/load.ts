import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { basename, join } from 'node:path';
import type { Source } from './source';
import { type LoadedSource, type RepoMeta, UserError } from './types';

const API = 'https://api.github.com';

function headers(token: string | undefined, accept: string): Record<string, string> {
  const h: Record<string, string> = { 'User-Agent': 'readme2site', Accept: accept };
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

async function github(path: string, token: string | undefined, accept: string): Promise<Response> {
  let res: Response;
  try {
    res = await fetch(`${API}${path}`, { headers: headers(token, accept) });
  } catch (err) {
    throw new UserError(`Could not reach GitHub (${(err as Error).message}). Check your connection.`);
  }
  if (res.status === 404) throw new UserError('Repository or README not found. Is it public and spelled correctly?');
  if (res.status === 403 || res.status === 429) {
    const hint = token ? '' : ' Set GITHUB_TOKEN to raise the limit.';
    throw new UserError(`GitHub API rate limit or access problem (HTTP ${res.status}).${hint}`);
  }
  if (!res.ok) throw new UserError(`GitHub returned HTTP ${res.status}.`);
  return res;
}

export async function loadGithub(
  source: Extract<Source, { kind: 'github' }>,
  token = process.env.GITHUB_TOKEN,
): Promise<LoadedSource> {
  const { owner, repo, ref } = source;
  const repoRes = await github(`/repos/${owner}/${repo}`, token, 'application/vnd.github+json');
  const info = (await repoRes.json()) as {
    name: string;
    description: string | null;
    html_url: string;
    stargazers_count: number;
    license: { spdx_id?: string; name?: string } | null;
    topics?: string[];
    homepage: string | null;
    default_branch: string;
  };

  const query = ref ? `?ref=${encodeURIComponent(ref)}` : '';
  const readmeRes = await github(`/repos/${owner}/${repo}/readme${query}`, token, 'application/vnd.github.raw+json');
  const readme = await readmeRes.text();

  const license = info.license?.spdx_id && info.license.spdx_id !== 'NOASSERTION' ? info.license.spdx_id : info.license?.name;
  const meta: RepoMeta = {
    owner,
    name: info.name,
    description: info.description ?? undefined,
    url: info.html_url,
    stars: info.stargazers_count,
    license: license ?? undefined,
    topics: info.topics ?? [],
    homepage: info.homepage || undefined,
    branch: ref ?? info.default_branch,
  };
  return { kind: 'github', readme, meta };
}

/** "git+https://github.com/o/r.git" or "git@github.com:o/r.git" -> https://github.com/o/r */
export function normalizeRepoUrl(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  const m = /github\.com[/:]([^/\s]+)\/([^/\s#]+?)(?:\.git)?(?:[#/].*)?$/i.exec(raw);
  return m ? `https://github.com/${m[1]}/${m[2]}` : undefined;
}

export function loadLocal(source: Extract<Source, { kind: 'local' }>): LoadedSource {
  const { dir } = source;
  const file = readdirSync(dir).find((f) => /^readme(\.(md|markdown|txt))?$/i.test(f));
  if (!file) throw new UserError(`No README found in ${dir}.`);
  const readme = readFileSync(join(dir, file), 'utf8');

  const meta: RepoMeta = { name: basename(dir), topics: [] };
  const pkgPath = join(dir, 'package.json');
  if (existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf8')) as Record<string, unknown>;
      if (typeof pkg.name === 'string') meta.name = pkg.name.replace(/^@[^/]+\//, '');
      if (typeof pkg.description === 'string') meta.description = pkg.description;
      if (typeof pkg.license === 'string') meta.license = pkg.license;
      if (typeof pkg.homepage === 'string') meta.homepage = pkg.homepage;
      if (Array.isArray(pkg.keywords)) meta.topics = pkg.keywords.filter((k): k is string => typeof k === 'string');
      const repository = pkg.repository;
      meta.url = normalizeRepoUrl(typeof repository === 'string' ? repository : (repository as { url?: string } | undefined)?.url);
    } catch {
      // A broken package.json should not stop us from using the README.
    }
  }
  return { kind: 'local', readme, meta, dir };
}
