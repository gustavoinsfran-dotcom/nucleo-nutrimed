/* ============ 2. HELPERS ============ */
const $=s=>document.querySelector(s);
const money=v=>'$ '+Math.round(v).toLocaleString('es-AR');
const moneyK=v=>v>=1e6?'$ '+(v/1e6).toFixed(1)+'M':'$ '+Math.round(v/1000)+'k';
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const HOY=new Date('2026-07-31');
let MES=6; // julio

const ventasMes=m=>VENTAS.filter(v=>v.m===m);
const fact=arr=>arr.reduce((a,v)=>a+v.u*v.pu,0);
const unid=arr=>arr.reduce((a,v)=>a+v.u,0);
const serieFact=()=>MESES.map((_,i)=>fact(ventasMes(i)));
const serieCat=cat=>MESES.map((_,i)=>fact(ventasMes(i).filter(v=>P(v.p).cat===cat)));
const stockDe=id=>LOTES.filter(l=>l.p===id).reduce((a,l)=>a+l.u,0);
const diasA=f=>Math.round((new Date(f)-HOY)/864e5);
const nivelVto=d=>d<0?['critical','Vencido']:d<=60?['critical','Crítico']:d<=90?['serious','Urgente']:d<=180?['warning','Vigilar']:['good','OK'];
const CATC={'SNO':'var(--s1)','Sonda':'var(--s2)','Módulos':'var(--s3)'};

/* tooltip */
const tip=$('#tip');
function showTip(e,html){tip.innerHTML=html;tip.style.opacity=1;moveTip(e);}
function moveTip(e){const r=tip.getBoundingClientRect();let x=e.clientX+14,y=e.clientY-10;
 if(x+r.width>innerWidth-8)x=e.clientX-r.width-14; if(y+r.height>innerHeight-8)y=innerHeight-r.height-8;
 tip.style.left=x+'px';tip.style.top=Math.max(8,y)+'px';}
function hideTip(){tip.style.opacity=0;}

/* ============ 3. GRÁFICOS ============ */
function lineChart(vals,labels,opt={}){
 const W=760,H=230,ml=54,mr=14,mt=14,mb=26;
 const max=Math.max(...vals)*1.15||1, iw=W-ml-mr, ih=H-mt-mb;
 const x=i=>ml+(iw*i)/(vals.length-1), y=v=>mt+ih-(v/max)*ih;
 const pts=vals.map((v,i)=>[x(i),y(v)]);
 const d=pts.map((p,i)=>(i?'L':'M')+p[0].toFixed(1)+' '+p[1].toFixed(1)).join(' ');
 const area=d+` L${x(vals.length-1).toFixed(1)} ${mt+ih} L${ml} ${mt+ih} Z`;
 let ticks='';
 for(let k=0;k<=3;k++){const v=max*k/3,yy=y(v);
  ticks+=`<line x1="${ml}" x2="${W-mr}" y1="${yy}" y2="${yy}" stroke="var(--grid)" stroke-width="1"/>
  <text x="${ml-8}" y="${yy+4}" text-anchor="end" fill="var(--ink-3)" font-size="10.5">${moneyK(v)}</text>`;}
 let xl='';labels.forEach((l,i)=>{xl+=`<text x="${x(i)}" y="${H-7}" text-anchor="middle" fill="var(--ink-3)" font-size="11">${l}</text>`;});
 let hot='';vals.forEach((v,i)=>{hot+=`<rect x="${x(i)-iw/(2*(vals.length-1))}" y="${mt}" width="${iw/(vals.length-1)}" height="${ih}" fill="transparent" data-i="${i}"/>`;});
 return `<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto" class="lc">
  <defs><linearGradient id="lg" x1="0" y1="0" x2="0" y2="1">
   <stop offset="0%" stop-color="var(--s1)" stop-opacity=".18"/><stop offset="100%" stop-color="var(--s1)" stop-opacity="0"/></linearGradient></defs>
  ${ticks}<path d="${area}" fill="url(#lg)"/>
  <path d="${d}" fill="none" stroke="var(--s1)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
  ${pts.map((p,i)=>`<circle cx="${p[0]}" cy="${p[1]}" r="4" fill="var(--surface)" stroke="var(--s1)" stroke-width="2"/>`).join('')}
  <line id="ch" x1="0" x2="0" y1="${mt}" y2="${mt+ih}" stroke="var(--axis)" stroke-width="1" stroke-dasharray="3 3" opacity="0"/>
  ${xl}${hot}</svg>`;
}
function bindLine(root,vals,labels,extra){
 const svg=root.querySelector('.lc'); if(!svg)return;
 const ch=svg.querySelector('#ch');
 svg.querySelectorAll('rect[data-i]').forEach(r=>{
  r.addEventListener('mousemove',e=>{const i=+r.dataset.i;
   ch.setAttribute('x1',+r.getAttribute('x')+ +r.getAttribute('width')/2);
   ch.setAttribute('x2',+r.getAttribute('x')+ +r.getAttribute('width')/2);ch.setAttribute('opacity','1');
   showTip(e,`<b>${labels[i]} 2026</b>${extra(i)}`);});
  r.addEventListener('mouseleave',()=>{ch.setAttribute('opacity','0');hideTip();});
 });
}
function stackChart(cats){
 const W=760,H=210,ml=54,mr=14,mt=12,mb=26,n=MESES.length;
 const series=cats.map(c=>serieCat(c));
 const tot=MESES.map((_,i)=>series.reduce((a,s)=>a+s[i],0));
 const max=Math.max(...tot)*1.12||1,iw=W-ml-mr,ih=H-mt-mb,bw=Math.min(46,iw/n-14);
 let g='';for(let k=0;k<=3;k++){const yy=mt+ih-(ih*k/3);
  g+=`<line x1="${ml}" x2="${W-mr}" y1="${yy}" y2="${yy}" stroke="var(--grid)"/><text x="${ml-8}" y="${yy+4}" text-anchor="end" fill="var(--ink-3)" font-size="10.5">${moneyK(max*k/3)}</text>`;}
 let bars='';
 MESES.forEach((m,i)=>{
  const cx=ml+(iw*(i+.5))/n-bw/2; let acc=0;
  cats.forEach((c,ci)=>{
   const v=series[ci][i]; if(v<=0)return;
   const h=(v/max)*ih, yy=mt+ih-((acc+v)/max)*ih; acc+=v;
   bars+=`<rect x="${cx}" y="${yy+1}" width="${bw}" height="${Math.max(0,h-2)}" rx="3" fill="${CATC[c]}" data-m="${i}" data-c="${ci}"/>`;
  });
  bars+=`<text x="${cx+bw/2}" y="${H-7}" text-anchor="middle" fill="var(--ink-3)" font-size="11">${m}</text>`;
 });
 return {svg:`<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto" class="sc">${g}${bars}</svg>`,series};
}
function barsH(rows,color){
 const max=Math.max(...rows.map(r=>r.v))||1;
 return rows.map(r=>`<div style="margin-bottom:11px">
  <div style="display:flex;justify-content:space-between;gap:10px;font-size:12.5px;margin-bottom:4px">
   <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(r.n)}</span>
   <b style="font-variant-numeric:tabular-nums;white-space:nowrap">${r.t}</b></div>
  <div class="bar"><i style="width:${(r.v/max*100).toFixed(1)}%;background:${color||'var(--s1)'}"></i></div></div>`).join('');
}

/* ============ 4. VISTAS ============ */
const V={};

V.panel=()=>{
 const vm=ventasMes(MES),vp=ventasMes(MES-1);
 const f=fact(vm),fp=fact(vp),d=fp?((f-fp)/fp*100):0;
 const cl=new Set(vm.map(v=>v.c)).size, clp=new Set(vp.map(v=>v.c)).size;
 const nuevas=CUENTAS.filter(c=>c.desde===MESES[MES]).length;
 const tick=f/(unid(vm)||1);
 const vals=serieFact();
 const st=stackChart(['SNO','Sonda','Módulos']);
 const top=Object.values(vm.reduce((a,v)=>{(a[v.p]=a[v.p]||{n:P(v.p).n,v:0,u:0});a[v.p].v+=v.u*v.pu;a[v.p].u+=v.u;return a;},{}))
   .sort((a,b)=>b.v-a.v).slice(0,6).map(r=>({n:r.n,v:r.v,t:money(r.v)}));
 const alertas=LOTES.map(l=>({l,d:diasA(l.v)})).filter(x=>x.d<=180).sort((a,b)=>a.d-b.d);
 const bajo=LOTES.reduce((a,l)=>{a[l.p]=(a[l.p]||0)+l.u;return a;},{});
 const quiebre=PROD.filter(p=>(bajo[p.id]||0)<50);
 return `
 <div class="demo">Prototipo con datos de ejemplo. La estructura, los cálculos y los flujos son reales — los números no.</div>
 <div class="grid g4" style="margin-bottom:14px">
  <div class="card tile"><div class="lbl">Facturación ${MESES[MES]}</div><div class="val">${money(f)}</div>
   <div class="dlt">${fp?`<span class="${d>=0?'up':'dn'}">${d>=0?'▲':'▼'} ${Math.abs(d).toFixed(0)}%</span> vs ${MESES[MES-1]}`:'primer mes con registro'}</div></div>
  <div class="card tile"><div class="lbl">Unidades</div><div class="val">${unid(vm).toLocaleString('es-AR')}</div><div class="dlt">${vm.length} operaciones · ticket ${money(tick)}</div></div>
  <div class="card tile"><div class="lbl">Cuentas que compraron</div><div class="val">${cl}</div><div class="dlt">${clp?`<span class="${cl>=clp?'up':'dn'}">${cl>=clp?'▲':'▼'} ${Math.abs(cl-clp)}</span> vs ${MESES[MES-1]}`:'—'} · ${nuevas} nueva${nuevas===1?'':'s'}</div></div>
  <div class="card tile"><div class="lbl">Alertas abiertas</div><div class="val" style="color:var(--critical)">${alertas.filter(a=>a.d<=90).length+quiebre.length}</div><div class="dlt">vencimientos + quiebres de stock</div></div>
 </div>
 <div class="grid g23" style="margin-bottom:14px">
  <div class="card"><h3>Evolución de facturación</h3><p class="sub">Ene → Jul 2026 · pasá el mouse por el gráfico</p>
   <div id="lcw">${lineChart(vals,MESES)}</div>
   <p class="src">Fuente: ventas cargadas en NÚCLEO. Antes de julio, carga retroactiva desde planilla de logística.</p></div>
  <div class="card"><h3>Estado de la cartera</h3><p class="sub">${CUENTAS.length} cuentas en seguimiento</p>
   ${barsH(ESTADOS.map(e=>{const n=CUENTAS.filter(c=>c.e===e).length;return{n:e,v:n,t:n+''}}),'var(--s1)')}</div>
 </div>
 <div class="grid g23" style="margin-bottom:14px">
  <div class="card"><h3>Mix por línea</h3><p class="sub">Facturación mensual por categoría de producto</p>
   <div id="scw">${st.svg}</div>
   <div class="legend"><span><i style="background:var(--s1)"></i>SNO (oral)</span><span><i style="background:var(--s2)"></i>Sonda</span><span><i style="background:var(--s3)"></i>Módulos</span></div></div>
  <div class="card"><h3>Top productos — ${MESES[MES]}</h3><p class="sub">Por facturación</p>${barsH(top,'var(--s1)')}</div>
 </div>
 <div class="grid g2">
  <div class="card"><h3>Alertas de vencimiento</h3><p class="sub">Lotes a menos de 180 días · criterio FEFO</p>
   ${alertas.slice(0,5).map(a=>{const[n,t]=nivelVto(a.d);return `<div class="alert a-${n==='critical'?'crit':n==='serious'?'ser':'warn'}">
    <span class="ic">${n==='critical'?'⛔':n==='serious'?'⚠':'◔'}</span><div><b>${esc(P(a.l.p).n)}</b>
    <p>Lote ${a.l.l} · ${a.l.u} u. · vence ${a.l.v.split('-').reverse().join('/')} — <b>${a.d} días</b> · ${t}</p></div></div>`}).join('')||'<p class="mini">Sin alertas.</p>'}</div>
  <div class="card"><h3>Marketing → venta</h3><p class="sub">Acciones que generaron cuentas activas</p>
   ${ACCIONES.filter(a=>a.cta>0).slice(0,5).map(a=>`<div style="display:flex;justify-content:space-between;gap:12px;padding:9px 0;border-bottom:1px solid var(--grid)">
     <div><b style="font-size:12.5px">${esc(a.n)}</b><div class="mini">${a.cont} contactos · ${a.cta} cuentas abiertas</div></div>
     <div style="text-align:right;white-space:nowrap"><b>${a.vta} ventas</b><div class="mini">${a.inv?money(a.inv):'sin costo'}</div></div></div>`).join('')}
   <p class="src">Trazabilidad contacto → cuenta → primera orden. Es el dato que justifica el presupuesto de marketing.</p></div>
 </div>`;
};

V.ventas=()=>{
 const vm=ventasMes(MES).slice().sort((a,b)=>b.f.localeCompare(a.f));
 return `<div class="card" style="margin-bottom:14px"><h3>Carga rápida</h3><p class="sub">Pensado para 30 segundos desde el celular, después de la visita</p>
  <button class="btn pri" onclick="document.getElementById('dlgSale').showModal()">+ Cargar venta</button>
  <button class="btn" onclick="alert('En la versión real: importa la planilla de logística/depósito (.xlsx o .csv) y concilia contra lo cargado en campo.')">↥ Importar planilla de logística</button></div>
 <div class="card"><h3>Ventas de ${MESES[MES]} 2026</h3><p class="sub">${vm.length} operaciones · ${money(fact(vm))}</p>
 <div class="tw"><table><thead><tr><th>Fecha</th><th>Cuenta</th><th>Producto</th><th class="num">Unid.</th><th class="num">Total</th><th>Origen</th></tr></thead><tbody>
 ${vm.map(v=>`<tr><td>${v.f.split('-').reverse().join('/')}</td><td>${esc(C(v.c).n)}</td>
  <td>${esc(P(v.p).n)}<div class="mini">${P(v.p).pres}</div></td><td class="num">${v.u}</td>
  <td class="num">${money(v.u*v.pu)}</td><td><span class="tag">${v.o}</span></td></tr>`).join('')}
 </tbody></table></div></div>`;
};

V.cuentas=()=>{
 const cnt=e=>CUENTAS.filter(c=>c.e===e).length;
 const emb=['Prospecto','Contactada','Muestra entregada','Primera compra','Activa','Recurrente'];
 const colores=['#6FC5E6','#43B0DC','#2BA4D9','#2490C0','#1E7CA6','#175E80'];
 const mx=Math.max(...emb.map(cnt));
 return `<div class="card" style="margin-bottom:14px"><h3>Embudo comercial</h3><p class="sub">Dónde está parada cada cuenta hoy</p>
  <div class="stage">${emb.map((e,i)=>`<div style="flex:${Math.max(1,cnt(e))};background:${colores[i]};color:${i<2?'#0C1A2B':'#fff'}">${cnt(e)}<small>${e}</small></div>`).join('')}</div>
  <p class="mini" style="margin-top:8px">${cnt('Dormida')} cuenta(s) dormida(s): compraron y llevan más de 60 días sin recomprar. Es la lista de recuperación del mes.</p></div>
 <div class="card"><h3>Cuentas</h3><p class="sub">Instituciones, farmacias, distribuidores y profesionales</p>
 <div class="tw"><table><thead><tr><th>Cuenta</th><th>Tipo</th><th>Zona</th><th>Referente</th><th>Estado</th><th class="num">Facturado 2026</th><th class="num">Últ. compra</th></tr></thead><tbody>
 ${CUENTAS.map(c=>{
  const vs=VENTAS.filter(v=>v.c===c.id);const ult=vs.length?MESES[Math.max(...vs.map(v=>v.m))]:'—';
  const st=c.e==='Recurrente'?'t-good':c.e==='Dormida'?'t-crit':c.e==='Activa'?'t-good':c.e==='Prospecto'?'':'t-warn';
  return `<tr><td><b>${esc(c.n)}</b></td><td>${c.t}</td><td>${c.z}</td><td>${esc(c.ref)}</td>
  <td><span class="tag ${st}"><span class="d"></span>${c.e}</span></td><td class="num">${vs.length?money(fact(vs)):'—'}</td><td class="num">${ult}</td></tr>`}).join('')}
 </tbody></table></div></div>`;
};

V.stock=()=>{
 const rows=LOTES.map(l=>({l,d:diasA(l.v)})).sort((a,b)=>a.d-b.d);
 const val=LOTES.reduce((a,l)=>a+l.u*P(l.p).p,0);
 const riesgo=rows.filter(r=>r.d<=90).reduce((a,r)=>a+r.l.u*P(r.l.p).p,0);
 const bajo=PROD.map(p=>({p,u:stockDe(p.id)})).filter(x=>x.u<50).sort((a,b)=>a.u-b.u);
 const cob=PROD.map(p=>{const u3=VENTAS.filter(v=>v.p===p.id&&v.m>=MES-2).reduce((a,v)=>a+v.u,0)/3;
  return{p,u:stockDe(p.id),r:u3,m:u3?stockDe(p.id)/u3:99}}).sort((a,b)=>a.m-b.m).slice(0,6);
 return `<div class="grid g3" style="margin-bottom:14px">
  <div class="card tile"><div class="lbl">Valor de stock</div><div class="val">${money(val)}</div><div class="dlt">${LOTES.reduce((a,l)=>a+l.u,0)} unidades en ${LOTES.length} lotes</div></div>
  <div class="card tile"><div class="lbl">En riesgo (≤90 días)</div><div class="val" style="color:var(--critical)">${money(riesgo)}</div><div class="dlt">${rows.filter(r=>r.d<=90).length} lotes por vencer</div></div>
  <div class="card tile"><div class="lbl">Productos en quiebre</div><div class="val" style="color:var(--serious)">${bajo.length}</div><div class="dlt">bajo el mínimo de 50 unidades</div></div></div>
 <div class="grid g2" style="margin-bottom:14px">
  <div class="card"><h3>Cobertura estimada</h3><p class="sub">Meses de stock según promedio de venta de los últimos 3 meses</p>
   ${barsH(cob.map(c=>({n:c.p.n,v:Math.min(c.m,12),t:c.r?c.m.toFixed(1)+' meses':'sin rotación'})),'var(--s1)')}
   <p class="src">Menos de 2 meses = reponer. Es el dato para pedirle stock a casa matriz con fundamento.</p></div>
  <div class="card"><h3>Acciones sugeridas</h3><p class="sub">Generadas por las reglas de vencimiento y rotación</p>
   ${rows.filter(r=>r.d<=90).map(r=>`<div class="alert a-crit"><span class="ic">⛔</span><div><b>${esc(P(r.l.p).n)}</b>
    <p>${r.l.u} u. vencen en ${r.d} días. Priorizar en instituciones de alta rotación o definir acción comercial con Juan Pablo.</p></div></div>`).join('')}
   ${bajo.slice(0,3).map(b=>`<div class="alert a-ser"><span class="ic">⚠</span><div><b>${esc(b.p.n)}</b><p>Quedan ${b.u} unidades. Pedido de reposición a casa matriz.</p></div></div>`).join('')}</div></div>
 <div class="card"><h3>Lotes</h3><p class="sub">Orden FEFO — primero el que vence antes</p>
 <div class="tw"><table><thead><tr><th>Producto</th><th>Presentación</th><th>Lote</th><th class="num">Unid.</th><th>Vence</th><th class="num">Días</th><th>Estado</th></tr></thead><tbody>
 ${rows.map(r=>{const[n,t]=nivelVto(r.d);const cls=n==='critical'?'t-crit':n==='serious'?'t-ser':n==='warning'?'t-warn':'t-good';
  return `<tr><td>${esc(P(r.l.p).n)}</td><td class="mini">${P(r.l.p).pres}</td><td>${r.l.l}</td><td class="num">${r.l.u}</td>
  <td>${r.l.v.split('-').reverse().join('/')}</td><td class="num">${r.d}</td><td><span class="tag ${cls}"><span class="d"></span>${t}</span></td></tr>`}).join('')}
 </tbody></table></div>
 <p class="src">El stock se descuenta automáticamente al cargar una venta (FEFO). La conciliación con la planilla de depósito se hace una vez por semana.</p></div>`;
};

V.acciones=()=>{
 const inv=ACCIONES.reduce((a,x)=>a+x.inv,0),cont=ACCIONES.reduce((a,x)=>a+x.cont,0);
 const cta=ACCIONES.reduce((a,x)=>a+x.cta,0),vta=ACCIONES.reduce((a,x)=>a+x.vta,0);
 return `<div class="grid g4" style="margin-bottom:14px">
  <div class="card tile"><div class="lbl">Inversión 2026</div><div class="val">${money(inv)}</div><div class="dlt">${ACCIONES.length} acciones</div></div>
  <div class="card tile"><div class="lbl">Contactos generados</div><div class="val">${cont}</div><div class="dlt">costo por contacto ${money(inv/cont)}</div></div>
  <div class="card tile"><div class="lbl">Cuentas abiertas</div><div class="val">${cta}</div><div class="dlt">${(cta/cont*100).toFixed(1)}% de conversión</div></div>
  <div class="card tile"><div class="lbl">Cuentas que compraron</div><div class="val">${vta}</div><div class="dlt">costo por cuenta ${money(inv/vta)}</div></div></div>
 <div class="card"><h3>Acciones de marketing</h3><p class="sub">Cada acción trae su base de contactos y su trazabilidad comercial</p>
 <div class="tw"><table><thead><tr><th>Acción</th><th>Tipo</th><th>Fecha</th><th class="num">Inversión</th><th class="num">Contactos</th><th class="num">Cuentas</th><th class="num">Con venta</th><th>Estado</th></tr></thead><tbody>
 ${ACCIONES.map(a=>`<tr><td><b>${esc(a.n)}</b></td><td>${a.t}</td><td>${a.f.split('-').reverse().join('/')}</td>
  <td class="num">${a.inv?money(a.inv):'—'}</td><td class="num">${a.cont}</td><td class="num">${a.cta}</td><td class="num">${a.vta}</td>
  <td><span class="tag ${a.est==='Cerrada'?'t-good':a.est==='En curso'?'t-warn':''}"><span class="d"></span>${a.est}</span></td></tr>`).join('')}
 </tbody></table></div>
 <p class="src">Toda pieza publicada requiere validación técnica (Juli) y regulatoria (Gabi) antes de salir. El sistema guarda quién validó y cuándo.</p></div>`;
};

V.base=()=>{
 const orig=[...new Set(CONTACTOS.map(c=>c.o))];
 return `<div class="card" style="margin-bottom:14px"><h3>Base unificada de contactos</h3>
  <p class="sub">Hoy son bases sueltas: universidades, jornadas, clínicas, sorteo. Acá viven en un solo lugar, deduplicadas y con origen.</p>
  <div class="chips">${orig.map((o,i)=>`<span class="chip ${i===0?'on':''}">${esc(o)} · ${CONTACTOS.filter(c=>c.o===o).length}</span>`).join('')}</div>
  <div class="grid g4">
   <div class="card tile" style="padding:12px"><div class="lbl">Contactos</div><div class="val" style="font-size:22px">${CONTACTOS.length}</div></div>
   <div class="card tile" style="padding:12px"><div class="lbl">Vinculados a cuenta</div><div class="val" style="font-size:22px">${CONTACTOS.filter(c=>c.cta).length}</div></div>
   <div class="card tile" style="padding:12px"><div class="lbl">Instituciones</div><div class="val" style="font-size:22px">${new Set(CONTACTOS.map(c=>c.i)).size}</div></div>
   <div class="card tile" style="padding:12px"><div class="lbl">Orígenes</div><div class="val" style="font-size:22px">${orig.length}</div></div>
  </div></div>
 <div class="card"><h3>Contactos</h3><p class="sub">Muestra del padrón</p>
 <div class="tw"><table><thead><tr><th>Nombre</th><th>Rol</th><th>Institución</th><th>Origen</th><th>Alta</th><th>Cuenta vinculada</th></tr></thead><tbody>
 ${CONTACTOS.map(c=>`<tr><td><b>${esc(c.n)}</b></td><td>${c.r}</td><td>${esc(c.i)}</td><td><span class="tag">${esc(c.o)}</span></td>
  <td>${c.f.split('-').reverse().join('/')}</td><td>${c.cta?esc(C(c.cta).n):'<span class="mini">sin vincular</span>'}</td></tr>`).join('')}
 </tbody></table></div>
 <p class="src">Datos de profesionales de la salud: consentimiento y finalidad registrados por contacto (Ley 25.326). Sin esto, la base no se puede usar para envíos.</p></div>`;
};

V.reportes=()=>{
 const vm=ventasMes(MES),vp=ventasMes(MES-1);
 const porCat=['SNO','Sonda','Módulos'].map(c=>({c,v:fact(vm.filter(x=>P(x.p).cat===c)),u:unid(vm.filter(x=>P(x.p).cat===c))}));
 const porCta=Object.values(vm.reduce((a,v)=>{(a[v.c]=a[v.c]||{n:C(v.c).n,v:0});a[v.c].v+=v.u*v.pu;return a;},{})).sort((a,b)=>b.v-a.v);
 return `<div class="card" style="margin-bottom:14px"><h3>Reporte mensual</h3><p class="sub">Listo para Juan Pablo y para casa matriz</p>
  <button class="btn pri" onclick="exportCSV()">↧ Descargar ventas (.csv)</button>
  <button class="btn" onclick="window.print()">↧ Reporte ejecutivo (PDF)</button>
  <button class="btn" onclick="exportBase()">↧ Base de contactos (.csv)</button></div>
 <div class="card"><h3>Resumen ejecutivo — ${MESES[MES]} 2026</h3><p class="sub">Vista previa de lo que se exporta</p>
 <table style="margin-bottom:18px"><thead><tr><th>Indicador</th><th class="num">${MESES[MES]}</th><th class="num">${MESES[MES-1]||'—'}</th><th class="num">Var.</th></tr></thead><tbody>
 ${[['Facturación',fact(vm),fact(vp),money],['Unidades',unid(vm),unid(vp),v=>v.toLocaleString('es-AR')],
   ['Operaciones',vm.length,vp.length,v=>v],['Cuentas compradoras',new Set(vm.map(v=>v.c)).size,new Set(vp.map(v=>v.c)).size,v=>v]]
  .map(([k,a,b,f])=>{const d=b?((a-b)/b*100):null;return `<tr><td>${k}</td><td class="num">${f(a)}</td><td class="num">${b?f(b):'—'}</td>
   <td class="num">${d===null?'—':`<span class="${d>=0?'up':'dn'}">${d>=0?'+':''}${d.toFixed(0)}%</span>`}</td></tr>`}).join('')}
 </tbody></table>
 <div class="grid g2">
  <div><h3 style="margin-bottom:8px">Por línea</h3>${barsH(porCat.map(x=>({n:x.c,v:x.v,t:money(x.v)})),'var(--s1)')}</div>
  <div><h3 style="margin-bottom:8px">Por cuenta</h3>${barsH(porCta.slice(0,6).map(x=>({n:x.n,v:x.v,t:money(x.v)})),'var(--s1)')}</div>
 </div>
 <p class="src">Con 3 meses de historial cargado, el sistema propone el budget del trimestre siguiente en vez de recibirlo sin discusión.</p></div>`;
};

/* ============ 5. RENDER + EVENTOS ============ */
const TITULOS={
 panel:['Panel <em>comercial</em>','Vista general de la línea'],
 ventas:['Registro de <em>ventas</em>','Carga, importación y detalle de operaciones'],
 cuentas:['Cartera de <em>cuentas</em>','Embudo comercial e instituciones'],
 stock:['Stock y <em>vencimientos</em>','Lotes, cobertura y alertas FEFO'],
 acciones:['Acciones de <em>marketing</em>','Trazabilidad hacia la venta'],
 base:['Base de <em>datos</em>','Contactos unificados por origen'],
 reportes:['<em>Reportes</em>','Exportación mensual']};
let VISTA='panel';
function render(){
 $('#views').innerHTML=V[VISTA]();
 $('#vTitle').innerHTML=TITULOS[VISTA][0];
 $('#vSub').textContent=`${MESES[MES]} 2026 · ${TITULOS[VISTA][1]}`;
 if(VISTA==='panel'){
  const vals=serieFact();
  bindLine($('#lcw'),vals,MESES,i=>{
   const vm=ventasMes(i);
   return `<div class="row"><span>Facturación</span><b>${money(vals[i])}</b></div>
    <div class="row"><span>Unidades</span><b>${unid(vm)}</b></div>
    <div class="row"><span>Operaciones</span><b>${vm.length}</b></div>
    <div class="row"><span>Cuentas</span><b>${new Set(vm.map(v=>v.c)).size}</b></div>`;});
  const cats=['SNO','Sonda','Módulos'];
  $('#scw').querySelectorAll('rect[data-m]').forEach(r=>{
   r.addEventListener('mousemove',e=>{const m=+r.dataset.m,c=cats[+r.dataset.c];
    showTip(e,`<b>${MESES[m]} · ${c}</b><div class="row"><span>Facturación</span><b>${money(serieCat(c)[m])}</b></div>`);});
   r.addEventListener('mouseleave',hideTip);});
 }
 const a=LOTES.map(l=>diasA(l.v)).filter(d=>d<=90).length;
 $('#pillStock').textContent=a; $('#pillStock').style.display=a?'':'none';
}
document.querySelectorAll('.nav').forEach(b=>b.addEventListener('click',()=>{
 document.querySelectorAll('.nav').forEach(x=>x.classList.remove('on'));b.classList.add('on');VISTA=b.dataset.v;render();}));
const sel=$('#periodo');
MESES.forEach((m,i)=>{const o=document.createElement('option');o.value=i;o.textContent=m+' 2026';sel.appendChild(o);});
sel.value=MES; sel.addEventListener('change',()=>{MES=+sel.value;render();});
document.addEventListener('mousemove',e=>{if(tip.style.opacity==1)moveTip(e);});

/* alta de venta */
const dlg=$('#dlgSale');
function initVenta(){
 $('#fCuenta').innerHTML='';$('#fProd').innerHTML='';
 CUENTAS.forEach(c=>{const o=document.createElement('option');o.value=c.id;o.textContent=c.n;$('#fCuenta').appendChild(o);});
 PROD.forEach(p=>{const o=document.createElement('option');o.value=p.id;o.textContent=p.n+' — '+p.pres;$('#fProd').appendChild(o);});
 $('#fFecha').value=new Date().toISOString().slice(0,10);
 syncPrecio();
}
const syncPrecio=()=>{const p=P($('#fProd').value);if(p)$('#fPrecio').value=p.p;};
$('#fProd').addEventListener('change',syncPrecio);
$('#newSale').addEventListener('click',()=>dlg.showModal());
dlg.addEventListener('close',async()=>{
 if(dlg.returnValue!=='ok')return;
 const p=$('#fProd').value,u=Math.max(1,+$('#fUnid').value||1),f=$('#fFecha').value;
 const m=Math.max(0,Math.min(MESES.length-1,+f.split('-')[1]-1));
 try{
  await DB.addVenta({f,m,c:+$('#fCuenta').value,p,u,pu:+$('#fPrecio').value,o:$('#fOrigen').value});
 }catch(e){alert('No se pudo guardar la venta: '+(e.message||e));return;}
 MES=m;sel.value=m;render();
});

/* export */
function dl(name,rows){
 const csv=rows.map(r=>r.map(c=>`"${String(c).replace(/"/g,'""')}"`).join(';')).join('\n');
 const a=document.createElement('a');
 a.href=URL.createObjectURL(new Blob(['﻿'+csv],{type:'text/csv;charset=utf-8'}));
 a.download=name;a.click();URL.revokeObjectURL(a.href);
}
function exportCSV(){
 dl(`nucleo_ventas_${MESES[MES]}_2026.csv`,[['Fecha','Cuenta','Tipo','Zona','Producto','Presentacion','Categoria','Unidades','Precio unitario','Total','Origen'],
  ...ventasMes(MES).map(v=>[v.f,C(v.c).n,C(v.c).t,C(v.c).z,P(v.p).n,P(v.p).pres,P(v.p).cat,v.u,v.pu,v.u*v.pu,v.o])]);
}
function exportBase(){
 dl('nucleo_contactos.csv',[['Nombre','Rol','Institucion','Origen','Alta','Cuenta vinculada'],
  ...CONTACTOS.map(c=>[c.n,c.r,c.i,c.o,c.f,c.cta?C(c.cta).n:''])]);
}

/* ============ 6. ARRANQUE ============ */
function marcarModo(){
 const el=$('#modo');
 if(DB.modo==='vivo'){el.innerHTML='<span class="dot on"></span>En vivo'+(DB.user?` · ${esc(DB.user.email.split('@')[0])}`:'');
  el.title='Conectado a la base de datos. Los cambios se guardan.';$('#logout').classList.remove('hide');}
 else{el.innerHTML='<span class="dot"></span>Modo demo';el.title='Sin base de datos: los datos son de ejemplo y no se guardan.';}
}
async function boot(){
 let modo='demo';
 try{modo=await DB.init();}catch(e){console.warn('Sin conexión a la base, sigo en modo demo:',e);}
 if(modo==='login'){$('#login').classList.remove('hide');return;}
 initVenta();marcarModo();render();
}
$('#loginForm').addEventListener('submit',async e=>{
 e.preventDefault();const b=$('#loginBtn');b.disabled=true;b.textContent='Entrando…';
 try{
  await DB.login($('#lEmail').value.trim(),$('#lPass').value);
  $('#login').classList.add('hide');initVenta();marcarModo();render();
 }catch(err){$('#loginErr').textContent='No pudimos entrar: '+(err.message||err);}
 b.disabled=false;b.textContent='Entrar';
});
$('#logout').addEventListener('click',()=>DB.logout());
boot();
