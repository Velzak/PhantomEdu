const KEY="gp_prefs";
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
