import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { z } from 'zod';
import type { Feature, SiteData } from './types';

export const DEFAULT_MODEL = 'claude-haiku-5-5';

const CopySchema = z.object({
  tagline: z.string().min(8).max(160).optional(),
  accent: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  features: z
    .array(
      z.object({
        icon: z.string().max(8).optional(),
        title: z.string().min(1).max(48),
        body: z.string().min(1).max(200),
      }),
    )
    .min(3)
    .max(6)
    .optional(),
});
export type SiteCopy = z.infer<typeof CopySchema>;

const TOOL = {
  name: 'site_copy',
  description: 'Return improved landing page copy for the project.',
  input_schema: {
    type: 'object' as const,
    properties: {
      tagline: { type: 'string', description: 'One punchy sentence (max 160 chars) saying what the project does and why it matters.' },
      accent: { type: 'string', description: 'A hex color like #7c3aed that fits the project personality.' },
      features: {
        type: 'array',
        description: '3 to 6 features, each concrete and benefit-oriented.',
        items: {
          type: 'object',
          properties: {
            icon: { type: 'string', description: 'A single emoji.' },
            title: { type: 'string', description: 'Max 4 words.' },
            body: { type: 'string', description: 'One sentence.' },
          },
          required: ['title', 'body'],
        },
      },
    },
  },
};

function cachePath(key: string): string {
  return join(homedir(), '.cache', 'readme2site', `${key}.json`);
}

function cacheKey(readme: string, model: string): string {
  return createHash('sha256').update(model).update('\0').update(readme).digest('hex').slice(0, 32);
}

export interface AiOptions {
  apiKey: string;
  model?: string;
  useCache?: boolean;
  log?: (msg: string) => void;
}

/** Ask Claude for better copy. Throws on API errors; the caller decides whether to fall back. */
export async function improveWithAi(data: SiteData, readme: string, opts: AiOptions): Promise<SiteData> {
  const model = opts.model ?? DEFAULT_MODEL;
  const key = cacheKey(readme, model);
  const file = cachePath(key);

  let copy: SiteCopy | undefined;
  if (opts.useCache !== false && existsSync(file)) {
    try {
      copy = CopySchema.parse(JSON.parse(readFileSync(file, 'utf8')));
      opts.log?.('Using cached AI copy.');
    } catch {
      copy = undefined; // corrupt cache: just ask again
    }
  }

  if (!copy) {
    let Anthropic: typeof import('@anthropic-ai/sdk').default;
    try {
      Anthropic = (await import('@anthropic-ai/sdk')).default;
    } catch {
      throw new Error('The --ai option needs the optional dependency "@anthropic-ai/sdk" (npm i @anthropic-ai/sdk).');
    }
    const client = new Anthropic({ apiKey: opts.apiKey });
    const excerpt = readme.length > 12_000 ? `${readme.slice(0, 12_000)}\n\n[truncated]` : readme;
    const res = await client.messages.create({
      model,
      max_tokens: 1024,
      tools: [TOOL],
      tool_choice: { type: 'tool', name: TOOL.name },
      messages: [
        {
          role: 'user',
          content:
            `Write landing page copy for the project "${data.repo.name}". Be concrete and honest; ` +
            `only mention capabilities that appear in the README. No hype words like "revolutionary".\n\n` +
            `<readme>\n${excerpt}\n</readme>`,
        },
      ],
    });
    const block = res.content.find((b) => b.type === 'tool_use');
    if (!block || block.type !== 'tool_use') throw new Error('The model did not return structured copy.');

    // Validate each field on its own so one bad field doesn't discard the rest.
    const input = (block.input ?? {}) as Record<string, unknown>;
    copy = {};
    for (const field of ['tagline', 'accent', 'features'] as const) {
      const part = CopySchema.shape[field].safeParse(input[field]);
      if (part.success && part.data !== undefined) (copy as Record<string, unknown>)[field] = part.data;
    }
    try {
      mkdirSync(join(homedir(), '.cache', 'readme2site'), { recursive: true });
      writeFileSync(file, JSON.stringify(copy));
    } catch {
      // Caching is best effort.
    }
  }

  const features: Feature[] | undefined = copy.features?.map((f) => ({ icon: f.icon, title: f.title, body: f.body }));
  return {
    ...data,
    tagline: copy.tagline ?? data.tagline,
    accent: copy.accent ?? data.accent,
    features: features && features.length >= 3 ? features : data.features,
  };
}
