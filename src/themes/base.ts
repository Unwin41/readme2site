/** Structural CSS shared by every theme. Themes only supply colors, fonts and hero flavor. */
export const baseCss = `
*{box-sizing:border-box}
html{scroll-behavior:smooth}
body{margin:0;background:var(--bg);color:var(--fg);font:16px/1.65 var(--font);-webkit-font-smoothing:antialiased}
a{color:var(--accent)}
img{max-width:100%;height:auto}
.wrap{max-width:1040px;margin:0 auto;padding:0 20px}
nav{border-bottom:1px solid var(--border)}
nav .wrap{display:flex;align-items:center;justify-content:space-between;height:60px;gap:16px}
.brand{font-weight:700;color:var(--fg);text-decoration:none;letter-spacing:-.01em;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.navlinks{display:flex;gap:18px;align-items:center;font-size:.95rem}
.navlinks a{color:var(--muted);text-decoration:none}
.navlinks a:hover{color:var(--fg)}
.hero{padding:88px 0 64px;text-align:center}
.hero h1{font-size:clamp(2.4rem,7vw,4.4rem);line-height:1.05;margin:0 0 18px;letter-spacing:-.035em;overflow-wrap:anywhere}
.tagline{font-size:clamp(1.05rem,2.4vw,1.3rem);color:var(--muted);max-width:660px;margin:0 auto 32px}
.actions{display:flex;flex-wrap:wrap;gap:12px;justify-content:center}
.btn{display:inline-flex;align-items:center;gap:8px;padding:11px 20px;border-radius:var(--radius);font-weight:600;text-decoration:none;border:1px solid var(--border);color:var(--fg);background:var(--card)}
.btn:hover{border-color:var(--accent)}
.btn.primary{background:var(--accent);border-color:var(--accent);color:var(--on-accent)}
.btn.primary:hover{filter:brightness(1.08)}
.topics{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-top:28px}
.topic{font-size:.82rem;padding:3px 11px;border-radius:999px;background:var(--card);border:1px solid var(--border);color:var(--muted)}
.install{display:flex;align-items:center;gap:12px;max-width:620px;margin:36px auto 0;padding:12px 14px 12px 18px;background:var(--code-bg);border:1px solid var(--border);border-radius:var(--radius);text-align:left}
.install code{flex:1;overflow-x:auto;white-space:nowrap;font:.95rem/1.4 var(--mono);color:var(--fg)}
.install button{cursor:pointer;font:600 .82rem var(--font);padding:6px 12px;border-radius:calc(var(--radius) - 2px);border:1px solid var(--border);background:var(--card);color:var(--fg)}
.install button:hover{border-color:var(--accent)}
.shot{display:block;margin:56px auto 0;max-width:100%;border-radius:calc(var(--radius) + 4px);border:1px solid var(--border);box-shadow:var(--shadow)}
main{padding-bottom:40px}
h2.heading{font-size:1.7rem;letter-spacing:-.02em;margin:0 0 20px}
.block{padding:48px 0;border-top:1px solid var(--border)}
.features{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:16px}
.card{padding:22px;border:1px solid var(--border);border-radius:var(--radius);background:var(--card)}
.card h3{margin:0 0 6px;font-size:1.05rem}
.card p{margin:0;color:var(--muted);font-size:.96rem}
.card .icon{font-size:1.4rem;margin-bottom:10px}
.prose{overflow-wrap:anywhere}
.prose h1,.prose h3,.prose h4,.prose h5,.prose h6{margin:1.6em 0 .5em;line-height:1.25}
.prose pre{background:var(--code-bg);border:1px solid var(--border);border-radius:var(--radius);padding:14px 16px;overflow-x:auto}
.prose code{font-family:var(--mono);font-size:.9em}
.prose :not(pre)>code{background:var(--code-bg);border:1px solid var(--border);border-radius:6px;padding:1px 6px}
.prose table{border-collapse:collapse;display:block;overflow-x:auto}
.prose th,.prose td{border:1px solid var(--border);padding:8px 12px;text-align:left}
.prose blockquote{margin:1em 0;padding:2px 18px;border-left:3px solid var(--accent);color:var(--muted)}
.prose img{border-radius:8px}
.prose details{border:1px solid var(--border);border-radius:var(--radius);padding:10px 14px;margin:1em 0}
footer{border-top:1px solid var(--border);padding:32px 0;color:var(--muted);font-size:.9rem}
footer .wrap{display:flex;flex-wrap:wrap;gap:12px;justify-content:space-between}
footer a{color:var(--muted)}
@media (max-width:600px){.hero{padding:56px 0 40px}.navlinks .hide-sm{display:none}}
`;
