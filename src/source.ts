import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { UserError } from './types';

export type Source =
  | { kind: 'github'; owner: string; repo: string; ref?: string }
  | { kind: 'local'; dir: string };

const SLUG = /^([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)$/;
const GH_URL = /^(?:https?:\/\/)?(?:www\.)?github\.com\/([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+?)(?:\.git)?(?:\/(?:tree|blob)\/([^/?#]+).*)?\/?(?:[?#].*)?$/i;

/**
 * Decide what the user meant: "owner/repo", a GitHub URL, or a local folder.
 * `exists` is injectable so tests don't touch the file system.
 */
export function resolveSource(input: string, exists: (p: string) => boolean = existsSync): Source {
  const value = input.trim();
  if (!value) throw new UserError('No source given. Use "owner/repo", a GitHub URL, or a folder path.');

  const url = GH_URL.exec(value);
  if (url) return { kind: 'github', owner: url[1]!, repo: url[2]!, ref: url[3] };

  // A real folder wins over something that merely looks like owner/repo.
  const abs = resolve(value);
  if (exists(abs)) return { kind: 'local', dir: abs };

  const slug = SLUG.exec(value);
  if (slug) return { kind: 'github', owner: slug[1]!, repo: slug[2]!.replace(/\.git$/, '') };

  throw new UserError(`Could not understand "${input}". Use "owner/repo", a GitHub URL, or an existing folder.`);
}
