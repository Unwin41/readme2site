#!/usr/bin/env node
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { Command } from 'commander';
import { DEFAULT_MODEL, improveWithAi } from './ai';
import { loadGithub, loadLocal } from './load';
import { parseReadme } from './parse';
import { renderSite } from './render';
import { resolveSource } from './source';
import { themeIds } from './themes';
import { UserError, type UrlContext } from './types';

interface Options {
  out: string;
  theme: string;
  ai?: boolean;
  model?: string;
  open?: boolean;
  cache: boolean;
}

async function run(input: string, opts: Options): Promise<void> {
  if (!themeIds.includes(opts.theme)) {
    throw new UserError(`Unknown theme "${opts.theme}". Available: ${themeIds.join(', ')}.`);
  }

  const source = resolveSource(input);
  console.log(source.kind === 'github' ? `Fetching ${source.owner}/${source.repo}...` : `Reading ${source.dir}...`);
  const loaded = source.kind === 'github' ? await loadGithub(source) : loadLocal(source);

  const outDir = resolve(opts.out);
  const ctx: UrlContext =
    loaded.kind === 'github'
      ? { kind: 'github', owner: loaded.meta.owner, repo: loaded.meta.name, branch: loaded.meta.branch }
      : { kind: 'local', baseDir: loaded.dir, outDir };

  let data = parseReadme(loaded.readme, loaded.meta, ctx);

  if (opts.ai) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.warn('! --ai needs the ANTHROPIC_API_KEY environment variable. Continuing without AI.');
    } else {
      try {
        console.log(`Improving copy with ${opts.model ?? DEFAULT_MODEL}...`);
        data = await improveWithAi(data, loaded.readme, {
          apiKey,
          model: opts.model,
          useCache: opts.cache,
          log: (m) => console.log(m),
        });
      } catch (err) {
        console.warn(`! AI step failed (${(err as Error).message}). Continuing without AI.`);
      }
    }
  }

  const html = renderSite(data, opts.theme);
  mkdirSync(outDir, { recursive: true });
  const file = join(outDir, 'index.html');
  writeFileSync(file, html, 'utf8');
  console.log(`\nDone: ${file}`);

  if (opts.open) {
    const { default: open } = await import('open');
    await open(file);
  }
}

const program = new Command();
program
  .name('readme2site')
  .description('Turn a GitHub README into a beautiful single-file landing page.')
  .version('0.1.0')
  .argument('<source>', 'owner/repo, a GitHub URL, or a local folder (use . for the current one)')
  .option('-o, --out <dir>', 'output directory', 'site')
  .option('-t, --theme <name>', `theme: ${themeIds.join(' | ')}`, 'minimal')
  .option('--ai', 'improve tagline and feature cards with Claude (needs ANTHROPIC_API_KEY)')
  .option('--model <id>', 'model used with --ai')
  .option('--open', 'open the result in your browser')
  .option('--no-cache', 'ignore the cached AI result')
  .action(async (source: string, opts: Options) => {
    try {
      await run(source, opts);
    } catch (err) {
      console.error(err instanceof UserError ? `Error: ${err.message}` : err);
      process.exitCode = 1;
    }
  });

await program.parseAsync();
