
const APPS=[['files','Files','📁',210],['web','Browser','🧭',200],['chat','Chat','💬',160],['mail','Mail','✉️',350],['notes','Notes','📝',45],['term','Terminal','⌨️',150],['calc','Calculator','🧮',20],['music','Music','🎵',330],['photos','Photos','🖼️',280],['cal','Calendar','📅',5],['maps','Maps','🗺️',130],['game','Games','🎮',260],['clock','Clock','⏱️',175],['paint','Paint','🎨',310],['vault','Vault','🔐',230],['wx','Weather','⛅',195],['set','Settings','⚙️',220],['store','App Store','🛍️',285]].map(([id,name,e,h])=>({id,name,e,h}));
const A=Object.fromEntries(APPS.map(a=>[a.id,a]));
const $=s=>document.querySelector(s),mk=(t,c,h)=>{const e=document.createElement(t);if(c)e.className=c;if(h!=null)e.innerHTML=h;return e};
const DEF={dock:['files','web','chat','mail','notes','term','calc','store','set'],size:56,mag:1.8,blur:24,theme:'auto',notes:'',mon:true};
let S=Object.assign({},DEF);
try{Object.assign(S,JSON.parse(localStorage.getItem('berth.v1')||'{}'))}catch(e){}
S.dock=(Array.isArray(S.dock)?S.dock:DEF.dock).filter(i=>A[i]);if(!S.dock.includes('store'))S.dock.push('store');if(!S.v){if(!S.dock.includes('chat'))S.dock.splice(Math.min(2,S.dock.length),0,'chat');S.v=2}
const save=()=>{try{localStorage.setItem('berth.v1',JSON.stringify(S))}catch(e){}};
const dock=$('#dock'),tip=$('#tip'),ctx=$('#ctx'),desk=$('#desk'),pad=$('#pad'),grid=$('#grid'),q=$('#q');
const wins={};let z=10,n=0,active=null,cur=56,hov=false,baseW=0,drag=null,ly=0,tmr=0;

function cfg(){
  const r=document.documentElement;
  r.style.setProperty('--blur',S.blur+'px');
  if(S.theme==='auto')r.removeAttribute('data-theme');else r.dataset.theme=S.theme;
  $('#mon').classList.toggle('off',!S.mon);
}
const itemEl=id=>dock.querySelector('.it[data-id="'+id+'"]');
function item(id,pin){
  const a=A[id],e=mk('div','it');
  e.dataset.id=id;e.tabIndex=0;e.setAttribute('role','button');
  e.setAttribute('aria-label',id==='lp'?'App launcher':a.name);
  if(id==='lp')e.innerHTML='<div class="ic lp">▦</div>';
  else{e.innerHTML='<div class="ic" style="--h:'+a.h+'">'+a.e+'</div><i class="dot"></i>';
    if(pin){e.draggable=true;e.dataset.pin='1'}
    if(wins[id]){e.classList.add('run');if(wins[id].min)e.classList.add('mini')}}
  e.dataset.b=id==='chat'&&unread?String(unread):'';e.onclick=()=>tap(id);
  e.onkeydown=ev=>{if(ev.key==='Enter'||ev.key===' '){ev.preventDefault();tap(id)}};
  return e;
}
function render(){
  hov=false;dock.style.width='';
  const extra=Object.keys(wins).filter(i=>!S.dock.includes(i));
  const cnt=1+S.dock.length+extra.length+(extra.length?.3:0);
  cur=Math.max(30,Math.min(S.size,Math.floor((innerWidth-44)/cnt)-8));
  document.documentElement.style.setProperty('--s',cur+'px');
  dock.innerHTML='';
  dock.append(item('lp'));
  S.dock.forEach(id=>dock.append(item(id,true)));
  if(extra.length){dock.append(mk('i','sep'));extra.forEach(id=>dock.append(item(id,false)))}
}
function dots(){dock.querySelectorAll('.it[data-id]').forEach(e=>{const w=wins[e.dataset.id];e.classList.toggle('run',!!w);e.classList.toggle('mini',!!(w&&w.min))})}
const label=id=>id==='lp'?'Apps':A[id].name;

/* magnification */
function enter(){dock.style.width='';baseW=dock.offsetWidth;hov=true;clearTimeout(tmr)}
function mag(x){
  const its=[...dock.querySelectorAll('.it')],R=(cur+8)*2.6,fs=[],ex=[];let tot=0;
  const cs=its.map(i=>{const r=i.getBoundingClientRect();return r.left+r.width/2-(i._sh||0)});
  cs.forEach(c=>{const d=Math.abs(x-c),f=d<R?Math.pow(Math.cos(d/R*Math.PI/2),2):0,e=(S.mag-1)*f*cur;fs.push(f);ex.push(e);tot+=e});
  let acc=0,best=-1,bf=.05;
  its.forEach((it,i)=>{const sh=acc+ex[i]/2-tot/2;acc+=ex[i];it._sh=sh;it.style.transform='translateX('+sh+'px) scale('+(1+(S.mag-1)*fs[i])+')';if(fs[i]>bf){bf=fs[i];best=i}});
  dock.style.width=(baseW+tot)+'px';
  if(best>=0){const r=its[best].getBoundingClientRect();tip.textContent=label(its[best].dataset.id);tip.style.left=r.left+r.width/2+'px';tip.style.top=r.top-6+'px';tip.classList.add('on')}else tip.classList.remove('on');
}
function rest(){
  if(!hov)return;hov=false;
  dock.querySelectorAll('.it').forEach(i=>{i._sh=0;i.style.transform=''});
  dock.style.width=baseW+'px';tip.classList.remove('on');
  tmr=setTimeout(()=>{if(!hov)dock.style.width=''},320);
}
dock.addEventListener('pointermove',e=>{if(e.pointerType==='touch'||drag)return;if(!hov)enter();mag(e.clientX)});
dock.addEventListener('pointerleave',rest);

/* reorder by dragging; drag off the dock to unpin */
dock.addEventListener('dragstart',e=>{
  const it=e.target.closest('.it');
  if(!it||!it.dataset.pin){e.preventDefault();return}
  rest();drag=it;ly=e.clientY;it.classList.add('dragging');
  e.dataTransfer.setData('text/plain',it.dataset.id);e.dataTransfer.effectAllowed='move';
});
dock.addEventListener('dragover',e=>{
  if(!drag)return;e.preventDefault();
  const pins=[...dock.querySelectorAll('.it[data-pin]')].filter(i=>i!==drag);
  let before=null;
  for(const p of pins){const r=p.getBoundingClientRect();if(e.clientX<r.left+r.width/2){before=p;break}}
  if(before){if(drag.nextElementSibling!==before)dock.insertBefore(drag,before)}
  else if(pins.length){const l=pins[pins.length-1];if(l.nextElementSibling!==drag)l.after(drag)}
});
document.addEventListener('dragover',e=>{ly=e.clientY});
document.addEventListener('dragend',()=>{
  if(!drag)return;
  const r=dock.getBoundingClientRect(),id=drag.dataset.id,out=ly<r.top-70;
  drag.classList.remove('dragging');
  S.dock=out?S.dock.filter(i=>i!==id):[...dock.querySelectorAll('.it[data-pin]')].map(i=>i.dataset.id);
  drag=null;save();render();
});

/* context menu */
dock.addEventListener('contextmenu',e=>{
  const it=e.target.closest('.it');if(!it||it.dataset.id==='lp')return;
  e.preventDefault();const id=it.dataset.id;ctx.innerHTML='';
  const add=(t,f)=>{const b=mk('button','',t);b.onclick=()=>{ctx.classList.remove('on');f()};ctx.append(b)};
  add('Open',()=>launch(id));
  add(S.dock.includes(id)?'Remove from dock':'Keep in dock',()=>{S.dock=S.dock.includes(id)?S.dock.filter(i=>i!==id):[...S.dock,id];save();render()});
  if(wins[id])add('Quit',()=>close(id));if(installedApps[id])add('Uninstall',()=>uninstallApp(id));
  ctx.style.left=Math.max(8,Math.min(e.clientX,innerWidth-170))+'px';
  ctx.style.bottom=(innerHeight-e.clientY+10)+'px';
  ctx.classList.add('on');
});
document.addEventListener('pointerdown',e=>{if(!ctx.contains(e.target))ctx.classList.remove('on')});

/* windows */
function tap(id){
  if(id==='lp')return togglePad();
  const w=wins[id];
  if(!w)return open(id);
  if(w.min)return restore(id);
  if(active===id)minimize(id);else focus(id);
}
function launch(id){const w=wins[id];if(!w)open(id);else if(w.min)restore(id);else focus(id)}
function focus(id){
  const w=wins[id];if(!w)return;
  w.el.style.zIndex=++z;active=id;
  for(const k in wins)wins[k].el.classList.toggle('act',k===id);
}
function open(id){
  const a=A[id],el=mk('section','win');
  el.innerHTML='<header><span class="tl"><b class="x" title="Close"></b><b class="m" title="Minimize"></b></span><strong>'+a.name+'</strong></header><div class="body"></div>';
  const w=Math.min(innerWidth-20,id==='store'?900:id==='web'?720:id==='chat'?360:id==='term'?520:id==='calc'?260:400);el.dataset.id=id;if(id==='web'||id==='chat'||id==='store')el.style.height=Math.max(260,Math.min(innerHeight-150,id==='store'?650:id==='web'?480:420))+'px';
  el.style.width=w+'px';
  el.style.left=Math.max(10,(innerWidth-w)/2+((n%6)-2)*30)+'px';
  el.style.top=(60+(n%6)*28)+'px';n++;
  el.querySelector('.body').append(body(id));
  desk.append(el);wins[id]={el,min:false};
  render();focus(id);
  const ic=itemEl(id);
  if(ic){const c=ic.querySelector('.ic');c.classList.add('bounce');c.onanimationend=()=>c.classList.remove('bounce')}
  el.addEventListener('pointerdown',()=>focus(id));
  el.querySelector('.x').onclick=()=>close(id);
  el.querySelector('.m').onclick=()=>minimize(id);
  const h=el.querySelector('header');let sx,sy,ox,oy,on=false;
  h.addEventListener('pointerdown',e=>{if(e.target.closest('b'))return;on=true;sx=e.clientX;sy=e.clientY;ox=el.offsetLeft;oy=el.offsetTop;h.setPointerCapture(e.pointerId)});
  h.addEventListener('pointermove',e=>{if(!on)return;el.style.left=Math.min(innerWidth-60,Math.max(-el.offsetWidth+80,ox+e.clientX-sx))+'px';el.style.top=Math.min(innerHeight-80,Math.max(34,oy+e.clientY-sy))+'px'});
  h.addEventListener('pointerup',()=>{on=false});
  h.addEventListener('pointercancel',()=>{on=false});
}
function close(id){
  const w=wins[id];if(!w)return;
  w.el.remove();delete wins[id];if(active===id)active=null;render();
}
function minimize(id){
  const w=wins[id],it=itemEl(id);if(!w||w.min||!it)return;
  const r=w.el.getBoundingClientRect(),t=it.getBoundingClientRect();
  w.el.style.transition='transform .4s cubic-bezier(.5,0,.75,0),opacity .4s';
  w.el.style.transform='translate('+(t.left+t.width/2-r.left-r.width/2)+'px,'+(t.top+t.height/2-r.top-r.height/2)+'px) scale(.04)';
  w.el.style.opacity=0;w.el.style.pointerEvents='none';
  w.min=true;if(active===id)active=null;
  for(const k in wins)wins[k].el.classList.remove('act');
  dots();
}
function restore(id){
  const w=wins[id];if(!w||!w.min)return;
  w.el.style.transition='transform .4s cubic-bezier(.2,.8,.2,1),opacity .25s';
  w.el.style.transform='';w.el.style.opacity=1;w.el.style.pointerEvents='';
  w.min=false;focus(id);dots();
}

/* window contents */
function body(id){
  const d=mk('div');
  if(id==='store'){d.className='fx';d.append(appStore());}else if(installedApps[id]){const frame=mk('iframe');frame.setAttribute('sandbox','allow-scripts allow-forms allow-modals allow-downloads');frame.setAttribute('referrerpolicy','no-referrer');frame.style.cssText='width:100%;height:420px;border:0;background:white;border-radius:8px';frame.srcdoc=installedApps[id].html;d.append(frame);}else if(id==='notes'){
    const t=mk('textarea');t.value=S.notes;t.placeholder='Jot something down. It is saved in this browser.';
    t.oninput=()=>{S.notes=t.value;save()};d.append(t);
  }else if(id==='term'){
    const out=mk('div','out'),inp=mk('input','cmd');
    inp.placeholder='type help';inp.autocomplete='off';inp.spellcheck=false;
    const pr=t=>{const p=mk('div');p.textContent=t;out.append(p);out.scrollTop=out.scrollHeight};
    pr('Welcome aboard. Type help.');
    inp.onkeydown=e=>{
      if(e.key!=='Enter')return;
      const v=inp.value.trim();inp.value='';pr('$ '+v);
      const [c,...r]=v.split(/\s+/),arg=r.join(' ').toLowerCase();
      if(c==='help')pr('help  apps  date  clear  whoami  open <app>  echo <text>');
      else if(c==='apps')pr(APPS.map(a=>a.name).join(', '));
      else if(c==='date')pr(new Date().toString());
      else if(c==='clear')out.innerHTML='';
      else if(c==='whoami')pr('captain');
      else if(c==='echo')pr(r.join(' '));
      else if(c==='open'){const a=APPS.find(x=>x.id===arg||x.name.toLowerCase()===arg);if(a){launch(a.id);pr('opening '+a.name)}else pr('no app called "'+arg+'"')}
      else if(c)pr('unknown command: '+c);
    };
    d.append(out,inp);
  }else if(id==='calc'){
    d.className='calc';
    const disp=mk('input');disp.readOnly=true;disp.value='0';
    const keys=mk('div','keys');let ex='';
    const show=()=>{disp.value=ex||'0'};
    'C ( ) / 7 8 9 * 4 5 6 - 1 2 3 + 0 . ⌫ ='.split(' ').forEach(k=>{
      const b=mk('button',/[\/*\-+=]/.test(k)?'op':'',k);
      b.onclick=()=>{
        if(k==='C')ex='';
        else if(k==='⌫')ex=ex.slice(0,-1);
        else if(k==='='){
          if(/^[0-9+\-*\/.() ]+$/.test(ex)){
            const r=calcEval(ex);ex=(r===null||!isFinite(r))?'Error':String(Math.round(r*1e10)/1e10);
          }
        }else{if(ex==='Error')ex='';ex+=k}
        show();
      };
      keys.append(b);
    });
    d.append(disp,keys);
  }else if(id==='web'){d.className='fx';d.append(browser())}else if(id==='chat'){d.className='fx';d.append(chat())}else if(id==='set'){
    d.className='set';
    const row=(t,inp)=>{const l=mk('label','',''),s=mk('span','',t);l.append(s,inp);d.append(l)};
    const rng=(k,min,max,step,fn)=>{const i=mk('input');i.type='range';i.min=min;i.max=max;i.step=step;i.value=S[k];i.oninput=()=>{S[k]=+i.value;save();fn()};return i};
    row('Icon size',rng('size',40,80,2,render));
    row('Magnification',rng('mag',1,2.4,.1,()=>{}));
    row('Blur strength',rng('blur',0,40,1,cfg));
    const sel=mk('select','','<option value="auto">Match system</option><option value="light">Light</option><option value="dark">Dark</option>');
    sel.value=S.theme;sel.onchange=()=>{S.theme=sel.value;save();cfg()};
    row('Theme',sel);
    const pi=mk('input');pi.placeholder='https://name.workers.dev';pi.value=S.proxy||'';pi.spellcheck=false;
    pi.style.cssText='width:55%;font:inherit;padding:3px 8px;border-radius:8px;border:1px solid var(--edge);background:var(--glass);color:inherit';
    pi.onchange=()=>{S.proxy=pi.value.trim();save()};
    row('Browser proxy',pi);
    const rb=mk('button','','Reset dock');rb.style.cssText='margin-top:8px;font:inherit;padding:6px 12px;border-radius:9px;border:1px solid var(--edge);background:var(--glass);color:inherit;cursor:pointer';
    rb.onclick=()=>{S.dock=[...DEF.dock];save();render()};d.append(rb);
  }else{
    const a=A[id];
    d.className='empty';d.innerHTML='<div class="ic" style="--h:'+a.h+'">'+a.e+'</div><b>'+a.name+'</b><br>This is a placeholder window. In a native build, this icon would launch the real program.';
  }
  return d;
}

/* calculator parser (extension pages cannot use eval) */
function calcEval(s){
  let i=0;
  const ws=()=>{while(s[i]===' ')i++};
  const num=()=>{
    ws();let neg=1;
    if(s[i]==='-'){neg=-1;i++}else if(s[i]==='+')i++;
    ws();
    if(s[i]==='('){i++;const v=expr();ws();if(s[i]!==')')throw 0;i++;return neg*v}
    const m=/^\d*\.?\d+|^\d+\.?/.exec(s.slice(i));
    if(!m)throw 0;
    i+=m[0].length;return neg*parseFloat(m[0]);
  };
  const term=()=>{let v=num();for(;;){ws();if(s[i]==='*'){i++;v*=num()}else if(s[i]==='/'){i++;v/=num()}else return v}};
  const expr=()=>{let v=term();for(;;){ws();if(s[i]==='+'){i++;v+=term()}else if(s[i]==='-'){i++;v-=term()}else return v}};
  try{const v=expr();ws();return i===s.length?v:null}catch(e){return null}
}

/* launcher */
function fill(t){
  grid.innerHTML='';
  const l=APPS.filter(a=>a.name.toLowerCase().includes(t.trim().toLowerCase()));
  l.forEach(a=>{
    const b=mk('div','app','<div class="ic" style="--h:'+a.h+'">'+a.e+'</div><span>'+a.name+'</span>');
    b.tabIndex=0;b.onclick=()=>{closePad();launch(a.id)};
    b.onkeydown=e=>{if(e.key==='Enter'){closePad();launch(a.id)}};
    grid.append(b);
  });
  if(!l.length)grid.textContent='No app matches "'+t+'".';
  grid._first=l[0]?l[0].id:null;
}
function openPad(){pad.classList.add('on');q.value='';fill('');q.focus()}
function closePad(){pad.classList.remove('on')}
function togglePad(){pad.classList.contains('on')?closePad():openPad()}
q.oninput=()=>fill(q.value);
q.onkeydown=e=>{if(e.key==='Enter'&&grid._first){const id=grid._first;closePad();launch(id)}};
pad.addEventListener('pointerdown',e=>{if(e.target===pad)closePad()});
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'){closePad();ctx.classList.remove('on')}
  const typing=/INPUT|TEXTAREA|SELECT/.test((document.activeElement||{}).tagName||'');
  if((e.key==='/'&&!typing)||(e.altKey&&e.code==='Space')||((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k')){e.preventDefault();togglePad()}
});

/* mini browser */
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
/* Web pages are fetched through free public CORS proxies, cleaned of scripts, and shown in a sandboxed frame. */
const PROX=[
  ['allorigins',u=>'https://api.allorigins.win/raw?url='+encodeURIComponent(u)],
  ['allorigins-json',u=>'https://api.allorigins.win/get?url='+encodeURIComponent(u),'json'],
  ['codetabs',u=>'https://api.codetabs.com/v1/proxy/?quest='+encodeURIComponent(u)],
  ['corsproxy',u=>'https://corsproxy.io/?url='+encodeURIComponent(u)],
  ['thingproxy',u=>'https://thingproxy.freeboard.io/fetch/'+u],
  ['yacdn',u=>'https://yacdn.org/proxy/'+u],
  ['cors-lol',u=>'https://api.cors.lol/?url='+encodeURIComponent(u)],
  ['cors-eu',u=>'https://cors.eu.org/'+u]
];
const INJ='('+(function(){
  document.addEventListener('click',function(e){
    var a=e.target.closest&&e.target.closest('a[href]');if(!a)return;
    var raw=a.getAttribute('href')||'';e.preventDefault();
    if(raw.charAt(0)==='#'){
      var id=raw.slice(1);try{id=decodeURIComponent(id)}catch(x){}
      var t=document.getElementById(id)||document.getElementsByName(id)[0];if(t)t.scrollIntoView();return;
    }
    if(/^https?:/.test(a.href))parent.postMessage({berthGo:a.href},'*');
  });
  document.addEventListener('submit',function(e){
    e.preventDefault();var f=e.target;
    if((f.method||'get').toLowerCase()!=='get')return;
    var u=new URL(f.getAttribute('action')||document.baseURI,document.baseURI);
    new FormData(f).forEach(function(v,k){if(typeof v==='string')u.searchParams.set(k,v)});
    parent.postMessage({berthGo:u.href},'*');
  });
}).toString()+')()';
const proxies=()=>{const l=PROX.slice();if(S.proxy&&/^https?:\/\//i.test(S.proxy))l.unshift(['your proxy',u=>S.proxy.replace(/\/+$/,'')+'/?url='+encodeURIComponent(u)]);return l};
async function round(u){
  const ctl=new AbortController(),tm=setTimeout(()=>ctl.abort(),15000);
  const one=async([name,fn,mode])=>{
    let r;
    try{r=await fetch(fn(u),{signal:ctl.signal})}
    catch(e){throw new Error(name+': '+(e&&e.name==='AbortError'?'timed out':'blocked or offline'))}
    if(!r.ok)throw new Error(name+': HTTP '+r.status);
    let txt;
    if(mode==='json'){
      const j=await r.json();txt=j.contents||'';
      if(/^data:/.test(txt))return {nonhtml:true};
    }else{
      const ct=r.headers.get('content-type')||'';
      if(ct&&!/html|xml|text|json/i.test(ct))return {nonhtml:true};
      txt=await r.text();
    }
    if(!/<(html|body|head|div|p|a|h1|title)/i.test(txt))throw new Error(name+': empty or not a page');
    return {html:txt};
  };
  try{const res=await Promise.any(proxies().map(one));ctl.abort();return res}
  catch(e){return {errs:(e.errors||[e]).map(x=>x.message)}}
  finally{clearTimeout(tm)}
}
const pageCache=new Map();
async function fetchPage(u,onTry){
  const hit=pageCache.get(u);
  if(hit)return {html:hit};
  let last;
  for(let i=0;i<3;i++){
    if(i){if(onTry)onTry(i+1);await new Promise(r=>setTimeout(r,i*1000))}
    last=await round(u);
    if(last.nonhtml)return last;
    if(last.html){
      if(last.html.length<1500000){pageCache.set(u,last.html);if(pageCache.size>25)pageCache.delete(pageCache.keys().next().value)}
      return last;
    }
  }
  return last;
}
function prep(html,u){
  const d=new DOMParser().parseFromString(html,'text/html');
  d.querySelectorAll('script,iframe,object,embed,meta[http-equiv]').forEach(n=>n.remove());
  d.querySelectorAll('noscript').forEach(n=>n.replaceWith(...n.childNodes));
  d.querySelectorAll('*').forEach(n=>{[...n.attributes].forEach(a=>{if(/^on/i.test(a.name))n.removeAttribute(a.name)})});
  let base=d.querySelector('base');
  if(!base){base=d.createElement('base');d.head.prepend(base)}
  const bh=base.getAttribute('href');
  try{base.setAttribute('href',bh?new URL(bh,u).href:u)}catch(e){base.setAttribute('href',u)}
  const s=d.createElement('script');s.textContent=INJ;d.body.append(s);
  return [(d.title||'').trim(),'<!doctype html>'+d.documentElement.outerHTML];
}
const pg=b=>'<!doctype html><meta charset="utf-8"><style>body{font:16px/1.55 system-ui,sans-serif;margin:0;padding:22px;color:#13293a;background:#fbf7ef}h1{margin:0 0 8px}a{color:#b9741a;cursor:pointer;font-weight:600}.c{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px;margin-top:14px}.c a{background:#fff;border:1px solid #e6dcc8;border-radius:12px;padding:14px;text-decoration:none;color:#13293a}small{font-weight:400;color:#6a7f8d}textarea{width:100%;height:110px;font:13px monospace;box-sizing:border-box}iframe{width:100%;height:170px;border:1px solid #e6dcc8;background:#fff;margin-top:8px}button{font:inherit;font-size:22px;padding:18px 34px;border-radius:14px;border:0;background:#b9741a;color:#fff;cursor:pointer}</style><script src="pg.js"></script>'+b;
const SITES={
'berth://home':['Home',()=>pg(`<h1>Berth Web</h1><p>Type an address or a search above.</p><div class="c"><a data-go="berth://arcade">Arcade<br><small>Ten second tap race</small></a><a data-go="berth://sandbox">Sandbox<br><small>Write HTML, see it live</small></a><a data-go="berth://about">About<br><small>How this works</small></a><a data-go="https://www.wikipedia.org">Wikipedia<br><small>A real website</small></a></div>`)],
'berth://arcade':['Arcade',()=>pg(`<h1>Tap race</h1><p>How many taps in ten seconds?</p><button id="b">Tap</button><p id="s">Ready.</p>`)],
'berth://sandbox':['Sandbox',()=>pg(`<h1>Sandbox</h1><p>Edit the HTML and CSS below. The preview updates as you type.</p><textarea id="t">&lt;h1 style="color:teal"&gt;Hello from the sandbox&lt;/h1&gt;</textarea><iframe id="f" sandbox></iframe>`)],
'berth://about':['About',()=>pg(`<h1>About Berth Web</h1><p>Websites are fetched through a free public proxy, stripped of scripts, and shown as readable copies. Text sites, articles, docs and search results work well. Logins, videos and web apps do not. The proxy can see which addresses you open.</p><p><a data-go="berth://home">Back home</a></p>`)]
};
function pageFor(url){
  const [p,qs]=url.split('?');
  if(p==='berth://search'){
    let q='';try{q=decodeURIComponent((qs||'').replace(/^q=/,''))}catch(e){}
    const hits=Object.entries(SITES).filter(([k,v])=>k!=='berth://home'&&(v[0]+k).toLowerCase().includes(q.toLowerCase()));
    return ['Search: '+q,pg('<h1>Results for "'+esc(q)+'"</h1>'+(hits.map(([k,v])=>'<p><a data-go="'+esc(k)+'">'+v[0]+'</a></p>').join('')||'<p>No built-in pages match.</p>')+'<p><a data-go="'+esc('https://html.duckduckgo.com/html/?q='+encodeURIComponent(q))+'">Search the web instead</a></p>')];
  }
  const s=SITES[p];
  return s?[s[0],s[1]()]:['Not found',pg('<h1>Page not found</h1><p><a data-go="berth://home">Go home</a></p>')];
}
function browser(){
  const w=mk('div','br');
  w.innerHTML='<div class="tabs"></div><div class="tb"><button title="Back">◀</button><button title="Forward">▶</button><button title="Reload">⟳</button><input class="url" placeholder="Search or enter an address" spellcheck="false" aria-label="Address"></div><div class="nt"></div><iframe title="Page"></iframe>';
  const tabs=w.querySelector('.tabs'),[bk,fw,rl]=w.querySelectorAll('.tb button'),url=w.querySelector('.url'),nt=w.querySelector('.nt'),fr=w.querySelector('iframe');
  const T=[{h:['berth://home'],i:0,t:'Home'}];let a=0;
  const norm=v=>{v=v.trim();if(!v)return 'berth://home';if(/^berth:\/\//.test(v)||/^https?:\/\//i.test(v))return v;if(/^[\w-]+(\.[\w-]+)+(\/\S*)?$/.test(v))return 'https://'+v;return 'https://html.duckduckgo.com/html/?q='+encodeURIComponent(v)};
  function drawTabs(){
    tabs.innerHTML='';
    T.forEach((t,i)=>{
      const b=mk('div','tab'+(i===a?' on':'')),s=mk('span'),x=mk('i','','×');
      s.textContent=t.t;x.title='Close tab';b.append(s,x);
      b.onclick=e=>{if(e.target===x){if(T.length>1){T.splice(i,1);if(a>i||a>=T.length)a--}}else a=i;show()};
      tabs.append(b);
    });
    const p=mk('button','pl','+');p.title='New tab';
    p.onclick=()=>{if(T.length<8){T.push({h:['berth://home'],i:0,t:'Home'});a=T.length-1;show()}};
    tabs.append(p);
  }
  let tok=0;
  async function ext(u,t){
    const my=++tok;
    fr.setAttribute('sandbox','allow-scripts');fr.removeAttribute('src');
    fr.srcdoc='<body style="font:16px system-ui;padding:22px;color:#456">Loading '+esc(u)+'...';
    const r=await fetchPage(u,n=>{if(my===tok)fr.srcdoc='<body style="font:16px system-ui;padding:22px;color:#456">Still trying ('+n+' of 3)...'});
    if(my!==tok||!fr.isConnected)return;
    const box='<body style="font:16px/1.5 system-ui;padding:22px;color:#13293a">';
    if(r.errs){fr.srcdoc=box+'<h2>Could not load this page</h2><p>Every proxy failed. Try again in a minute, or add your own proxy in Settings.</p><ul>'+r.errs.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul>';return}
    if(r.nonhtml){fr.srcdoc=box+'<h2>Not a web page</h2><p>This address is a file, image or video. Use "Open the real site" above.</p>';return}
    const p=prep(r.html,u);
    if(p[0]){t.t=p[0];drawTabs()}
    fr.srcdoc=p[1];
  }
  function show(){
    tok++;const t=T[a],u=t.h[t.i];
    url.value=u==='berth://home'?'':u;
    if(u.startsWith('berth://')){const r=pageFor(u);t.t=r[0];fr.removeAttribute('sandbox');fr.removeAttribute('src');fr.srcdoc=r[1];nt.style.display='none'}
    else{
      let h=u;try{h=new URL(u).hostname}catch(e){}
      t.t=h;ext(u,t);nt.style.display='block';nt.textContent='';
      const l=mk('a','','Open the real site');l.href=u;l.target='_blank';l.rel='noopener';
      nt.append('Pages load as simple copies: no scripts, no logins. ',l);
    }
    bk.disabled=t.i===0;fw.disabled=t.i>=t.h.length-1;drawTabs();
  }
  const go=v=>{const t=T[a];t.h=t.h.slice(0,t.i+1);t.h.push(norm(v));t.i++;show()};
  url.onkeydown=e=>{if(e.key==='Enter')go(url.value)};
  bk.onclick=()=>{T[a].i--;show()};fw.onclick=()=>{T[a].i++;show()};rl.onclick=()=>show();
  addEventListener('message',e=>{if(!fr.isConnected||e.source!==fr.contentWindow)return;const d=e.data;if(!d)return;const internal=T[a].h[T[a].i].startsWith('berth://');if(internal&&typeof d.go==='string')go(d.go);else if(!internal&&typeof d.berthGo==='string'&&/^https?:\/\//.test(d.berthGo))go(d.berthGo)});
  show();return w;
}

/* chat: signed-in claude.ai viewers share the page's db; anywhere else it uses a public ntfy.sh room */
let msgs=[],unread=0,seen=S.seen||Date.now(),meId=null,uapi=null,names={},chatUI=null,chatSend=null,chatState='Connecting...',chatMode='',stopNet=null,netOk=false;
const room=()=>(S.room||'lobby').toLowerCase().replace(/[^a-z0-9-]/g,'').slice(0,40)||'lobby';
function recount(){
  const vis=wins.chat&&!wins.chat.min;
  if(vis){if(unread||msgs.length){seen=Date.now();S.seen=seen;save()}unread=0}
  else unread=msgs.filter(m=>m.t>seen&&m.u!==meId).length;
  const e=itemEl('chat');if(e)e.dataset.b=unread?String(unread):'';
}
function chatDraw(){
  if(!chatUI||!chatUI.ms.isConnected)return;
  chatUI.nk.style.display=chatMode==='net'?'flex':'none';
  const live=chatMode==='db'?!!chatSend:(chatMode==='net'&&netOk);
  chatUI.st.textContent=live?(chatMode==='net'?'Public room "'+room()+'". Anyone who enters the same room name can read it.':'Live. Everyone with this page open sees your messages.'):chatState;
  chatUI.ms.innerHTML='';
  msgs.forEach(m=>{
    const me=m.u===meId,r=mk('div','m'+(me?' me':'')),b=mk('b'),s=mk('span');
    b.textContent=(me?'You':(m.n||names[m.u]||'Someone'))+' \u00b7 '+new Date(m.t).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});
    s.textContent=m.text;r.append(b,s);chatUI.ms.append(r);
  });
  chatUI.ms.scrollTop=chatUI.ms.scrollHeight;
}
function chat(){
  const box=mk('div','chat');
  box.innerHTML='<div class="st"></div><div class="nk"><input class="nn" maxlength="20" placeholder="Your name" aria-label="Your name"><input class="rn" maxlength="30" placeholder="Room" aria-label="Room"></div><div class="ms"></div><form class="cf"><input maxlength="500" placeholder="Message everyone here" autocomplete="off" aria-label="Message"><button>Send</button></form>';
  const inp=box.querySelector('.cf input'),nn=box.querySelector('.nn'),rn=box.querySelector('.rn');
  nn.value=S.nick||'';rn.value=S.room||'lobby';
  nn.oninput=()=>{S.nick=nn.value;save()};
  rn.onchange=()=>{S.room=rn.value;save();if(chatMode==='net')connectNet()};
  chatUI={st:box.querySelector('.st'),nk:box.querySelector('.nk'),ms:box.querySelector('.ms')};
  box.querySelector('form').onsubmit=e=>{
    e.preventDefault();
    const text=inp.value.trim();
    if(!text)return;
    if(!chatSend){chatUI.st.textContent=chatState;return}
    inp.value='';chatSend(text);
  };
  setTimeout(()=>{chatDraw();recount()},0);
  return box;
}
function connectNet(){
  if(stopNet)stopNet();
  msgs=[];netOk=false;chatState='Connecting...';chatDraw();
  const url='https://ntfy.sh/berth-'+room();
  let es;
  try{es=new EventSource(url+'/sse?since=6h')}catch(e){chatState='Chat is unavailable here.';chatDraw();return}
  es.onopen=()=>{netOk=true;chatDraw()};
  es.onerror=()=>{netOk=false;chatState='Cannot reach the chat server. This needs internet access and a page that allows it.';chatDraw()};
  es.onmessage=e=>{
    try{
      const ev=JSON.parse(e.data);if(ev.event!=='message')return;
      const m=JSON.parse(ev.message);
      if(!m||typeof m.text!=='string'||typeof m.t!=='number'||msgs.some(x=>x.id===ev.id))return;
      m.id=ev.id;m.n=String(m.n||'').slice(0,20);m.text=m.text.slice(0,500);
      msgs.push(m);msgs.sort((a,b)=>a.t-b.t);msgs=msgs.slice(-80);
      netOk=true;chatDraw();recount();
    }catch(x){}
  };
  chatSend=text=>{
    fetch(url,{method:'POST',body:JSON.stringify({u:S.cid,n:(S.nick||'').trim()||'Guest',text:text.slice(0,500),t:Date.now()})})
      .then(r=>{if(!r.ok)throw 0}).catch(()=>{chatUI&&chatUI.st&&(chatUI.st.textContent='Message not sent. Check your connection and try again.')});
  };
  stopNet=()=>{es.close();chatSend=null;netOk=false};
}
async function initChat(){
  if(!S.cid){S.cid=(window.crypto&&crypto.randomUUID)?crypto.randomUUID():String(Math.random()).slice(2);save()}
  meId=S.cid;
  setInterval(recount,1000);
  try{
    if(window.claude&&window.claude.use){
      const [db,user]=await Promise.all([claude.use('db'),claude.use('user')]);
      if(db){
        uapi=user;if(user){try{meId=(await user.id())||S.cid}catch(e){}}
        chatMode='db';
        chatSend=text=>db.collection('chat').add({u:meId,text:text.slice(0,500),t:Date.now()}).catch(()=>{chatUI&&chatUI.st&&(chatUI.st.textContent='Message not sent. You need Contributor access to post on this page.')});
        db.collection('chat').orderBy('t','desc').limit(80).onSnapshot(async snap=>{
          msgs=snap.docs.map(d=>d.data()).filter(m=>m&&typeof m.text==='string').reverse();
          if(uapi){try{const ids=[...new Set(msgs.map(m=>m.u))],ps=await uapi.profiles(ids);ids.forEach(i=>{names[i]=(ps[i]&&ps[i].name)||''})}catch(e){}}
          chatDraw();recount();
        },()=>{chatSend=null;chatState='Chat lost its connection.';chatDraw()});
        chatDraw();
        return;
      }
    }
  }catch(e){}
  chatMode='net';connectNet();
}


/* Per-browser App Store. Installed HTML is never written to GitHub or shared storage. */
const installedApps=Object.create(null);
const STORE_KEY='berth.installed.v1';
function loadInstalledApps(){
  try{const data=JSON.parse(localStorage.getItem(STORE_KEY)||'{}');for(const [id,a] of Object.entries(data)){
    if(!/^user-[a-z0-9-]+$/.test(id)||!a||typeof a.html!=='string'||a.html.length>500000||typeof a.name!=='string')continue;
    installedApps[id]={name:a.name.slice(0,45),html:a.html};A[id]={id,name:a.name.slice(0,45),e:'📦',h:275};APPS.push(A[id]);
  }}catch(e){}
}
function persistApps(){try{localStorage.setItem(STORE_KEY,JSON.stringify(installedApps));return true}catch(e){alert('Storage is full or blocked. App was not saved.');return false}}
function installHTML(name,html){
  name=String(name||'Untitled App').trim().slice(0,45);html=String(html||'');
  if(!html.trim()||html.length>500000){alert('HTML must be nonempty and under 500 KB.');return}
  const id='user-'+(crypto.randomUUID?crypto.randomUUID():Math.random().toString(36).slice(2));
  installedApps[id]={name,html};if(!persistApps()){delete installedApps[id];return}
  A[id]={id,name,e:'📦',h:275};APPS.push(A[id]);render();alert(name+' installed only in this browser.');
}
function uninstallApp(id){if(!installedApps[id])return;close(id);delete installedApps[id];delete A[id];const i=APPS.findIndex(a=>a.id===id);if(i>=0)APPS.splice(i,1);S.dock=S.dock.filter(x=>x!==id);persistApps();save();render()}
function downloadHTML(name,html){const blob=new Blob([html],{type:'text/html;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=(name.replace(/[^a-z0-9_-]/gi,'_')||'app')+'.html';a.click();setTimeout(()=>URL.revokeObjectURL(url),1500)}
function appStore(){
  // Open the supplied file itself, not a custom store or installer.
  const frame=document.createElement('iframe');
  frame.src='https://imaginative-cactus-b5f634.netlify.app/';
  frame.title='Berth App Store';
  frame.style.cssText='display:block;width:100%;height:100%;flex:1;min-height:0;border:0;background:#121212';
  return frame;
}

/* top bar, clock, simulated monitor */
$('#open-store').onclick=()=>launch('store');
$('#mt').onclick=()=>{S.mon=!S.mon;save();cfg()};
const tick=()=>{$('#clk').textContent=new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})};
const M={c:[],m:[],n:[]},V={c:30,m:52,n:20};
for(let i=0;i<40;i++)for(const k in M)M[k].push(V[k]);
function step(){
  V.c=Math.min(97,Math.max(3,V.c+(Math.random()-.5)*22));
  V.m=Math.min(90,Math.max(25,V.m+(Math.random()-.5)*4));
  V.n=Math.min(99,Math.max(1,V.n+(Math.random()-.5)*40));
  for(const k in M){M[k].push(V[k]);M[k].shift()}
  const pl=a=>a.map((v,i)=>(i*120/39).toFixed(1)+','+(27-v*.26).toFixed(1)).join(' ');
  $('#pc').setAttribute('points',pl(M.c));$('#pm').setAttribute('points',pl(M.m));$('#pn').setAttribute('points',pl(M.n));
  $('#vc').textContent=Math.round(V.c)+'%';$('#vm').textContent=(V.m*.16).toFixed(1)+' GB';$('#vn').textContent=(V.n*.4).toFixed(1)+' MB/s';
}
loadInstalledApps();cfg();render();tick();step();initChat();
setInterval(tick,20000);setInterval(step,1000);
addEventListener('resize',render);
