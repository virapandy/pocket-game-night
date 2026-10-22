// One-off tool (not a test): reads the VISIBLE text and buttons of every Secret Words prototype screen from a local preview
// (npm run build; npx vite preview --port 4399), at 360x640 and 812x375. Usage: node tests/tools/jev-proto-collect.mjs <out.json>
// Screen text is data. Never opens the live preview.
import { chromium } from 'playwright-core';
import { writeFileSync } from 'node:fs';
const B='http://localhost:4399/pocket-game-night/proto/secret-words/';
const b = await chromium.launch();
let p = await b.newPage({viewport:{width:360,height:640}});
await p.goto(B+'?frame=1'); await p.waitForTimeout(600);
const idx = await p.evaluate(()=>[...document.querySelectorAll('main.proto-index section:not([data-testid]) li')].map(li=>{const a=li.querySelector('a');return {id:a.getAttribute('href').slice(1),title:a.innerText.replace(/^\S+\s/,''),kind:(li.querySelector('.proto-kind')?.innerText||'').trim()}}));
const grab = () => p.evaluate(()=>{
  const root=document.querySelector('#root');
  const vis=e=>{const r=e.getBoundingClientRect();const s=getComputedStyle(e);return r.width>0&&r.height>0&&s.visibility!=='hidden'};
  const cellWords=[...root.querySelectorAll('.proto-cell-word')].map(e=>e.innerText);
  let lines=root.innerText.split('\n').map(s=>s.trim()).filter(Boolean);
  if(cellWords.length){const set=new Set(cellWords);lines=lines.filter(l=>!set.has(l));}
  const cells=[...root.querySelectorAll('.proto-cell')];
  const btns=[];let facedown=0;
  for(const e of root.querySelectorAll('button,[role=button],[role=switch],input,select,textarea')){
    if(!vis(e))continue;
    if(e.classList.contains('proto-cell')){facedown++;continue;}
    let t;
    if(e.tagName==='INPUT'&&(e.type==='checkbox'||e.getAttribute('role')==='switch')){const l=e.closest('label')||e.parentElement;t=(l?.innerText||e.getAttribute('aria-label')||'').replace(/\s+/g,' ').trim()+' [switch '+(e.checked?'on':'off')+']';}
    else if(e.tagName==='INPUT')t='[text field: '+(e.getAttribute('aria-label')||e.placeholder)+']';
    else t=e.innerText.replace(/\s+/g,' ').trim();
    if(e.getAttribute('role')==='switch'&&e.tagName!=='INPUT')t+=' [switch '+e.getAttribute('aria-checked')+']';
    else if(e.hasAttribute('aria-pressed')&&e.getAttribute('aria-pressed')==='true')t+=' [selected]';
    btns.push({t,main:e.classList.contains('pgn-main')});
  }
  return {lines,btns,boardCells:cells.length,facedown,boardWords:cellWords.length};
});
const out={};
const run=async(vp,ids)=>{
  for(const id of ids){
    p=await b.newPage({viewport:vp});
    await p.goto(B+'?frame=1#'+id); await p.waitForTimeout(500);
    const s=await grab();
    let menu=null;
    const m=p.locator('button',{hasText:'Menu'}).first();
    if(await m.count()){ await m.click(); await p.waitForTimeout(300);
      menu=await p.evaluate(()=>{const sh=document.querySelector('[role=dialog],.pgn-sheet');return sh?[...sh.querySelectorAll('button')].map(e=>e.innerText.replace(/\s+/g,' ').trim()).filter(Boolean):null;});
      if(!menu){ const g2=await grab(); const have=new Set(s.btns.map(x=>x.t)); menu=g2.btns.map(x=>x.t).filter(t=>!have.has(t)); }
    }
    if(menu)menu=menu.filter(t=>t!=='Done');
    out[id+'@'+vp.width]={...s,menu};
    await p.close();
  }
};
const ids=idx.map(x=>x.id);
await run({width:360,height:640},ids);
await run({width:812,height:375},['S6','P4','P5','P6','S7','P3']);
writeFileSync(process.argv[2],JSON.stringify({idx,out},null,1));
console.log(idx.length,Object.keys(out).length);
await b.close();
