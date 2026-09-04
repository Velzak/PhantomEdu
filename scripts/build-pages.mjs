import { mkdir, readFile, writeFile, cp } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const out = path.join(root, "docs");
const fixtures = path.join(root, "prisma", "fixtures");

const GAMES = [
  {
    slug: "ribbon",
    title: "Ribbon",
    description:
      "Steer a growing ribbon across a tight court. Eat every glint you can reach, and end the run the moment you hit a wall or fold into yourself.",
    category: "Arcade",
    categorySlug: "arcade",
    tags: ["classic", "keyboard", "short-session"],
    controls: "Arrow keys or WASD",
    developer: "Phantom",
    featured: true,
    fixture: "ribbon.html",
    hook: "Steer a growing ribbon across a tight court",
  },
  {
    slug: "baseline",
    title: "Baseline",
    description:
      "Hold the left paddle and rally against a patient machine. First to seven points takes the match.",
    category: "Sports",
    categorySlug: "sports",
    tags: ["classic", "keyboard", "single-file"],
    controls: "W/S or arrows; pointer also moves the paddle",
    developer: "Phantom",
    featured: false,
    fixture: "baseline.html",
    hook: "Hold the left paddle and rally against a patient machine",
  },
  {
    slug: "kiln",
    title: "Kiln",
    description:
      "Bounce an ember through a wall of kiln bricks. Clear the grid to win, and keep the ember off the floor.",
    category: "Arcade",
    categorySlug: "arcade",
    tags: ["classic", "keyboard", "short-session"],
    controls: "Arrows or A/D; pointer also moves the paddle",
    developer: "Phantom",
    featured: false,
    fixture: "kiln.html",
    hook: "Bounce an ember through a wall of kiln bricks",
  },
  {
    slug: "ledge",
    title: "Ledge",
    description:
      "A short platform hop to a teal beacon. Cross the gaps, jump the crates, and stay on the stone.",
    category: "Platformer",
    categorySlug: "platformer",
    tags: ["keyboard", "short-session"],
    controls: "Arrows or WASD to move, Space or Up to jump",
    developer: "Phantom",
    featured: false,
    fixture: "ledge.html",
    hook: "A short platform hop to a teal beacon",
  },
  {
    slug: "flashpoint",
    title: "Flashpoint",
    description:
      "Wait for the pad to turn teal, then click. The trial records your reaction time and keeps a session best.",
    category: "Casual",
    categorySlug: "casual",
    tags: ["reflex", "short-session"],
    controls: "Click or tap the pad; Space also works",
    developer: "Phantom",
    featured: false,
    fixture: "flashpoint.html",
    hook: "Wait for the pad to turn teal, then click",
  },
];

const CATEGORIES = [...new Set(GAMES.map((g) => g.category))].sort();

function rel(fromDir, toPath) {
  const from = path.posix.join("/", fromDir.replaceAll("\\", "/"));
  const to = path.posix.join("/", toPath.replaceAll("\\", "/"));
  let relative = path.posix.relative(from, to);
  if (!relative.startsWith(".")) relative = "./" + relative;
  return relative;
}

function asset(fromDir, file) {
  return rel(fromDir, `assets/${file}`);
}

function layout({ title, fromDir, body, active }) {
  const css = asset(fromDir, "site.css");
  const js = asset(fromDir, "site.js");
  const home = rel(fromDir, "index.html");
  const search = rel(fromDir, "search.html");
  const icon = rel(fromDir, "favicon.svg");
  return `<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="Phantom — original browser games, ready in one click." />
  <link rel="icon" href="${icon}" />
  <link rel="stylesheet" href="${css}" />
</head>
<body>
  <header class="top">
    <div class="wrap bar">
      <a class="logo" href="${home}">Phantom</a>
      <nav class="cats" aria-label="Categories">
        ${CATEGORIES.map((name) => {
          const slug = name.toLowerCase();
          const href = rel(fromDir, `categories/${slug}.html`);
          return `<a href="${href}">${escapeHtml(name)}</a>`;
        }).join("")}
      </nav>
      <form class="search" action="${search}" method="get" role="search">
        <label class="sr" for="q">Search games</label>
        <input id="q" name="q" placeholder="Search titles, tags" autocomplete="off" />
      </form>
      <button type="button" class="icon-btn" data-theme-toggle aria-label="Switch theme">☾</button>
    </div>
  </header>
  <main class="wrap">${body}</main>
  <footer class="foot">
    <div class="wrap foot-row">
      <p class="logo">Phantom</p>
      <p class="muted">Original browser games, ready in one click.</p>
      <a href="${search}">Browse the catalog</a>
    </div>
  </footer>
  <script src="${js}"></script>
</body>
</html>`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function card(game, fromDir) {
  const href = rel(fromDir, `games/${game.slug}.html`);
  const initial = escapeHtml(game.title.slice(0, 1));
  return `<article class="card">
    <a href="${href}">
      <div class="thumb" aria-hidden="true"><span>${initial}</span></div>
      <h3>${escapeHtml(game.title)}</h3>
      <p class="muted">${escapeHtml(game.category)}</p>
    </a>
  </article>`;
}

function rail(title, games, fromDir) {
  return `<section class="section">
    <h2>${escapeHtml(title)}</h2>
    <div class="rail">${games.map((g) => card(g, fromDir)).join("")}</div>
  </section>`;
}

async function write(file, contents) {
  const full = path.join(out, file);
  await mkdir(path.dirname(full), { recursive: true });
  await writeFile(full, contents, "utf8");
}

const css = `:root,[data-theme=dark]{
  --bg-void:#0A0D14;--bg-surface:#131722;--bg-surface-2:#1B2030;
  --accent:#6C5CE7;--signal:#2DD4BF;--ink:#E7E9EE;--muted:#8B93A7;--danger:#F26D6D;
  color-scheme:dark;
}
[data-theme=light]{
  --bg-void:#F3F4F8;--bg-surface:#fff;--bg-surface-2:#EBEEF5;
  --accent:#5B4CD6;--signal:#0F766E;--ink:#141824;--muted:#5C6578;--danger:#D14545;
  color-scheme:light;
}
*{box-sizing:border-box}
html,body{margin:0;min-height:100%;background:var(--bg-void);color:var(--ink);
  font-family:"Segoe UI",system-ui,sans-serif}
h1,h2,h3,.logo{font-family:system-ui,sans-serif;letter-spacing:-.02em}
a{color:var(--signal);text-decoration:none}
a:hover{text-decoration:underline}
.wrap{max-width:1120px;margin:0 auto;padding:0 16px}
.top{position:sticky;top:0;z-index:20;border-bottom:1px solid rgba(255,255,255,.1);
  background:color-mix(in srgb,var(--bg-void) 90%,transparent);backdrop-filter:blur(10px)}
.bar{display:flex;align-items:center;gap:12px;padding:12px 16px}
.logo{color:var(--ink);font-weight:650;font-size:1.1rem}
.cats{display:none;gap:8px}
@media(min-width:900px){.cats{display:flex}}
.cats a{color:var(--ink);padding:8px 10px;border-radius:8px}
.cats a:hover{background:var(--bg-surface-2);text-decoration:none}
.search{flex:1;min-width:0}
.search input{width:100%;border:1px solid rgba(255,255,255,.1);background:var(--bg-surface);
  color:var(--ink);border-radius:8px;padding:8px 12px}
.icon-btn{width:40px;height:40px;border:0;border-radius:8px;background:transparent;color:var(--ink);cursor:pointer}
.icon-btn:hover{background:var(--bg-surface-2)}
.hero{display:grid;gap:0;margin-top:24px;background:var(--bg-surface);border-radius:16px;overflow:hidden}
@media(min-width:900px){.hero{grid-template-columns:1.4fr 1fr}}
.hero-art{min-height:220px;background:radial-gradient(circle at 30% 20%,#2a3350,transparent 55%),linear-gradient(160deg,#1b2030,#131722);
  display:flex;align-items:center;justify-content:center;font-size:72px}
.hero-copy{padding:32px}
.btn{display:inline-flex;align-items:center;justify-content:center;height:48px;padding:0 20px;
  border-radius:8px;background:var(--accent);color:#fff;font-weight:600}
.btn:hover{text-decoration:none;filter:brightness(1.08)}
.section{margin-top:40px}
.rail,.grid{display:flex;gap:16px;overflow-x:auto;scroll-snap-type:x mandatory;padding-bottom:8px}
.grid{display:grid;overflow:visible;grid-template-columns:repeat(2,1fr)}
@media(min-width:640px){.grid{grid-template-columns:repeat(3,1fr)}}
@media(min-width:900px){.grid{grid-template-columns:repeat(5,1fr)}}
.card{flex:0 0 160px;scroll-snap-align:start}
.grid .card{flex:none}
.thumb{aspect-ratio:4/3;border-radius:12px;background:radial-gradient(circle at 30% 20%,#2a3350,transparent 55%),linear-gradient(160deg,#1b2030,#131722);
  display:flex;align-items:center;justify-content:center;font-size:28px}
.card h3{margin:8px 0 0;font-size:1rem}
.card a{color:var(--ink)}
.card a:hover{text-decoration:none}
.muted{color:var(--muted)}
.chips{display:flex;flex-wrap:wrap;gap:8px}
.chip{background:var(--bg-surface);color:var(--ink);padding:8px 16px;border-radius:999px}
.player{position:relative;background:#000;border-radius:16px;overflow:hidden}
.player iframe{width:100%;aspect-ratio:16/9;border:0;display:block}
.fs{position:absolute;top:12px;right:12px;width:36px;height:36px;border:0;border-radius:8px;
  background:rgba(0,0,0,.55);color:#fff;cursor:pointer}
.meta{display:grid;gap:12px;margin-top:24px}
@media(min-width:640px){.meta{grid-template-columns:1fr 1fr}}
.foot{margin-top:64px;border-top:1px solid rgba(255,255,255,.1);padding:40px 0}
.foot-row{display:flex;flex-direction:column;gap:12px}
@media(min-width:700px){.foot-row{flex-direction:row;align-items:center;justify-content:space-between}}
.sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0)}
.empty{background:var(--bg-surface);border-radius:16px;padding:48px 24px;text-align:center}
.heart{width:40px;height:40px;border:0;border-radius:8px;background:var(--bg-surface-2);color:var(--ink);cursor:pointer}
.heart.on{color:var(--danger)}
.row{display:flex;gap:8px;align-items:center;justify-content:space-between;flex-wrap:wrap}
*:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
@media (prefers-reduced-motion:reduce){*{transition:none!important;animation:none!important}}
`;

const js = `const KEY="gp_prefs";
function load(){
  try{const raw=JSON.parse(localStorage.getItem(KEY));if(raw&&raw.version===1)return raw;}catch{}
  return {version:1,favorites:[],recentlyPlayed:[],theme:"dark",ratedSlugs:[]};
}
function save(p){localStorage.setItem(KEY,JSON.stringify(p));}
function applyTheme(theme){
  const resolved=theme==="system"
    ? (matchMedia("(prefers-color-scheme: light)").matches?"light":"dark")
    : theme;
  document.documentElement.dataset.theme=resolved;
}
const prefs=load();
applyTheme(prefs.theme||"dark");
document.querySelector("[data-theme-toggle]")?.addEventListener("click",()=>{
  const order=["dark","light","system"];
  const next=order[(order.indexOf(load().theme)+1)%order.length];
  const p=load(); p.theme=next; save(p); applyTheme(next);
});
document.querySelectorAll("[data-fav]").forEach((btn)=>{
  const slug=btn.getAttribute("data-fav");
  const sync=()=>btn.classList.toggle("on", load().favorites.includes(slug));
  sync();
  btn.addEventListener("click",()=>{
    const p=load();
    p.favorites=p.favorites.includes(slug)?p.favorites.filter(s=>s!==slug):[...p.favorites,slug];
    save(p); sync();
  });
});
const played=document.querySelector("[data-played]");
if(played){
  const slug=played.getAttribute("data-played");
  const p=load();
  p.recentlyPlayed=[{slug,playedAt:new Date().toISOString()},...p.recentlyPlayed.filter(x=>x.slug!==slug)].slice(0,20);
  save(p);
}
document.querySelector("[data-fs]")?.addEventListener("click",()=>{
  const wrap=document.querySelector(".player");
  if(!wrap) return;
  if(document.fullscreenElement) document.exitFullscreen();
  else wrap.requestFullscreen();
});
const params=new URLSearchParams(location.search);
const q=params.get("q")||"";
const qBox=document.querySelector("#q");
if(qBox && location.pathname.endsWith("search.html")) qBox.value=q;
const grid=document.querySelector("[data-catalog]");
if(grid){
  const cards=[...grid.querySelectorAll("[data-game]")];
  const apply=()=>{
    const query=(document.querySelector("[data-filter]")?.value||q).toLowerCase().trim();
    let shown=0;
    cards.forEach((el)=>{
      const hay=el.getAttribute("data-game").toLowerCase();
      const ok=!query || hay.includes(query);
      el.hidden=!ok; if(ok) shown++;
    });
    const empty=document.querySelector("[data-empty]");
    if(empty) empty.hidden=shown>0;
  };
  document.querySelector("[data-filter]")?.addEventListener("input",apply);
  apply();
}
`;

async function main() {
  await mkdir(path.join(out, "assets"), { recursive: true });
  await mkdir(path.join(out, "play"), { recursive: true });
  await write("assets/site.css", css);
  await write("assets/site.js", js);
  await write(".nojekyll", "");
  await cp(path.join(root, "public", "favicon.svg"), path.join(out, "favicon.svg"));

  for (const game of GAMES) {
    const html = await readFile(path.join(fixtures, game.fixture), "utf8");
    await write(`play/${game.slug}/index.html`, html);
  }

  const featured = GAMES.find((g) => g.featured) || GAMES[0];
  const fromHome = ".";
  const homeBody = `
    <section class="hero">
      <div class="hero-art" aria-hidden="true">${escapeHtml(featured.title.slice(0, 1))}</div>
      <div class="hero-copy">
        <p class="muted">${escapeHtml(featured.category)}</p>
        <h1>${escapeHtml(featured.title)}</h1>
        <p class="muted">${escapeHtml(featured.hook)}.</p>
        <p style="margin-top:24px"><a class="btn" href="${rel(fromHome, `games/${featured.slug}.html`)}">Play now</a></p>
      </div>
    </section>
    ${rail("Trending now", GAMES, fromHome)}
    <section class="section">
      <h2>Browse by category</h2>
      <div class="chips">
        ${CATEGORIES.map((name) => `<a class="chip" href="${rel(fromHome, `categories/${name.toLowerCase()}.html`)}">${escapeHtml(name)}</a>`).join("")}
      </div>
    </section>
    ${rail("Recently added", GAMES, fromHome)}
  `;
  await write("index.html", layout({ title: "Phantom — Play something now", fromDir: fromHome, body: homeBody }));

  const searchBody = `
    <h1>Search</h1>
    <p class="muted">Filter the catalog on this page.</p>
    <p><input data-filter placeholder="Filter by title, category, or tag" style="width:min(100%,28rem);margin:16px 0;padding:10px 12px;border-radius:8px;border:1px solid rgba(255,255,255,.1);background:var(--bg-surface);color:var(--ink)" /></p>
    <div class="grid" data-catalog>
      ${GAMES.map(
        (g) =>
          `<div data-game="${escapeHtml([g.title, g.category, g.developer, ...g.tags].join(" "))}">${card(g, ".")}</div>`
      ).join("")}
    </div>
    <div class="empty" data-empty hidden>
      <h2>No games match this search</h2>
      <p class="muted">Nothing in the catalog fits those words. Clear the filter and browse the full list.</p>
    </div>
  `;
  await write("search.html", layout({ title: "Search · Phantom", fromDir: ".", body: searchBody }));

  for (const name of CATEGORIES) {
    const slug = name.toLowerCase();
    const list = GAMES.filter((g) => g.category === name);
    const body = `
      <h1>${escapeHtml(name)}</h1>
      <p class="muted">${list.length} playable ${list.length === 1 ? "game" : "games"}</p>
      <div class="grid" style="margin-top:24px">${list.map((g) => card(g, "categories")).join("")}</div>
    `;
    await write(
      `categories/${slug}.html`,
      layout({ title: `${name} · Phantom`, fromDir: "categories", body })
    );
  }

  for (const game of GAMES) {
    const related = GAMES.filter((g) => g.slug !== game.slug && (g.category === game.category || g.tags.some((t) => game.tags.includes(t))));
    const playSrc = rel("games", `play/${game.slug}/index.html`);
    const body = `
      <div class="player" data-played="${game.slug}">
        <iframe title="${escapeHtml(game.title)}" src="${playSrc}" sandbox="allow-scripts allow-forms allow-pointer-lock" loading="lazy"></iframe>
        <button type="button" class="fs" data-fs aria-label="Enter fullscreen">⛶</button>
      </div>
      <div class="row" style="margin-top:24px">
        <div>
          <p class="muted">${escapeHtml(game.category)}</p>
          <h1>${escapeHtml(game.title)}</h1>
        </div>
        <button type="button" class="heart" data-fav="${game.slug}" aria-label="Add ${escapeHtml(game.title)} to favorites">♥</button>
      </div>
      <p class="muted" style="max-width:42rem">${escapeHtml(game.description)}</p>
      <dl class="meta">
        <div><dt class="muted">Controls</dt><dd>${escapeHtml(game.controls)}</dd></div>
        <div><dt class="muted">Developer</dt><dd>${escapeHtml(game.developer)}</dd></div>
      </dl>
      ${related.length ? rail("More like this", related, "games") : ""}
    `;
    await write(
      `games/${game.slug}.html`,
      layout({ title: `${game.title} · Phantom`, fromDir: "games", body })
    );
  }

  console.log("Wrote static GitHub Pages site to docs/");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
