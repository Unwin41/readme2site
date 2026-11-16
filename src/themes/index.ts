import { baseCss } from './base';

export interface Theme {
  id: string;
  /** Default accent, used when the README/AI doesn't provide one. */
  accent: string;
  css: string;
}

const system = `-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif`;
const mono = `ui-monospace,SFMono-Regular,"SF Mono",Menlo,Consolas,monospace`;

const minimal: Theme = {
  id: 'minimal',
  accent: '#2563eb',
  css: `
:root{--bg:#fff;--fg:#111827;--muted:#4b5563;--border:#e5e7eb;--card:#f9fafb;--code-bg:#f3f4f6;--on-accent:#fff;--radius:10px;--font:${system};--mono:${mono};--shadow:0 20px 50px -20px rgba(0,0,0,.25)}
@media (prefers-color-scheme:dark){:root{--bg:#0b0d12;--fg:#f3f4f6;--muted:#9ca3af;--border:#242a36;--card:#12151c;--code-bg:#151922;--shadow:0 20px 50px -20px rgba(0,0,0,.8)}}
${baseCss}`,
};

const gradient: Theme = {
  id: 'gradient',
  accent: '#7c3aed',
  css: `
:root{--bg:#fff;--fg:#0f172a;--muted:#475569;--border:#e2e8f0;--card:#fff;--code-bg:#f1f5f9;--on-accent:#fff;--radius:14px;--font:${system};--mono:${mono};--shadow:0 30px 60px -25px rgba(79,70,229,.45)}
@media (prefers-color-scheme:dark){:root{--bg:#070711;--fg:#f1f5f9;--muted:#a3aec2;--border:#23233a;--card:#101021;--code-bg:#0d0d1c;--shadow:0 30px 60px -25px rgba(124,58,237,.55)}}
${baseCss}
.hero{background:radial-gradient(900px 380px at 50% -10%,color-mix(in srgb,var(--accent) 28%,transparent),transparent 70%)}
.hero h1{background:linear-gradient(120deg,var(--fg) 30%,var(--accent));-webkit-background-clip:text;background-clip:text;color:transparent}
.btn.primary{box-shadow:0 10px 30px -10px var(--accent)}
.card{transition:transform .15s,border-color .15s}
.card:hover{transform:translateY(-3px);border-color:var(--accent)}`,
};

const terminal: Theme = {
  id: 'terminal',
  accent: '#22c55e',
  css: `
:root{--bg:#0a0a0a;--fg:#e5e7eb;--muted:#9ca3af;--border:#262626;--card:#101010;--code-bg:#050505;--on-accent:#04130a;--radius:4px;--font:${mono};--mono:${mono};--shadow:0 0 0 1px #262626,0 0 40px -12px var(--accent)}
@media (prefers-color-scheme:light){:root{--bg:#fafaf9;--fg:#1c1917;--muted:#57534e;--border:#d6d3d1;--card:#fff;--code-bg:#f5f5f4;--on-accent:#fff;--accent:#15803d;--shadow:0 0 0 1px #d6d3d1}}
${baseCss}
.hero h1::before{content:"$ ";color:var(--accent)}
.hero h1{letter-spacing:-.02em}
.tagline::after{content:"_";color:var(--accent);animation:blink 1s steps(1) infinite}
@keyframes blink{50%{opacity:0}}
h2.heading::before{content:"## ";color:var(--accent)}
.card h3::before{content:"> ";color:var(--accent)}
@media (prefers-reduced-motion:reduce){.tagline::after{animation:none}}`,
};

export const themes: Record<string, Theme> = { minimal, gradient, terminal };
export const themeIds = Object.keys(themes);
