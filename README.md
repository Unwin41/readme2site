# readme2site

**Turn any GitHub README into a beautiful landing page. One command, no config.**

```bash
npx readme2site vercel/next.js
```

You get a single `site/index.html`: responsive, light and dark mode, social-share tags, a copy-to-clipboard install box and feature cards. Host it anywhere, such as GitHub Pages, Netlify or an S3 bucket.

<!-- TODO: add a demo GIF here (before: plain README, after: the generated site). -->

## Why

Most good projects have a good README and no website. Making a site takes a weekend nobody has. readme2site reads what you already wrote and does the rest.

## Usage

```bash
npx readme2site owner/repo            # a GitHub repo
npx readme2site https://github.com/owner/repo
npx readme2site .                     # the README in this folder
npx readme2site . --theme terminal --open
```

| Option | What it does |
| --- | --- |
| `-o, --out <dir>` | Output folder (default `site`) |
| `-t, --theme <name>` | `minimal` (default), `gradient`, `terminal` |
| `--ai` | Improve the tagline and feature cards with Claude. Needs `ANTHROPIC_API_KEY` |
| `--model <id>` | Model used with `--ai` |
| `--no-cache` | Ignore the cached AI result |
| `--open` | Open the result in your browser |

Set `GITHUB_TOKEN` to avoid GitHub's anonymous rate limit.

## How it works

1. Fetches the README and repo info (stars, topics, license) from GitHub, or reads a local folder.
2. Pulls out the title, tagline, hero image, install command, features list and sections. Badge rows are skipped.
3. Sanitizes the README's HTML (no scripts, iframes or event handlers) and fixes relative links and images.
4. Renders one self-contained HTML file.

It works without AI and offline for local folders. With `--ai`, Claude rewrites only the tagline, feature cards and accent color. Results are cached in `~/.cache/readme2site`.

## Writing a README that looks great

- Start with `# Name`, then a one-sentence description.
- Put a screenshot or GIF before the first `##`. It becomes the hero image.
- Show the install command in a code block.
- Add a `## Features` section with `- **Title** — what it does` items.

## Development

```bash
npm install
npm test
npm run dev -- vercel/next.js --open
```

## License

MIT
