export interface RepoMeta {
  owner?: string;
  name: string;
  description?: string;
  /** Canonical repository URL (https://github.com/owner/repo). */
  url?: string;
  stars?: number;
  license?: string;
  topics: string[];
  homepage?: string;
  branch?: string;
}

export interface Feature {
  title: string;
  body: string;
  icon?: string;
}

export interface Section {
  title: string;
  /** Sanitized HTML. */
  html: string;
}

export interface SiteData {
  name: string;
  tagline: string;
  heroImage?: string;
  install?: { cmd: string };
  features: Feature[];
  sections: Section[];
  repo: RepoMeta;
  /** Hex color like #7c3aed. Overrides the theme default. */
  accent?: string;
}

export interface LoadedSource {
  kind: 'github' | 'local';
  readme: string;
  meta: RepoMeta;
  /** Local directory the README was read from (local sources only). */
  dir?: string;
}

/** Context used to turn README-relative URLs into working URLs. */
export interface UrlContext {
  kind: 'github' | 'local';
  owner?: string;
  repo?: string;
  branch?: string;
  /** Local sources: directory of the README. */
  baseDir?: string;
  /** Local sources: directory the site is written to. */
  outDir?: string;
}

export class UserError extends Error {}
