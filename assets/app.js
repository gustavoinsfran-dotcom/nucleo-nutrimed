/* ============ HELPERS ============ */
const $=s=>document.querySelector(s);
const money=v=>'$ '+Math.round(v||0).toLocaleString('es-AR');
const moneyK=(v,seco)=>{const p=seco?'':'$ ';return v>=1e6?p+(v/1e6).toFixed(1)+'M':v>=1000?p+Math.round(v/1000)+'k':p+Math.round(v);};
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const hoy=()=>new Date().toISOString().slice(0,10);
const fmtF=f=>f?String(f).split('-').reverse().join('/'):'—';
const AÑO=new Date().getFullYear();
let MES=new Date().getMonth();

const ventasMes=m=>VENTAS.filter(v=>v.m===m);
const fact=a=>a.reduce((x,v)=>x+v.u*v.pu,0);
const unid=a=>a.reduce((x,v)=>x+v.u,0);
const serieFact=()=>MESES.map((_,i)=>fact(ventasMes(i)));
const hastaMes=()=>Math.max(MES,...VENTAS.map(v=>v.m),0);
const serieCat=c=>MESES.map((_,i)=>fact(ventasMes(i).filter(v=>P(v.p)&&P(v.p).cat===c)));
const stockDe=id=>LOTES.filter(l=>l.p===id).reduce((a,l)=>a+l.u,0);
const diasA=f=>Math.round((new Date(f+'T12:00:00')-new Date())/864e5);
const nivelVto=d=>d<0?['crit','Vencido']:d<=60?['crit','Crítico']:d<=90?['ser','Urgente']:d<=180?['warn','Vigilar']:['good','OK'];
const CATC={'SNO':'var(--s1)','Sonda':'var(--s2)','Módulos':'var(--s3)'};
const MIN_STOCK=50;
const TACTIL=matchMedia('(hover:none)').matches;
const costoDe=id=>{const p=P(id);return p?(p.costo||0):0;};
const precioDe=id=>{const p=P(id);return p?(p.p||0):0;};
const valorLote=l=>l.u*costoDe(l.p);
const valorVentaLote=l=>l.u*precioDe(l.p);
const esOnline=v=>v.o==='Ecommerce';
const ventasCanal=(m,online)=>ventasMes(m).filter(v=>esOnline(v)===online);
const vendidoUlt3=id=>{const m=[MES,MES-1,MES-2].filter(x=>x>=0);
 return VENTAS.filter(v=>v.p===id&&m.includes(v.m)).reduce((a,v)=>a+v.u,0)/Math.max(1,m.length);};

const ICO={
 'SNO':'M7 8h10l-1 12H8L7 8Z M9 8V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3',
 'Sonda':'M7 8h10l-1 12H8L7 8Z M12 4v4 M9 5h6',
 'Módulos':'M5 7h14v13H5z M5 7l2-3h10l2 3 M9 11h6'};
const imgProd=p=>`<img src="assets/productos/${p.id}.png" alt="" class="pimg" loading="lazy"
 onerror="this.replaceWith(Object.assign(document.createElement('span'),{className:'pico',innerHTML:'<svg viewBox=\\'0 0 24 24\\' fill=\\'none\\' stroke=\\'currentColor\\' stroke-width=\\'1.4\\' stroke-linecap=\\'round\\' stroke-linejoin=\\'round\\'><path d=\\'${ICO[p.cat]}\\'/></svg>'}))">`;

/* tooltip */
const tip=$('#tip');
function showTip(e,html){tip.innerHTML=html;tip.style.opacity=1;moveTip(e);}
function moveTip(e){const r=tip.getBoundingClientRect();let x=e.clientX+14,y=e.clientY-10;
 if(x+r.width>innerWidth-8)x=e.clientX-r.width-14; if(y+r.height>innerHeight-8)y=innerHeight-r.height-8;
 tip.style.left=x+'px';tip.style.top=Math.max(8,y)+'px';}
function hideTip(){tip.style.opacity=0;}
function toast(msg,tipo){const t=document.createElement('div');t.className='toast '+(tipo||'');t.textContent=msg;
 document.body.appendChild(t);setTimeout(()=>t.classList.add('on'),10);
 setTimeout(()=>{t.classList.remove('on');setTimeout(()=>t.remove(),300);},4200);}

/* ============ MODAL GENÉRICO ============ */
function modal({titulo,campos,ok='Guardar',onOk,ancho}){
 const d=$('#dlg');
 d.innerHTML=`<div class="dlg-h"><b>${esc(titulo)}</b></div>
  <div class="dlg-b">${campos.map(c=>campoHTML(c)).join('')}</div>
  <div class="dlg-f"><button class="btn" data-x="c">Cancelar</button><button class="btn pri" data-x="k">${esc(ok)}</button></div>`;
 if(ancho)d.style.maxWidth=ancho;
 d.showModal();
 d.querySelector('[data-x="c"]').onclick=()=>d.close();
 d.querySelector('[data-x="k"]').onclick=async()=>{
  const val={},faltan=[];
  campos.forEach(c=>{
   if(c.t==='sep')return;
   const el=d.querySelector('#f_'+c.k);
   let v=c.t==='check'?el.checked:el.value;
   if(c.t==='number')v=v===''?null:+v;
   if(c.req&&(v===''||v==null))faltan.push(c.l);
   val[c.k]=v;
  });
  if(faltan.length){toast('Falta completar: '+faltan.join(', '),'err');return;}
  try{await onOk(val);d.close();}catch(e){toast(e.message||String(e),'err');}
 };
}
function campoHTML(c){
 if(c.t==='sep')return `<p class="fsep">${esc(c.l)}</p>`;
 const w=c.half?'half':'';
 let inner;
 if(c.t==='select')inner=`<select id="f_${c.k}">${c.opts.map(o=>{
   const v=typeof o==='object'?o.v:o,t=typeof o==='object'?o.t:o;
   return `<option value="${esc(v)}"${String(c.val)===String(v)?' selected':''}>${esc(t)}</option>`}).join('')}</select>`;
 else if(c.t==='area')inner=`<textarea id="f_${c.k}" rows="3" placeholder="${esc(c.ph||'')}">${esc(c.val||'')}</textarea>`;
 else if(c.t==='check')inner=`<label class="chk"><input type="checkbox" id="f_${c.k}"${c.val?' checked':''}> <span>${esc(c.ph||'')}</span></label>`;
 else inner=`<input type="${c.t||'text'}" id="f_${c.k}" value="${esc(c.val==null?'':c.val)}" placeholder="${esc(c.ph||'')}">`;
 return `<div class="fld ${w}">${c.t==='check'?'':`<label>${esc(c.l)}${c.req?' *':''}</label>`}${inner}
  ${c.hint?`<p class="hint">${esc(c.hint)}</p>`:''}</div>`;
}

/* ============ GRÁFICOS ============ */
/* en pantallas angostas el lienzo se achica: así el texto del gráfico
   no queda microscópico al escalar el SVG al ancho de la tarjeta */
const chico=()=>innerWidth<760;
function lineChart(vals,labels){
 const ch=chico();
 const W=ch?370:760,H=ch?210:230,ml=ch?38:54,mr=ch?18:14,mt=14,mb=ch?24:26,FS=ch?11:10.5;
 const max=Math.max(...vals)*1.15||1,iw=W-ml-mr,ih=H-mt-mb;
 const x=i=>ml+(iw*i)/Math.max(1,vals.length-1),y=v=>mt+ih-(v/max)*ih;
 const pts=vals.map((v,i)=>[x(i),y(v)]);
 const d=pts.map((p,i)=>(i?'L':'M')+p[0].toFixed(1)+' '+p[1].toFixed(1)).join(' ');
 const area=d+` L${x(vals.length-1).toFixed(1)} ${mt+ih} L${ml} ${mt+ih} Z`;
 let t='';for(let k=0;k<=3;k++){const v=max*k/3,yy=y(v);
  t+=`<line x1="${ml}" x2="${W-mr}" y1="${yy}" y2="${yy}" stroke="var(--grid)"/><text x="${ml-8}" y="${yy+4}" text-anchor="end" fill="var(--ink-3)" font-size="${FS}">${moneyK(v,ch)}</text>`;}
 const xl=labels.map((l,i)=>`<text x="${x(i)}" y="${H-7}" text-anchor="middle" fill="var(--ink-3)" font-size="${FS}">${l}</text>`).join('');
 const hot=vals.map((v,i)=>`<rect x="${x(i)-iw/(2*Math.max(1,vals.length-1))}" y="${mt}" width="${iw/Math.max(1,vals.length-1)}" height="${ih}" fill="transparent" data-i="${i}"/>`).join('');
 return `<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto" class="lc">
  <defs><linearGradient id="lg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="var(--s1)" stop-opacity=".18"/><stop offset="100%" stop-color="var(--s1)" stop-opacity="0"/></linearGradient></defs>
  ${t}<path d="${area}" fill="url(#lg)"/><path d="${d}" fill="none" stroke="var(--s1)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
  ${pts.map(p=>`<circle cx="${p[0]}" cy="${p[1]}" r="${ch?3.5:4}" fill="var(--surface)" stroke="var(--s1)" stroke-width="2"/>`).join('')}
  <line id="ch" x1="0" x2="0" y1="${mt}" y2="${mt+ih}" stroke="var(--axis)" stroke-dasharray="3 3" opacity="0"/>${xl}${hot}</svg>`;
}
function bindLine(root,labels,extra){
 const svg=root&&root.querySelector('.lc'); if(!svg)return;
 const ch=svg.querySelector('#ch');
 svg.querySelectorAll('rect[data-i]').forEach(r=>{
  const ver=e=>{const i=+r.dataset.i,cx=+r.getAttribute('x')+ +r.getAttribute('width')/2;
   ch.setAttribute('x1',cx);ch.setAttribute('x2',cx);ch.setAttribute('opacity','1');
   showTip(e,`<b>${labels[i]} ${AÑO}</b>${extra(i)}`);};
  const salir=()=>{ch.setAttribute('opacity','0');hideTip();};
  r.addEventListener('mousemove',ver);
  r.addEventListener('mouseleave',salir);
  /* en el celular se toca el gráfico */
  r.addEventListener('touchstart',e=>{const t=e.touches[0];
   ver({clientX:t.clientX,clientY:t.clientY});},{passive:true});
  r.addEventListener('touchend',salir,{passive:true});});
}
function stackChart(cats,meses){
 const ch=chico();
 const W=ch?370:760,H=ch?200:210,ml=ch?38:54,mr=ch?18:14,mt=12,mb=ch?24:26,FS=ch?11:10.5,n=meses.length;
 const series=cats.map(c=>meses.map(m=>fact(ventasMes(m).filter(v=>P(v.p)&&P(v.p).cat===c))));
 const tot=meses.map((_,i)=>series.reduce((a,s)=>a+s[i],0));
 const max=Math.max(...tot)*1.12||1,iw=W-ml-mr,ih=H-mt-mb,bw=Math.min(ch?26:46,iw/n-(ch?8:14));
 let g='';for(let k=0;k<=3;k++){const yy=mt+ih-(ih*k/3);
  g+=`<line x1="${ml}" x2="${W-mr}" y1="${yy}" y2="${yy}" stroke="var(--grid)"/><text x="${ml-8}" y="${yy+4}" text-anchor="end" fill="var(--ink-3)" font-size="${FS}">${moneyK(max*k/3,ch)}</text>`;}
 let bars='';
 meses.forEach((m,i)=>{const cx=ml+(iw*(i+.5))/n-bw/2;let acc=0;
  cats.forEach((c,ci)=>{const v=series[ci][i];if(v<=0)return;
   const h=(v/max)*ih,yy=mt+ih-((acc+v)/max)*ih;acc+=v;
   bars+=`<rect x="${cx}" y="${yy+1}" width="${bw}" height="${Math.max(0,h-2)}" rx="3" fill="${CATC[c]}" data-m="${m}" data-c="${ci}"/>`;});
  bars+=`<text x="${cx+bw/2}" y="${H-7}" text-anchor="middle" fill="var(--ink-3)" font-size="${FS}">${MESES[m]}</text>`;});
 return `<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto" class="sc">${g}${bars}</svg>`;
}
function barsH(rows,color){
 if(!rows.length)return '<p class="mini">Sin datos todavía.</p>';
 const max=Math.max(...rows.map(r=>r.v))||1;
 return rows.map(r=>`<div style="margin-bottom:11px">
  <div style="display:flex;justify-content:space-between;gap:10px;font-size:12.5px;margin-bottom:4px">
   <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(r.n)}</span>
   <b style="font-variant-numeric:tabular-nums;white-space:nowrap">${r.t}</b></div>
  <div class="bar"><i style="width:${(r.v/max*100).toFixed(1)}%;background:${color||'var(--s1)'}"></i></div></div>`).join('');
}
/* tabla que en el celular se convierte en tarjetas */
function tbl(cols,filas){
 return `<div class="tw"><table><thead><tr>${cols.map(c=>`<th${c.n?' class="num"':''}>${esc(c.t)}</th>`).join('')}</tr></thead>
 <tbody>${filas.map(f=>`<tr>${f.map((c,i)=>{const k=[cols[i].n?'num':'',i===0?'tit':''].filter(Boolean).join(' ');
  return `<td${k?` class="${k}"`:''} data-l="${esc(cols[i].t)}">${c}</td>`;}).join('')}</tr>`).join('')}</tbody></table></div>`;
}
function vacio(txt,btn){
 return `<div class="empty"><p>${txt}</p>${btn?`<button class="btn pri" onclick="${btn.fn}">${esc(btn.t)}</button>`:''}</div>`;
}

/* ============ ALTAS ============ */
function nuevaCuenta(id){
 const c=id?C(id):null;
 modal({titulo:c?'Editar cuenta':'Nueva institución o cliente',ok:c?'Guardar cambios':'Dar de alta',campos:[
  {k:'n',l:'Nombre o razón social',req:true,val:c?.n,ph:'Hospital, sanatorio, farmacia, droguería o profesional'},
  {k:'t',l:'Tipo',t:'select',opts:TIPOS_CUENTA,val:c?.t,half:true},
  {k:'z',l:'Zona',val:c?.z,ph:'CABA, GBA Norte…',half:true},
  {k:'e',l:'Estado',t:'select',opts:ESTADOS,val:c?.e||'Prospecto',half:true},
  {k:'ref',l:'Referente',val:c?.ref,ph:'Nombre y apellido',half:true},
  {k:'tel',l:'Teléfono',val:c?.tel,half:true},
  {k:'mail',l:'Email',t:'email',val:c?.mail,half:true},
  {k:'notas',l:'Notas',t:'area',val:c?.notas,ph:'Servicio, condición comercial, quién la abrió…'}],
  onOk:async v=>{
   if(c){await DB.updCuenta(id,v);toast('Cuenta actualizada.');}
   else{await DB.addCuenta({...v,desde:''});toast('Cuenta dada de alta.');}
   render();}});
}
function nuevoContacto(){
 modal({titulo:'Nuevo contacto',ok:'Dar de alta',campos:[
  {k:'n',l:'Nombre y apellido',req:true},
  {k:'r',l:'Rol',val:'Nutricionista',ph:'Nutricionista, médico, geriatra…',half:true},
  {k:'i',l:'Institución',half:true},
  {k:'mail',l:'Email',t:'email',half:true},
  {k:'tel',l:'Teléfono',half:true},
  {k:'o',l:'Origen',req:true,ph:'Jornada, universidad, sorteo, visita…',half:true},
  {k:'cta',l:'Cuenta vinculada',t:'select',opts:[{v:'',t:'Sin vincular'},...CUENTAS.map(c=>({v:c.id,t:c.n}))],half:true},
  {k:'f',l:'Fecha de alta',t:'date',val:hoy(),half:true},
  {k:'cons',l:'',t:'check',ph:'Dio consentimiento para recibir comunicaciones (Ley 25.326)'}],
  onOk:async v=>{await DB.addContacto({...v,cta:v.cta?+v.cta:null});toast('Contacto agregado.');render();}});
}
function nuevaAccion(){
 modal({titulo:'Nueva acción de marketing',ok:'Dar de alta',campos:[
  {k:'n',l:'Nombre de la acción',req:true,ph:'Jornada, capacitación, sorteo, muestreo…'},
  {k:'t',l:'Tipo',t:'select',opts:TIPOS_ACCION,half:true},
  {k:'f',l:'Fecha',t:'date',val:hoy(),req:true,half:true},
  {k:'inv',l:'Inversión',t:'number',val:0,half:true},
  {k:'est',l:'Estado',t:'select',opts:['En curso','Cerrada','Permanente'],half:true},
  {k:'cont',l:'Contactos generados',t:'number',val:0,half:true},
  {k:'cta',l:'Cuentas abiertas',t:'number',val:0,half:true}],
  onOk:async v=>{await DB.addAccion({...v,vta:0});toast('Acción registrada.');render();}});
}
function nuevoLote(){
 if(!PROD.length)return;
 modal({titulo:'Cargar lote a mano',ok:'Guardar',campos:[
  {k:'p',l:'Producto',t:'select',opts:PROD.map(p=>({v:p.id,t:p.n+' · '+p.pres})),req:true},
  {k:'l',l:'Número de lote',req:true,half:true},
  {k:'u',l:'Unidades',t:'number',val:0,req:true,half:true},
  {k:'v',l:'Vencimiento',t:'date',req:true,half:true}],
  onOk:async v=>{await DB.addLote({p:v.p,l:v.l,u:+v.u,v:v.v});toast('Lote cargado.');render();}});
}
function nuevaVenta(){
 if(!CUENTAS.length){toast('Primero cargá al menos una cuenta.','err');return nuevaCuenta();}
 const prods=PROD.map(p=>({v:p.id,t:p.n+' · '+p.pres}));
 modal({titulo:'Cargar venta',ok:'Guardar venta',campos:[
  {k:'c',l:'Cuenta',t:'select',opts:CUENTAS.map(c=>({v:c.id,t:c.n})),req:true},
  {k:'p',l:'Producto',t:'select',opts:prods,req:true},
  {k:'u',l:'Unidades',t:'number',val:1,req:true,half:true},
  {k:'pu',l:'Precio unitario',t:'number',val:PROD[0]?.p||0,req:true,half:true},
  {k:'f',l:'Fecha',t:'date',val:hoy(),req:true,half:true},
  {k:'o',l:'Origen',t:'select',opts:ORIGENES_VENTA,half:true}],
  onOk:async v=>{
   await DB.addVenta({f:v.f,m:+v.f.split('-')[1]-1,c:+v.c,p:v.p,u:+v.u,pu:+v.pu,o:v.o});
   MES=+v.f.split('-')[1]-1;$('#periodo').value=MES;toast('Venta cargada.');render();}});
 const sel=$('#f_p'),pu=$('#f_pu');
 const sync=()=>{const p=P(sel.value);if(p&&p.p)pu.value=p.p;};
 sel.addEventListener('change',sync);sync();
}
function editarPrecio(sku){
 const p=P(sku);
 modal({titulo:p.n,ok:'Guardar',campos:[
  {k:'p',l:'Precio de lista por '+p.pres,t:'number',val:p.p,req:true},
  {k:'costo',l:'Costo unitario',t:'number',val:p.costo||'',
   hint:'Es el valor con el que se calcula el stock valorizado. Lo trae solo el archivo de ventas del sistema (columna CostoUnit); si este producto todavía no tuvo ventas, cargalo acá.'}],
  onOk:async v=>{await DB.setPrecio(sku,+v.p,v.costo===''?undefined:+v.costo);toast('Producto actualizado.');render();}});
}
function configSheet(){
 modal({titulo:'Conectar la planilla de logística',ok:'Guardar y sincronizar',ancho:'560px',campos:[
  {k:'url',l:'Enlace de la planilla',val:CFG_SHEET.url,ph:'https://docs.google.com/spreadsheets/d/…',
   hint:'En Google Sheets: Compartir → Acceso general → Cualquiera con el enlace → Lector.'},
  {k:'hoja',l:'Nombre de la hoja',val:CFG_SHEET.hoja,ph:'Stock',hint:'Dejalo vacío si es la primera hoja.'},
  {k:'auto',l:'',t:'check',val:CFG_SHEET.auto,ph:'Sincronizar automáticamente al abrir el sitio'}],
  onOk:async v=>{Object.assign(CFG_SHEET,v);DB.guardarLocal();await sincronizar();}});
}
async function sincronizar(){
 if(!CFG_SHEET.url){configSheet();return;}
 toast('Leyendo la planilla de logística…');
 try{
  const r=await SHEET.sincronizar();
  toast(`Stock actualizado: ${r.lotes} lotes, ${r.unidades} unidades.`,'ok');
  if(r.sinReconocer.length)toast('No reconocí: '+r.sinReconocer.slice(0,3).join(' · '),'err');
  render();
 }catch(e){toast(e.message,'err');}
}


function configTienda(){
 modal({titulo:'Conectar la tienda online',ok:'Guardar y traer pedidos',ancho:'580px',campos:[
  {k:'url',l:'Enlace de la hoja de pedidos',val:CFG_TIENDA.url,ph:'https://docs.google.com/spreadsheets/d/…',
   hint:'La hoja la alimenta Tienda Nube. Compartila como "Cualquiera con el enlace · Lector".'},
  {k:'hoja',l:'Nombre de la hoja',val:CFG_TIENDA.hoja,ph:'Pedidos',hint:'Vacío si es la primera hoja.'},
  {k:'cuenta',l:'Cuenta que factura la venta online',val:CFG_TIENDA.cuenta,req:true,
   hint:'El eslabón de la cadena de comercialización. Cada pedido se registra como venta a esta cuenta.'},
  {k:'auto',l:'',t:'check',val:CFG_TIENDA.auto,ph:'Traer pedidos automáticamente al abrir el sitio'}],
  onOk:async v=>{Object.assign(CFG_TIENDA,v);DB.guardarLocal();await sincronizarTienda();}});
}
async function sincronizarTienda(){
 if(!CFG_TIENDA.url){configTienda();return;}
 toast('Leyendo pedidos de la tienda…');
 try{
  const r=await TIENDA.sincronizar();
  toast(r.nuevos?`${r.nuevos} pedido(s) nuevo(s) cargados a ${r.cuenta}.`:'Sin pedidos nuevos.','ok');
  if(r.sinReconocer.length)toast('No reconocí: '+r.sinReconocer.slice(0,3).join(' · '),'err');
  render();
 }catch(e){toast(e.message,'err');}
}

/* ============ VISTAS ============ */
const V={};

V.panel=()=>{
 if(!VENTAS.length&&!CUENTAS.length&&!LOTES.length)return V.arranque();
 const vm=ventasMes(MES),vp=ventasMes(MES-1);
 const f=fact(vm),fp=fact(vp),d=fp?((f-fp)/fp*100):null;
 const cl=new Set(vm.map(v=>v.c)).size,clp=new Set(vp.map(v=>v.c)).size;
 const top=Object.values(vm.reduce((a,v)=>{(a[v.p]=a[v.p]||{n:P(v.p)?.n||v.p,v:0});a[v.p].v+=v.u*v.pu;return a;},{}))
  .sort((a,b)=>b.v-a.v).slice(0,6).map(r=>({n:r.n,v:r.v,t:money(r.v)}));
 const alertas=LOTES.map(l=>({l,d:diasA(l.v)})).filter(x=>x.d<=180).sort((a,b)=>a.d-b.d);
 const quiebre=PROD.filter(p=>LOTES.some(l=>l.p===p.id)&&stockDe(p.id)<MIN_STOCK);
 const conVenta=MESES.map((_,i)=>i).filter(i=>ventasMes(i).length);
 const meses=conVenta.length?conVenta:[MES];
 return `
 <div class="grid g4" style="margin-bottom:16px">
  <div class="card tile"><div class="lbl">Facturación ${MESES[MES]}</div><div class="val">${money(f)}</div>
   <div class="dlt">${d==null?'sin mes previo cargado':`<span class="${d>=0?'up':'dn'}">${d>=0?'▲':'▼'} ${Math.abs(d).toFixed(0)}%</span> vs ${MESES[MES-1]||'—'}`}</div></div>
  <div class="card tile"><div class="lbl">Unidades</div><div class="val">${unid(vm).toLocaleString('es-AR')}</div>
   <div class="dlt">${vm.length} operaciones${unid(vm)?' · ticket '+money(f/unid(vm)):''}</div></div>
  <div class="card tile"><div class="lbl">Cuentas que compraron</div><div class="val">${cl}</div>
   <div class="dlt">${clp?`<span class="${cl>=clp?'up':'dn'}">${cl>=clp?'▲':'▼'} ${Math.abs(cl-clp)}</span> vs ${MESES[MES-1]}`:CUENTAS.length+' en cartera'}</div></div>
  <div class="card tile"><div class="lbl">Alertas abiertas</div><div class="val" style="color:var(--critical)">${alertas.filter(a=>a.d<=90).length+quiebre.length}</div>
   <div class="dlt">vencimientos + quiebres de stock</div></div>
 </div>
 <div class="grid g23" style="margin-bottom:16px">
  <div class="card"><h3>Evolución de facturación</h3><p class="sub">${AÑO} · ${TACTIL?'tocá el gráfico para ver cada mes':'pasá el mouse por el gráfico'}</p>
   <div id="lcw">${VENTAS.length?lineChart(serieFact().slice(0,hastaMes()+1),MESES.slice(0,hastaMes()+1)):vacio('Todavía no hay ventas cargadas.',{t:'+ Cargar la primera venta',fn:'nuevaVenta()'})}</div></div>
  <div class="card"><h3>Estado de la cartera</h3><p class="sub">${CUENTAS.length} cuenta${CUENTAS.length===1?'':'s'} en seguimiento</p>
   ${CUENTAS.length?barsH(ESTADOS.map(e=>({n:e,v:CUENTAS.filter(c=>c.e===e).length,t:CUENTAS.filter(c=>c.e===e).length+''})).filter(r=>r.v),'var(--s1)'):
    vacio('Sin cuentas cargadas.',{t:'+ Nueva institución',fn:'nuevaCuenta()'})}</div>
 </div>
 <div class="grid g23" style="margin-bottom:16px">
  <div class="card"><h3>Mix por línea</h3><p class="sub">Facturación mensual por categoría</p>
   <div id="scw">${VENTAS.length?stackChart(['SNO','Sonda','Módulos'],meses):vacio('Sin ventas para comparar.')}</div>
   ${VENTAS.length?`<div class="legend"><span><i style="background:var(--s1)"></i>SNO (oral)</span><span><i style="background:var(--s2)"></i>Sonda</span><span><i style="background:var(--s3)"></i>Módulos</span></div>`:''}</div>
  <div class="card"><h3>Top productos — ${MESES[MES]}</h3><p class="sub">Por facturación</p>${barsH(top,'var(--s1)')}</div>
 </div>
 <div class="grid g2">
  <div class="card"><h3>Alertas de vencimiento</h3><p class="sub">Lotes a menos de 180 días · criterio FEFO</p>
   ${alertas.length?alertas.slice(0,5).map(a=>{const[n,t]=nivelVto(a.d);
    return `<div class="alert a-${n}"><span class="ic">${n==='crit'?'⛔':n==='ser'?'⚠':'◔'}</span><div>
     <b>${esc(P(a.l.p)?.n||a.l.p)}</b><p>Lote ${esc(a.l.l)} · ${a.l.u} u. · vence ${fmtF(a.l.v)} — <b>${a.d} días</b> · ${t}</p></div></div>`}).join('')
    :vacio('Sin stock cargado. Conectá la planilla de logística y aparece solo.',{t:'Conectar planilla',fn:'configSheet()'})}</div>
  <div class="card"><h3>Canales</h3><p class="sub">De dónde viene la facturación de ${MESES[MES]}</p>
   ${(()=>{const ins=fact(ventasCanal(MES,false)),onl=fact(ventasCanal(MES,true));
    if(!ins&&!onl)return vacio('Sin ventas en el mes.');
    return barsH([{n:'Institucional y farmacias',v:ins,t:money(ins)},{n:'Tienda online',v:onl,t:money(onl)}],'var(--s1)')
     +`<p class="src">${onl?`La tienda representa el ${(onl/(ins+onl)*100).toFixed(0)}% del mes.`:'La tienda todavía no registró pedidos.'}</p>`;})()}
  </div>
 </div>
 <div class="grid g2" style="margin-top:16px">
  <div class="card"><h3>Marketing → venta</h3><p class="sub">Acciones y lo que generaron</p>
   ${ACCIONES.length?ACCIONES.slice(0,5).map(a=>`<div class="rowline">
     <div><b>${esc(a.n)}</b><div class="mini">${a.cont} contactos · ${a.cta} cuentas abiertas</div></div>
     <div style="text-align:right;white-space:nowrap"><b>${a.vta} ventas</b><div class="mini">${a.inv?money(a.inv):'sin costo'}</div></div></div>`).join('')
    :vacio('Sin acciones registradas.',{t:'+ Nueva acción',fn:'nuevaAccion()'})}</div>
 </div>`;
};

V.arranque=()=>{
 const conPrecio=PROD.filter(p=>p.p>0).length;
 const pasos=[
  {ok:conPrecio>0,t:'Cargar los precios de lista',d:`${conPrecio} de ${PROD.length} productos tienen precio.`,b:'Ir al catálogo',f:"ir('catalogo')"},
  {ok:CUENTAS.length>0,t:'Dar de alta las instituciones',d:'Hospitales, sanatorios, farmacias, droguerías y profesionales.',b:'+ Nueva institución',f:'nuevaCuenta()'},
  {ok:!!CFG_SHEET.url,t:'Conectar la planilla de logística',d:'El stock y los vencimientos se leen solos desde Google Sheets.',b:'Conectar planilla',f:'configSheet()'},
  {ok:VENTAS.length>0,t:'Cargar la primera venta',d:'Desde ahí el panel empieza a mostrar la evolución del mes.',b:'+ Cargar venta',f:'nuevaVenta()'}];
 return `<div class="card" style="margin-bottom:16px">
  <p class="kicker">Puesta en marcha</p>
  <h2 style="margin:0 0 6px;font-size:22px;font-weight:800">El sistema arranca <em style="font-style:normal;color:var(--verde)">vacío</em></h2>
  <p style="color:var(--gris);max-width:640px;margin:0 0 4px">Acá no hay ningún dato de ejemplo: lo único cargado es el catálogo de productos de la línea Bi¹.
  Todo lo demás lo carga el equipo o entra desde la planilla de logística.</p>
  </div>
  <div class="grid g2">${pasos.map((p,i)=>`<div class="card paso ${p.ok?'ok':''}">
   <div class="pnum">${p.ok?'✓':i+1}</div>
   <div><b>${p.t}</b><p>${p.d}</p><button class="btn ${p.ok?'':'pri'}" onclick="${p.f}">${p.b}</button></div></div>`).join('')}</div>`;
};

V.ventas=()=>{
 const vm=ventasMes(MES).slice().sort((a,b)=>b.f.localeCompare(a.f));
 return `<div class="card">
  <div class="chead"><div><h3>Ventas de ${MESES[MES]} ${AÑO}</h3>
   <p class="sub">${vm.length} operaciones · ${money(fact(vm))}</p></div>
   <div class="btnrow">
   <button class="btn" onclick="$('#xlsVentas').click()">↥ Subir ventas del sistema</button>
   <button class="btn pri" onclick="nuevaVenta()">+ Cargar venta</button></div></div>
  ${vm.length?tbl(
   [{t:'Fecha'},{t:'Cuenta'},{t:'Producto'},{t:'Unid.',n:1},{t:'Total',n:1},{t:'Origen'}],
   vm.map(v=>[fmtF(v.f),`<b>${esc(C(v.c)?.n||'—')}</b>`,
    `${esc(P(v.p)?.n||v.p)}<div class="mini">${esc(P(v.p)?.pres||'')}</div>`,
    v.u,money(v.u*v.pu),`<span class="tag">${esc(v.o)}</span>`]))
  :vacio('No hay ventas cargadas en '+MESES[MES]+'.',{t:'+ Cargar venta',fn:'nuevaVenta()'})}
 </div>`;
};

V.cuentas=()=>{
 const emb=ESTADOS.filter(e=>e!=='Dormida');
 const col=['#6FC5E6','#43B0DC','#2BA4D9','#2490C0','#1E7CA6','#175E80'];
 const dorm=CUENTAS.filter(c=>c.e==='Dormida').length;
 return `<div class="card" style="margin-bottom:16px">
  <div class="chead"><div><h3>Embudo comercial</h3><p class="sub">Dónde está parada cada cuenta hoy</p></div>
   <button class="btn pri" onclick="nuevaCuenta()">+ Nueva institución</button></div>
  ${CUENTAS.length?`<div class="stage">${emb.map((e,i)=>{const n=CUENTAS.filter(c=>c.e===e).length;
   return `<div style="flex:${Math.max(1,n)};background:${col[i]};color:${i<2?'#0C1A2B':'#fff'}">${n}<small>${e}</small></div>`}).join('')}</div>
   ${dorm?`<p class="mini" style="margin-top:10px">${dorm} cuenta(s) dormida(s): compraron y llevan más de 60 días sin recomprar. Es la lista de recuperación del mes.</p>`:''}`
   :vacio('Todavía no hay cuentas. Empezá por las instituciones con las que ya venís caminando.',{t:'+ Nueva institución',fn:'nuevaCuenta()'})}
 </div>
 ${CUENTAS.length?`<div class="card"><h3>Cuentas</h3><p class="sub">Instituciones, farmacias, distribuidores y profesionales</p>
 ${tbl([{t:'Cuenta'},{t:'Tipo'},{t:'Zona'},{t:'Referente'},{t:'Estado'},{t:'Facturado '+AÑO,n:1},{t:'Últ. compra',n:1},{t:''}],
  CUENTAS.map(c=>{const vs=VENTAS.filter(v=>v.c===c.id);
   const ult=vs.length?MESES[Math.max(...vs.map(v=>v.m))]:'—';
   const st=['Activa','Recurrente'].includes(c.e)?'t-good':c.e==='Dormida'?'t-crit':c.e==='Prospecto'?'':'t-warn';
   return [`<b>${esc(c.n)}</b>${c.mail?`<div class="mini">${esc(c.mail)}</div>`:''}`,esc(c.t),esc(c.z),
    `${esc(c.ref||'—')}${c.tel?`<div class="mini">${esc(c.tel)}</div>`:''}`,
    `<span class="tag ${st}"><span class="d"></span>${esc(c.e)}</span>`,
    vs.length?money(fact(vs)):'—',ult,
    `<button class="linkbtn" onclick="nuevaCuenta(${c.id})">editar</button>`];}))}
 </div>`:''}`;
};

V.catalogo=()=>{
 const sinPrecio=PROD.filter(p=>!p.p).length;
 return `<div class="card" style="margin-bottom:16px">
  <div class="chead"><div><h3>Catálogo — línea Bi¹</h3>
   <p class="sub">${PROD.length} productos · ${PROD.length-sinPrecio} con precio cargado</p></div></div>
  ${sinPrecio?`<div class="demo">Faltan precios en ${sinPrecio} productos. Tocá cualquiera para cargarlo: el precio se usa como valor por defecto al cargar una venta.</div>`:''}
  ${[...new Set(PROD.map(p=>p.sub))].map(sub=>`
   <p class="catsub">${esc(sub)}</p>
   <div class="cat">${PROD.filter(p=>p.sub===sub).map(p=>{
    const st=stockDe(p.id),rot=vendidoUlt3(p.id);
    const cob=rot?st/rot:null;
    return `<div class="pcard" onclick="editarPrecio('${p.id}')" title="Tocá para cargar el precio">
     <div class="pth">${imgProd(p)}</div>
     <div class="pbody">
      <b>${esc(p.n)}</b>
      <span class="pdesc">${esc(p.d||'')}</span>
      <div class="mini">${esc(p.pres)}</div>
      <div class="prow"><span>${p.p?money(p.p):'<i class="falta">sin precio</i>'}</span>
       <span class="mini">${st?st+' u.':'sin stock'}${cob!==null?` · ${cob.toFixed(1)} m`:''}</span></div>
      ${p.costo?`<div class="pcosto">Costo ${money(p.costo)}${p.p>p.costo?` · margen ${((1-p.costo/p.p)*100).toFixed(0)}%`:''}</div>`:''}
     </div></div>`}).join('')}</div>`).join('')}
  <p class="src">Las fotos van en <code>assets/productos/</code> con el nombre del SKU (por ejemplo <code>SNO-ONCO-300.png</code>). Los ocho orales ya tienen la suya, tomada del vademécum; el resto muestra el ícono de la categoría hasta que lleguen los packshots.</p>
 </div>`;
};

V.tienda=()=>{
 const vm=ventasMes(MES).filter(esOnline);
 const ult=CFG_TIENDA.ultima?new Date(CFG_TIENDA.ultima):null;
 const f=fact(vm),u=unid(vm);
 const pedidos=new Set(vm.map(v=>v.ped||v.f)).size;
 const top=Object.values(vm.reduce((a,v)=>{(a[v.p]=a[v.p]||{n:P(v.p)?.n||v.p,v:0});a[v.p].v+=v.u*v.pu;return a;},{}))
  .sort((a,b)=>b.v-a.v).slice(0,6).map(r=>({n:r.n,v:r.v,t:money(r.v)}));
 const serie=MESES.slice(0,hastaMes()+1).map((_,i)=>fact(ventasCanal(i,true)));
 return `<div class="card sync" style="margin-bottom:16px">
  <div class="chead"><div><h3>Tienda online</h3>
   <p class="sub">${CFG_TIENDA.url?`Conectada${ult?' · última lectura '+ult.toLocaleString('es-AR'):''}`:'Sin conectar. Los pedidos entran desde una hoja que actualiza la tienda.'}</p></div>
   <div class="btnrow">
    <button class="btn" onclick="configTienda()">${CFG_TIENDA.url?'Cambiar enlace':'Conectar tienda'}</button>
    ${CFG_TIENDA.url?'<button class="btn pri" onclick="sincronizarTienda()">↻ Traer pedidos</button>':''}</div></div>
  <div class="cadena">
   <span>Infinity Pharma</span><i>→</i><span>${esc(CFG_TIENDA.cuenta)}</span><i>→</i><span>Paciente</span>
   <p>Cada pedido se registra como venta a ${esc(CFG_TIENDA.cuenta)}, el eslabón de la cadena de comercialización. El paciente queda como dato de envío, no como cliente facturado.</p></div>
 </div>
 ${vm.length?`
 <div class="grid g4" style="margin-bottom:16px">
  <div class="card tile"><div class="lbl">Facturación online ${MESES[MES]}</div><div class="val">${money(f)}</div><div class="dlt">${pedidos} pedido${pedidos===1?'':'s'}</div></div>
  <div class="card tile"><div class="lbl">Unidades</div><div class="val">${u}</div><div class="dlt">ticket ${money(f/Math.max(1,pedidos))}</div></div>
  <div class="card tile"><div class="lbl">Participación del canal</div><div class="val">${(f/Math.max(1,fact(ventasMes(MES)))*100).toFixed(0)}%</div><div class="dlt">del total facturado del mes</div></div>
  <div class="card tile"><div class="lbl">Productos distintos</div><div class="val">${new Set(vm.map(v=>v.p)).size}</div><div class="dlt">de ${PROD.length} del catálogo</div></div>
 </div>
 <div class="grid g23" style="margin-bottom:16px">
  <div class="card"><h3>Evolución del canal online</h3><p class="sub">${AÑO}</p>
   <div id="lct">${lineChart(serie,MESES.slice(0,hastaMes()+1))}</div></div>
  <div class="card"><h3>Lo que más se vende online</h3><p class="sub">Por facturación · ${MESES[MES]}</p>${barsH(top,'var(--s3)')}
   <p class="src">Sirve para decidir qué reponer en la tienda y qué producto empujar con contenido.</p></div>
 </div>
 <div class="card"><h3>Pedidos de ${MESES[MES]}</h3><p class="sub">${vm.length} líneas · ${money(f)}</p>
 ${tbl([{t:'Pedido'},{t:'Fecha'},{t:'Producto'},{t:'Unid.',n:1},{t:'Total',n:1}],
  vm.slice().sort((a,b)=>b.f.localeCompare(a.f)).map(v=>[
   `<b>${esc(v.ped||'—')}</b>`,fmtF(v.f),
   `${esc(P(v.p)?.n||v.p)}<div class="mini">${esc(P(v.p)?.pres||'')}</div>`,
   v.u,money(v.u*v.pu)]))}
 <p class="src">Los pedidos descuentan stock igual que una venta institucional: es el mismo depósito.</p></div>`
 :vacio('Todavía no entraron pedidos. Cuando la tienda esté publicada, se conectan acá y aparecen solos.',
   CFG_TIENDA.url?null:{t:'Conectar tienda',fn:'configTienda()'})}`;
};

V.stock=()=>{
 const rows=LOTES.map(l=>({l,d:diasA(l.v)})).sort((a,b)=>a.d-b.d);
 const valCosto=LOTES.reduce((a,l)=>a+valorLote(l),0);
 const valVenta=LOTES.reduce((a,l)=>a+valorVentaLote(l),0);
 const riesgo=rows.filter(r=>r.d<=90).reduce((a,r)=>a+valorLote(r.l),0);
 const sinValor=LOTES.filter(l=>!costoDe(l.p)).length;
 const bajo=PROD.filter(p=>LOTES.some(l=>l.p===p.id)&&stockDe(p.id)<MIN_STOCK);
 const ult=CFG_SHEET.ultima?new Date(CFG_SHEET.ultima):null;
 return `<div class="card sync" style="margin-bottom:16px">
  <div class="chead"><div><h3>Planilla de logística</h3>
   <p class="sub">${ult?`Última actualización ${ult.toLocaleString('es-AR')}${CFG_SHEET.origen==='archivo'?' · desde archivo del sistema':' · desde la planilla'}`:'Subí el archivo de stock que descargás del sistema, o conectá una planilla de Google.'}</p></div>
   <div class="btnrow">
    <button class="btn pri" onclick="$('#xlsStock').click()">↥ Subir archivo de stock</button>
    <button class="btn" onclick="configSheet()">${CFG_SHEET.url?'Cambiar enlace':'Conectar planilla'}</button>
    ${CFG_SHEET.url?'<button class="btn" onclick="sincronizar()">↻ Sincronizar</button>':''}
    <button class="btn" onclick="nuevoLote()">+ Lote a mano</button></div></div>
  <p class="mini">Del archivo del sistema toma <b>Codigo</b>, <b>Descripción</b>, <b>Stock Actual</b>, <b>Partida</b> y <b>Vencimiento</b>. Ignora las filas de totales y los depósitos en cuarentena o rechazados. El archivo se procesa en tu equipo: no se sube a ningún lado.</p>
 </div>
 ${LOTES.length?`
 <div class="grid g4" style="margin-bottom:16px">
  <div class="card tile"><div class="lbl">Valorizado a costo</div><div class="val">${money(valCosto)}</div>
   <div class="dlt">${LOTES.reduce((a,l)=>a+l.u,0).toLocaleString('es-AR')} unidades en ${LOTES.length} lotes</div></div>
  <div class="card tile"><div class="lbl">Valorizado a venta</div><div class="val">${money(valVenta)}</div>
   <div class="dlt">${valCosto?`margen potencial ${money(valVenta-valCosto)}`:'falta cargar precios'}</div></div>
  <div class="card tile"><div class="lbl">En riesgo (≤90 días)</div><div class="val" style="color:var(--critical)">${money(riesgo)}</div>
   <div class="dlt">${rows.filter(r=>r.d<=90).length} lotes por vencer · a costo</div></div>
  <div class="card tile"><div class="lbl">Productos en quiebre</div><div class="val" style="color:var(--serious)">${bajo.length}</div>
   <div class="dlt">bajo el mínimo de ${MIN_STOCK} unidades</div></div>
 </div>
 ${sinValor?`<div class="demo" style="margin-bottom:16px">${sinValor} lote(s) sin costo cargado, así que no suman al valorizado. El costo entra con el archivo de ventas del sistema (columna CostoUnit); si el producto todavía no tuvo ventas, cargalo a mano desde Catálogo.</div>`:''}
 <div class="card"><h3>Lotes</h3><p class="sub">Orden FEFO — primero el que vence antes</p>
 ${tbl([{t:'Producto'},{t:'Lote'},{t:'Unid.',n:1},{t:'Costo unit.',n:1},{t:'Valorizado',n:1},{t:'Vence'},{t:'Días',n:1},{t:'Estado'}],
  rows.map(r=>{const[n,t]=nivelVto(r.d);const c=costoDe(r.l.p);
   return [`<b>${esc(P(r.l.p)?.n||r.l.p)}</b><div class="mini">${esc(P(r.l.p)?.pres||'')}</div>`,
    esc(r.l.l),r.l.u,c?money(c):'<span class="mini">—</span>',c?money(valorLote(r.l)):'<span class="mini">—</span>',
    fmtF(r.l.v),r.d,`<span class="tag t-${n}"><span class="d"></span>${t}</span>`];}))}
 <p class="src">Al cargar una venta se descuenta del lote más próximo a vencer. El valorizado usa el costo unitario que trae el archivo de ventas del sistema; si la planilla de stock incluye su propia columna de costo o valorizado, esa manda.</p></div>`
 :vacio('Sin stock cargado todavía.',{t:'Conectar planilla de logística',fn:'configSheet()'})}`;
};

V.acciones=()=>{
 const inv=ACCIONES.reduce((a,x)=>a+(x.inv||0),0),cont=ACCIONES.reduce((a,x)=>a+(x.cont||0),0);
 const cta=ACCIONES.reduce((a,x)=>a+(x.cta||0),0),vta=ACCIONES.reduce((a,x)=>a+(x.vta||0),0);
 return `${ACCIONES.length?`<div class="grid g4" style="margin-bottom:16px">
  <div class="card tile"><div class="lbl">Inversión ${AÑO}</div><div class="val">${money(inv)}</div><div class="dlt">${ACCIONES.length} acciones</div></div>
  <div class="card tile"><div class="lbl">Contactos generados</div><div class="val">${cont}</div><div class="dlt">${cont?'costo por contacto '+money(inv/cont):'—'}</div></div>
  <div class="card tile"><div class="lbl">Cuentas abiertas</div><div class="val">${cta}</div><div class="dlt">${cont?(cta/cont*100).toFixed(1)+'% de conversión':'—'}</div></div>
  <div class="card tile"><div class="lbl">Cuentas que compraron</div><div class="val">${vta}</div><div class="dlt">${vta?'costo por cuenta '+money(inv/vta):'—'}</div></div>
 </div>`:''}
 <div class="card"><div class="chead"><div><h3>Acciones de marketing</h3>
   <p class="sub">Cada acción con su inversión y su trazabilidad hacia la venta</p></div>
   <button class="btn pri" onclick="nuevaAccion()">+ Nueva acción</button></div>
 ${ACCIONES.length?tbl(
  [{t:'Acción'},{t:'Tipo'},{t:'Fecha'},{t:'Inversión',n:1},{t:'Contactos',n:1},{t:'Cuentas',n:1},{t:'Estado'}],
  ACCIONES.map(a=>[`<b>${esc(a.n)}</b>${a.nota?`<details class="nota"><summary>ver detalle</summary><p>${esc(a.nota)}</p></details>`:''}`,
   esc(a.t),fmtF(a.f),a.inv?money(a.inv):'—',a.cont,a.cta,
   `<span class="tag ${a.est==='Cerrada'?'t-good':a.est==='En curso'?'t-warn':''}"><span class="d"></span>${esc(a.est)}</span>`]))
 +'<p class="src">Toda pieza requiere validación técnica y regulatoria antes de publicarse o imprimirse.</p>'
 :vacio('Sin acciones cargadas. Cargá las que ya hicieron: jornadas, capacitaciones, muestreos, pautas.',{t:'+ Nueva acción',fn:'nuevaAccion()'})}
 </div>`;
};

V.base=()=>{
 const orig=[...new Set(CONTACTOS.map(c=>c.o).filter(Boolean))];
 return `<div class="card" style="margin-bottom:16px">
  <div class="chead"><div><h3>Base unificada de contactos</h3>
   <p class="sub">Universidades, jornadas, clínicas y campañas en un solo lugar</p></div>
   <div class="btnrow"><button class="btn" onclick="$('#csvIn').click()">↥ Importar CSV</button>
   <button class="btn pri" onclick="nuevoContacto()">+ Nuevo contacto</button></div></div>
  ${CONTACTOS.length?`<div class="grid g4">
   <div class="card tile" style="padding:16px"><div class="lbl">Contactos</div><div class="val" style="font-size:24px">${CONTACTOS.length}</div></div>
   <div class="card tile" style="padding:16px"><div class="lbl">Vinculados a cuenta</div><div class="val" style="font-size:24px">${CONTACTOS.filter(c=>c.cta).length}</div></div>
   <div class="card tile" style="padding:16px"><div class="lbl">Con consentimiento</div><div class="val" style="font-size:24px">${CONTACTOS.filter(c=>c.cons).length}</div></div>
   <div class="card tile" style="padding:16px"><div class="lbl">Orígenes</div><div class="val" style="font-size:24px">${orig.length}</div></div>
  </div>`:''}
 </div>
 <div class="card">${CONTACTOS.length?`<h3>Contactos</h3><p class="sub">${CONTACTOS.length} registros</p>
 ${tbl([{t:'Nombre'},{t:'Rol'},{t:'Institución'},{t:'Contacto'},{t:'Origen'},{t:'Alta'},{t:'Cuenta'}],
  CONTACTOS.map(c=>[`<b>${esc(c.n)}</b>${c.cons?' <span class="tag t-good" style="padding:1px 7px">consiente</span>':''}`,
   esc(c.r),esc(c.i),`<span class="mini">${esc(c.mail||'')}${c.tel?'<br>'+esc(c.tel):''}</span>`,
   `<span class="tag">${esc(c.o)}</span>`,fmtF(c.f),
   c.cta?esc(C(c.cta)?.n||''):'<span class="mini">sin vincular</span>']))}
 <p class="src">Consentimiento y finalidad por contacto (Ley 25.326). Sin eso, la base no se puede usar para envíos.</p>`
 :vacio('La base está vacía. Cargá los contactos de las jornadas, universidades y visitas, o importá un CSV.',{t:'+ Nuevo contacto',fn:'nuevoContacto()'})}</div>`;
};

V.reportes=()=>{
 const vm=ventasMes(MES),vp=ventasMes(MES-1);
 const porCat=['SNO','Sonda','Módulos'].map(c=>({c,v:fact(vm.filter(x=>P(x.p)?.cat===c))}));
 const porCta=Object.values(vm.reduce((a,v)=>{(a[v.c]=a[v.c]||{n:C(v.c)?.n||'—',v:0});a[v.c].v+=v.u*v.pu;return a;},{})).sort((a,b)=>b.v-a.v);
 return `<div class="card" style="margin-bottom:16px"><h3>Exportar</h3><p class="sub">Para dirección comercial y casa matriz</p>
  <div class="btnrow">
   <button class="btn pri" onclick="exportVentas()">↧ Ventas del mes (.csv)</button>
   <button class="btn" onclick="window.print()">↧ Reporte ejecutivo (PDF)</button>
   <button class="btn" onclick="exportStock()">↧ Stock valorizado (.csv)</button>
   <button class="btn" onclick="exportBase()">↧ Base de contactos (.csv)</button>
   <button class="btn" onclick="exportTodo()">↧ Respaldo completo (.json)</button></div></div>
 <div class="card"><h3>Resumen — ${MESES[MES]} ${AÑO}</h3><p class="sub">Vista previa de lo que se exporta</p>
 ${vm.length?`<table style="margin-bottom:20px"><thead><tr><th>Indicador</th><th class="num">${MESES[MES]}</th><th class="num">${MESES[MES-1]||'—'}</th><th class="num">Var.</th></tr></thead><tbody>
 ${[['Facturación',fact(vm),fact(vp),money],['Unidades',unid(vm),unid(vp),v=>v.toLocaleString('es-AR')],
    ['Operaciones',vm.length,vp.length,v=>v],['Cuentas compradoras',new Set(vm.map(v=>v.c)).size,new Set(vp.map(v=>v.c)).size,v=>v]]
  .map(([k,a,b,f])=>{const d=b?((a-b)/b*100):null;
   return `<tr><td>${k}</td><td class="num">${f(a)}</td><td class="num">${b?f(b):'—'}</td>
    <td class="num">${d==null?'—':`<span class="${d>=0?'up':'dn'}">${d>=0?'+':''}${d.toFixed(0)}%</span>`}</td></tr>`}).join('')}
 </tbody></table>
 <div class="grid g2"><div><h3 style="margin-bottom:10px">Por línea</h3>${barsH(porCat.filter(x=>x.v).map(x=>({n:x.c,v:x.v,t:money(x.v)})),'var(--s1)')}</div>
 <div><h3 style="margin-bottom:10px">Por cuenta</h3>${barsH(porCta.slice(0,6).map(x=>({n:x.n,v:x.v,t:money(x.v)})),'var(--s1)')}</div></div>`
 :vacio('No hay ventas en '+MESES[MES]+' para reportar.')}</div>`;
};

/* ============ EXPORT ============ */
function dl(name,rows){
 const csv=rows.map(r=>r.map(c=>`"${String(c==null?'':c).replace(/"/g,'""')}"`).join(';')).join('\n');
 bajar(name,new Blob(['﻿'+csv],{type:'text/csv;charset=utf-8'}));
}
function bajar(name,blob){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;a.click();URL.revokeObjectURL(a.href);}
function exportVentas(){dl(`nucleo_ventas_${MESES[MES]}_${AÑO}.csv`,[['Fecha','Cuenta','Tipo','Zona','Producto','Presentacion','Categoria','Unidades','Precio unitario','Total','Origen'],
 ...ventasMes(MES).map(v=>[v.f,C(v.c)?.n,C(v.c)?.t,C(v.c)?.z,P(v.p)?.n,P(v.p)?.pres,P(v.p)?.cat,v.u,v.pu,v.u*v.pu,v.o])]);}
function exportBase(){dl('nucleo_contactos.csv',[['Nombre','Rol','Institucion','Email','Telefono','Origen','Alta','Consentimiento','Cuenta'],
 ...CONTACTOS.map(c=>[c.n,c.r,c.i,c.mail,c.tel,c.o,c.f,c.cons?'si':'no',c.cta?C(c.cta)?.n:''])]);}
function exportStock(){dl(`nucleo_stock_valorizado_${MESES[MES]}_${AÑO}.csv`,
 [['Producto','Presentacion','Categoria','Lote','Unidades','Costo unitario','Valorizado a costo','Precio de lista','Valorizado a venta','Vencimiento','Dias','Estado'],
 ...LOTES.map(l=>({l,d:diasA(l.v)})).sort((a,b)=>a.d-b.d).map(r=>{const[,t]=nivelVto(r.d);
  return [P(r.l.p)?.n||r.l.p,P(r.l.p)?.pres||'',P(r.l.p)?.cat||'',r.l.l,r.l.u,
   costoDe(r.l.p)||'',costoDe(r.l.p)?valorLote(r.l):'',precioDe(r.l.p)||'',precioDe(r.l.p)?valorVentaLote(r.l):'',
   r.l.v,r.d,t];})]);}
function exportTodo(){bajar('nucleo_respaldo.json',new Blob([DB.exportar()],{type:'application/json'}));}

/* importar contactos desde CSV */
function importarCSV(file){
 const fr=new FileReader();
 fr.onload=async()=>{
  const filas=SHEET.parseCSV(String(fr.result));
  if(filas.length<2)return toast('El archivo no tiene filas.','err');
  const h=filas[0];
  const iN=SHEET.col(h,['nombre','apellido']),iR=SHEET.col(h,['rol','profesion','cargo']),
   iI=SHEET.col(h,['institu','hospital','empresa']),iM=SHEET.col(h,['mail','correo']),
   iT=SHEET.col(h,['tel','cel','whats']),iO=SHEET.col(h,['origen','fuente','accion']);
  if(iN<0)return toast('No encontré la columna Nombre.','err');
  let n=0,nuevasCtas=0;
  for(const r of filas.slice(1)){
   const nom=String(r[iN]||'').trim(); if(!nom)continue;
   const inst=(iI>=0?String(r[iI]||'').trim():'');
   let ctaId=null;
   if(inst){
    let c=CUENTAS.find(x=>SHEET.norm(x.n)===SHEET.norm(inst));
    if(!c){c=await DB.addCuenta({n:inst,t:'Institución',z:'',ref:nom,tel:iT>=0?r[iT]:'',
      mail:iM>=0?r[iM]:'',e:'Contactada',notas:'Alta automática al importar contactos.',desde:''});nuevasCtas++;}
    ctaId=c.id;
   }
   await DB.addContacto({n:nom,r:iR>=0?r[iR]:'',i:inst,mail:iM>=0?r[iM]:'',
    tel:iT>=0?r[iT]:'',o:iO>=0?r[iO]:'Importado',f:hoy(),cta:ctaId,cons:false});
   n++;
  }
  toast(`${n} contactos importados${nuevasCtas?` · ${nuevasCtas} cuentas nuevas`:''}.`,'ok');render();
 };
 fr.readAsText(file,'utf-8');
}

/* ============ RENDER ============ */
const TIT={panel:['Panel <em>comercial</em>','Vista general de la línea'],
 ventas:['Registro de <em>ventas</em>','Carga y detalle de operaciones'],
 cuentas:['Cartera de <em>cuentas</em>','Embudo comercial e instituciones'],
 catalogo:['<em>Catálogo</em> de productos','Línea Bi¹ · precios y stock'],
 stock:['Stock y <em>vencimientos</em>','Sincronizado con logística'],
 tienda:['Tienda <em>online</em>','Canal ecommerce y su trazabilidad'],
 acciones:['Acciones de <em>marketing</em>','Trazabilidad hacia la venta'],
 base:['Base de <em>datos</em>','Contactos unificados por origen'],
 reportes:['<em>Reportes</em>','Exportación mensual']};
let VISTA='panel';
function ir(v){VISTA=v;document.querySelectorAll('.nav').forEach(b=>b.classList.toggle('on',b.dataset.v===v));
 cerrarMenu();render();window.scrollTo({top:0,behavior:'smooth'});}

function render(){
 $('#views').innerHTML=V[VISTA]();
 $('#vTitle').innerHTML=TIT[VISTA][0];
 $('#vSub').textContent=`${MESES[MES]} ${AÑO} · ${TIT[VISTA][1]}`;
 if(VISTA==='panel'&&VENTAS.length){
  const vals=serieFact();
  bindLine($('#lcw'),MESES.slice(0,hastaMes()+1),i=>{const vm=ventasMes(i);
   return `<div class="row"><span>Facturación</span><b>${money(vals[i])}</b></div>
    <div class="row"><span>Unidades</span><b>${unid(vm)}</b></div>
    <div class="row"><span>Operaciones</span><b>${vm.length}</b></div>`;});
  const cats=['SNO','Sonda','Módulos'];
  ($('#scw')||document).querySelectorAll('rect[data-m]').forEach(r=>{
   r.addEventListener('mousemove',e=>{const m=+r.dataset.m,c=cats[+r.dataset.c];
    showTip(e,`<b>${MESES[m]} · ${c}</b><div class="row"><span>Facturación</span><b>${money(fact(ventasMes(m).filter(v=>P(v.p)?.cat===c))) }</b></div>`);});
   r.addEventListener('mouseleave',hideTip);});
 }
 const a=LOTES.filter(l=>diasA(l.v)<=90).length;
 const pill=$('#pillStock');pill.textContent=a;pill.style.display=a?'':'none';
}

/* ============ ARRANQUE ============ */
function marcarModo(){
 const el=$('#modo');
 if(DB.modo==='vivo'){el.innerHTML='<span class="dot on"></span>En vivo'+(DB.user?' · '+esc(DB.user.email.split('@')[0]):'');
  el.title='Conectado a la base de datos: todos ven lo mismo.';$('#logout').classList.remove('hide');}
 else{el.innerHTML='<span class="dot"></span>Solo en este equipo';
  el.title='Los datos se guardan en este navegador. Conectá Supabase para que los vea todo el equipo.';}
}
async function boot(){
 let modo='local';
 try{modo=await DB.init();}catch(e){console.warn(e);}
 if(modo==='login'){$('#login').classList.remove('hide');return;}
 marcarModo();
 const sel=$('#periodo');
 sel.innerHTML=MESES.map((m,i)=>`<option value="${i}">${m} ${AÑO}</option>`).join('');
 sel.value=MES;
 render();
 if(CFG_SHEET.url&&CFG_SHEET.auto)sincronizar();
 setTimeout(()=>bienvenida(),400);
}
document.querySelectorAll('.nav').forEach(b=>b.addEventListener('click',()=>ir(b.dataset.v)));
$('#periodo').addEventListener('change',e=>{MES=+e.target.value;render();});
document.querySelectorAll('.js-venta').forEach(b=>b.addEventListener('click',()=>nuevaVenta()));
document.querySelectorAll('.js-ayuda').forEach(b=>b.addEventListener('click',ayuda));
$('#burger').addEventListener('click',abrirMenu);
$('#backdrop').addEventListener('click',cerrarMenu);
addEventListener('keydown',e=>{if(e.key==='Escape'){cerrarMenu();if(tour.activo)tour.cerrar();}});
$('#csvIn').addEventListener('change',e=>{if(e.target.files[0])importarCSV(e.target.files[0]);e.target.value='';});
$('#xlsStock').addEventListener('change',e=>{if(e.target.files[0])importarStockXLS(e.target.files[0]);e.target.value='';});
$('#xlsVentas').addEventListener('change',e=>{if(e.target.files[0])importarVentasXLS(e.target.files[0]);e.target.value='';});
document.addEventListener('mousemove',e=>{if(tip.style.opacity==1)moveTip(e);});
$('#loginForm').addEventListener('submit',async e=>{
 e.preventDefault();const b=$('#loginBtn');b.disabled=true;b.textContent='Entrando…';
 try{await DB.login($('#lEmail').value.trim(),$('#lPass').value);
  $('#login').classList.add('hide');marcarModo();
  const sel=$('#periodo');sel.innerHTML=MESES.map((m,i)=>`<option value="${i}">${m} ${AÑO}</option>`).join('');sel.value=MES;
  render();}
 catch(err){$('#loginErr').textContent='No pudimos entrar: '+(err.message||err);}
 b.disabled=false;b.textContent='Entrar';});
$('#logout').addEventListener('click',()=>DB.logout());

/* al girar el celular o cambiar el tamaño, los gráficos se rehacen a la nueva medida */
let anchoPrev=chico();
let tRedim;
addEventListener('resize',()=>{clearTimeout(tRedim);tRedim=setTimeout(()=>{
 if(chico()!==anchoPrev){anchoPrev=chico();render();}},220);});

boot();
