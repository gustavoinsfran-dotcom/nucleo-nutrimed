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
 if(c.t==='nota')return `<p class="fnota">${esc(c.ph||'')}</p>`;
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
function tbl(cols,filas,ord){
 const th=c=>{
  const cls=[c.n?'num':'',c.s?'sel':''].filter(Boolean).join(' ');
  if(c.th)return `<th${cls?` class="${cls}"`:''}>${c.th}</th>`;
  if(!ord||!c.k)return `<th${cls?` class="${cls}"`:''}>${esc(c.t)}</th>`;
  const act=ord.k===c.k, fl=act?(ord.asc?' ↑':' ↓'):'';
  return `<th${cls?` class="${cls}"`:''}><button class="thsort${act?' on':''}" onclick="${ord.fn}('${c.k}')">${esc(c.t)}${fl}</button></th>`;
 };
 return `<div class="tw"><table><thead><tr>${cols.map(th).join('')}</tr></thead>
 <tbody>${filas.map(f=>`<tr>${f.map((c,i)=>{const k=[cols[i].n?'num':'',i===0&&!cols[0].s?'tit':'',cols[i].s?'sel':'',i===1&&cols[0].s?'tit':''].filter(Boolean).join(' ');
  return `<td${k?` class="${k}"`:''} data-l="${esc(cols[i].t)}">${c}</td>`;}).join('')}</tr>`).join('')}</tbody></table></div>`;
}
function vacio(txt,btn){
 return `<div class="empty"><p>${txt}</p>${btn?`<button class="btn pri" onclick="${btn.fn}">${esc(btn.t)}</button>`:''}</div>`;
}


/* ============ PRESCRIPTORES ============
   Un prescriptor es un contacto marcado como tal. No hay base aparte:
   quien indica producto sale de los mismos 190 contactos que ya cargamos. */
const PRESC=()=>CONTACTOS.filter(c=>c.presc);
const PR=id=>CONTACTOS.find(c=>c.id===id);
const ventasDe=id=>VENTAS.filter(v=>v.pr===id);
const factPr=id=>fact(ventasDe(id));
const unidPr=id=>ventasDe(id).reduce((a,v)=>a+v.u,0);
const ultimaPr=id=>{const l=ventasDe(id);return l.length?l.map(v=>v.f).sort().pop():'';};
/* días desde la última prescripción; null si nunca prescribió */
const diasSinPr=id=>{const f=ultimaPr(id);if(!f)return null;
 return Math.round((new Date(hoy())-new Date(f))/864e5);};
const DORMIDO=90;
const ambitoDe=c=>c.amb||(c.cta?'Institución':'Consultorio propio');
/* dónde ejerce, en texto: si atiende por su cuenta, la institución no manda */
const dondeDe=c=>ambitoDe(c)==='Consultorio propio'?'':(C(c.cta)?.n||'');
/* la matrícula a veces ya viene con prefijo: no lo duplicamos */
const matDe=c=>{const m=String(c.mat||'').trim();return m?(/^m\.?\s?[np]/i.test(m)?m:'M.N. '+m):'';};

/* alta rápida desde la carga de venta: entra a la base como un contacto más */
function nuevoPrescriptor(tras){
 modal({titulo:'Nuevo prescriptor',ok:'Dar de alta',ancho:'620px',campos:[
  {k:'n',l:'Nombre y apellido',req:true},
  {k:'esp',l:'Especialidad',t:'select',val:'Nutrición',opts:ESPECIALIDADES.map(x=>({v:x,t:x})),half:true},
  {k:'amb',l:'Dónde ejerce',t:'select',val:'Institución',opts:AMBITOS.map(x=>({v:x,t:x})),half:true},
  {k:'cta',l:'Institución',t:'select',val:'',opts:[{v:'',t:'Sin institución · consultorio propio'},
    ...CUENTAS.map(c=>({v:c.id,t:c.n}))],half:true,
   hint:'Dejalo vacío si atiende solo en su consultorio.'},
  {k:'mat',l:'Matrícula',half:true,ph:'Opcional'},
  {k:'mail',l:'Email',t:'email',half:true},
  {k:'tel',l:'Teléfono',half:true}],
  onOk:async v=>{
   const c=await DB.addContacto({n:v.n,r:v.esp,esp:v.esp,amb:v.amb,mat:v.mat,
    mail:v.mail,tel:v.tel,cta:v.cta?+v.cta:null,i:v.cta?C(+v.cta)?.n||'':'',
    cat:'Profesional',presc:true,o:'Alta desde venta',tipo:'Comercial',
    f:hoy(),et:'Prescribe'});
   toast(`${v.n} quedó dado de alta como prescriptor.`,'ok');
   if(tras)tras(c.id);else render();}});
}

/* marcar o desmarcar a un contacto que ya está en la base */
function marcarPrescriptor(id){
 const c=PR(id); if(!c)return;
 modal({titulo:c.n,ok:c.presc?'Guardar':'Marcar como prescriptor',ancho:'620px',campos:[
  {k:'esp',l:'Especialidad',t:'select',val:c.esp||c.r||'Nutrición',opts:ESPECIALIDADES.map(x=>({v:x,t:x})),half:true},
  {k:'amb',l:'Dónde ejerce',t:'select',val:ambitoDe(c),opts:AMBITOS.map(x=>({v:x,t:x})),half:true},
  {k:'cta',l:'Institución',t:'select',val:c.cta||'',opts:[{v:'',t:'Sin institución · consultorio propio'},
    ...CUENTAS.map(x=>({v:x.id,t:x.n}))],half:true},
  {k:'mat',l:'Matrícula',val:c.mat,half:true,ph:'Opcional'}],
  onOk:async v=>{
   await DB.updContacto(id,{presc:true,esp:v.esp,amb:v.amb,mat:v.mat,
    cta:v.cta?+v.cta:null,cat:'Profesional',
    et:ETAPAS.indexOf(c.et||'Cargado')<ETAPAS.indexOf('Prescribe')?'Prescribe':c.et});
   toast('Listo, ya figura en el ranking.','ok');render();}});
}
function quitarPrescriptor(id){
 modal({titulo:'Quitar del ranking',ok:'Quitar',campos:[
  {k:'x',t:'nota',l:'',ph:'Deja de figurar como prescriptor. El contacto sigue en la base y las ventas ya cargadas conservan su atribución.'}],
  onOk:async()=>{await DB.updContacto(id,{presc:false});toast('Quitado del ranking.');render();}});
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
function camposContacto(c){
 return [
  {k:'n',l:'Nombre y apellido',req:true,val:c?.n},
  {k:'cat',l:'Categoría',t:'select',val:c?.cat||'A confirmar',opts:CATEGORIAS.map(x=>({v:x,t:x})),half:true,
   hint:'Dejala en "A confirmar" si no te lo dijo la persona.'},
  {k:'r',l:'Profesión o cargo',val:c?.r,ph:'Nutricionista, médica, geriatra, alumna…',half:true},
  {k:'i',l:'Institución',val:c?.i,half:true},
  {k:'tipo',l:'Tipo de origen',t:'select',val:c?.tipo||'Académico',opts:TIPOS_ORIGEN.map(x=>({v:x,t:x})),half:true},
  {k:'mail',l:'Email',t:'email',val:c?.mail,half:true},
  {k:'tel',l:'Teléfono',val:c?.tel,half:true},
  {k:'o',l:'Origen',req:true,val:c?.o,ph:'Clase USAL, Hospital Militar, Sorteo de becas…',half:true,
   hint:'De dónde salió el dato. No se cambia después.'},
  {k:'f',l:'Fecha de alta',t:'date',val:c?.f||hoy(),half:true},
  {k:'et',l:'Etapa',t:'select',val:c?.et||'Cargado',opts:ETAPAS.map(x=>({v:x,t:x})),half:true},
  {k:'cta',l:'Cuenta vinculada',t:'select',val:c?.cta||'',opts:[{v:'',t:'Sin vincular'},...CUENTAS.map(x=>({v:x.id,t:x.n}))],half:true}];
}
function nuevoContacto(){
 modal({titulo:'Nuevo contacto',ok:'Dar de alta',ancho:'620px',campos:camposContacto(null),
  onOk:async v=>{await DB.addContacto({...v,cta:v.cta?+v.cta:null});toast('Contacto agregado.');render();}});
}
function editarContacto(id){
 const c=CONTACTOS.find(x=>x.id===id); if(!c)return;
 modal({titulo:esc(c.n),ok:'Guardar cambios',ancho:'620px',campos:camposContacto(c),
  onOk:async v=>{await DB.updContacto(id,{...v,cta:v.cta?+v.cta:null});toast('Contacto actualizado.');render();}});
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
function nuevaVenta(pre){
 if(!CUENTAS.length){toast('Primero cargá al menos una cuenta.','err');return nuevaCuenta();}
 const prods=PROD.map(p=>({v:p.id,t:p.n+' · '+p.pres}));
 /* los prescriptores primero, después el resto de los profesionales de la base */
 const pr=PRESC().sort((a,b)=>a.n.localeCompare(b.n,'es'));
 const otros=CONTACTOS.filter(c=>!c.presc&&c.cat==='Profesional').sort((a,b)=>a.n.localeCompare(b.n,'es'));
 const opsPr=[{v:'',t:'Sin identificar'},
  ...pr.map(c=>({v:c.id,t:c.n+' · '+(dondeDe(c)||'consultorio propio')})),
  ...(otros.length?[{v:'_sep',t:'──── otros profesionales de la base ────'}]:[]),
  ...otros.map(c=>({v:c.id,t:c.n})),
  {v:'_new',t:'+ Dar de alta un prescriptor nuevo'}];
 modal({titulo:'Cargar venta',ok:'Guardar venta',ancho:'620px',campos:[
  {k:'c',l:'Cliente — quién compra y paga',t:'select',opts:CUENTAS.map(c=>({v:c.id,t:c.n+' · '+c.t})),req:true},
  {k:'pr',l:'Prescriptor — quién la indicó',t:'select',val:pre||'',opts:opsPr,
   hint:'Si la venta no vino de una indicación, dejalo en "Sin identificar". No lo completes a dedo.'},
  {k:'p',l:'Producto',t:'select',opts:prods,req:true},
  {k:'u',l:'Unidades',t:'number',val:1,req:true,half:true},
  {k:'pu',l:'Precio unitario',t:'number',val:PROD[0]?.p||0,req:true,half:true},
  {k:'f',l:'Fecha',t:'date',val:hoy(),req:true,half:true},
  {k:'o',l:'Origen',t:'select',opts:ORIGENES_VENTA,half:true}],
  onOk:async v=>{
   if(v.pr==='_new'||v.pr==='_sep'){toast('Elegí un prescriptor o dejalo sin identificar.','err');return false;}
   const idPr=v.pr?+v.pr:null;
   await DB.addVenta({f:v.f,m:+v.f.split('-')[1]-1,c:+v.c,p:v.p,u:+v.u,pu:+v.pu,o:v.o,pr:idPr});
   /* quien indica, prescribe: el contacto pasa solo a la etapa que corresponde */
   if(idPr){const c=PR(idPr);
    if(c&&!c.presc)await DB.updContacto(idPr,{presc:true,cat:'Profesional',et:'Prescribe'});}
   MES=+v.f.split('-')[1]-1;$('#periodo').value=MES;toast('Venta cargada.');render();}});
 const sel=$('#f_p'),pu=$('#f_pu'),sp=$('#f_pr');
 const sync=()=>{const p=P(sel.value);if(p&&p.p)pu.value=p.p;};
 sel.addEventListener('change',sync);sync();
 /* si elige "dar de alta", se abre el alta y vuelve con el nuevo ya seleccionado */
 sp.addEventListener('change',()=>{
  if(sp.value==='_sep'){sp.value='';return;}
  if(sp.value==='_new'){$('#dlg').close();nuevoPrescriptor(id=>nuevaVenta(id));}});
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
  ${PRESC().length?`<div class="card"><div class="chead"><div><h3>Top prescriptores</h3>
   <p class="sub">Quiénes indican la línea, en el acumulado del año</p></div>
   <button class="btn" onclick="ir('prescriptores')">Ver todos</button></div>
   ${barsH(PRESC().map(c=>({n:c.n+(c.cta?' · '+(C(c.cta)?.n||''):' · consultorio propio'),v:factPr(c.id),t:money(factPr(c.id))}))
     .filter(x=>x.v).sort((a,b)=>b.v-a.v).slice(0,6),'var(--s1)')||'<p class="mini">Todavía no hay ventas atribuidas a un prescriptor.</p>'}
   ${(()=>{const d=PRESC().filter(c=>{const x=diasSinPr(c.id);return x!==null&&x>DORMIDO;}).length;
     return d?`<p class="src" style="color:var(--serious)">${d} prescriptor(es) dormidos: prescribían y dejaron de hacerlo.</p>`:'';})()}
  </div>`:''}
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
   <p class="sub">${vm.length} operaciones · ${money(fact(vm))}${vm.length?` · ${vm.filter(v=>v.pr).length} con prescriptor identificado`:''}</p></div>
   <div class="btnrow">
   <button class="btn" onclick="$('#xlsVentas').click()">↥ Subir ventas del sistema</button>
   <button class="btn pri" onclick="nuevaVenta()">+ Cargar venta</button></div></div>
  ${vm.length?tbl(
   [{t:'Fecha'},{t:'Cliente'},{t:'Prescriptor'},{t:'Producto'},{t:'Unid.',n:1},{t:'Total',n:1},{t:'Origen'}],
   vm.map(v=>[fmtF(v.f),`<b>${esc(C(v.c)?.n||'—')}</b><div class="mini">${esc(C(v.c)?.t||'')}</div>`,
    v.pr&&PR(v.pr)?`<a href="#" onclick="fichaPr(${v.pr});return false">${esc(PR(v.pr).n)}</a><div class="mini">${esc(dondeDe(PR(v.pr))||'consultorio propio')}</div>`
      :'<span class="mini">sin identificar</span>',
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

/* Estado de la vista de contactos. Vive en memoria: filtrar no cambia el dato. */
var FB={cat:'',org:'',et:'',inst:'',q:'',k:'n',asc:true,sel:new Set()};
const catDe=c=>c.cat||'A confirmar';
const etapaDe=c=>c.et||'Cargado';

function filtroBase(k,v){FB[k]=FB[k]===v?'':v;FB.sel.clear();render();}
function limpiarFiltros(){FB.cat=FB.org=FB.et=FB.inst=FB.q='';FB.sel.clear();render();}
function ordenarBase(k){if(FB.k===k)FB.asc=!FB.asc;else{FB.k=k;FB.asc=true;}render();}
function buscarBase(v){FB.q=v;FB.sel.clear();render();
 const i=$('#qBase');if(i){i.focus();i.setSelectionRange(v.length,v.length);}}

function contactosFiltrados(){
 const q=SHEET.norm(FB.q);
 let l=CONTACTOS.filter(c=>
  (!FB.cat||catDe(c)===FB.cat)&&
  (!FB.org||(c.o||'Sin origen')===FB.org)&&
  (!FB.et||etapaDe(c)===FB.et)&&
  (!FB.inst||c.cta===FB.inst)&&
  (!q||[c.n,c.mail,c.i,c.r,c.tel,c.o].some(x=>SHEET.norm(x).includes(q))));
 const val=c=>({n:c.n,i:C(c.cta)?.n||c.i||'',cat:catDe(c),o:c.o||'',et:ETAPAS.indexOf(etapaDe(c)),f:c.f||''})[FB.k];
 l.sort((x,y)=>{const a=val(x),b=val(y);
  const r=typeof a==='number'?a-b:String(a).localeCompare(String(b),'es');
  return FB.asc?r:-r;});
 return l;
}

/* ---- selección y acciones en lote ---- */
function selUno(id,ok){ok?FB.sel.add(id):FB.sel.delete(id);pintarLote();}
function selTodos(ok){const l=contactosFiltrados();
 if(ok)l.forEach(c=>FB.sel.add(c.id));else l.forEach(c=>FB.sel.delete(c.id));render();}
function pintarLote(){
 const bar=$('#lote'); if(!bar)return;
 bar.classList.toggle('on',FB.sel.size>0);
 const n=$('#loteN'); if(n)n.textContent=FB.sel.size;
 const t=$('#selTodo'); if(t){const l=contactosFiltrados();
  t.checked=l.length>0&&l.every(c=>FB.sel.has(c.id));}
}
function loteCampo(campo){
 const opts=campo==='cat'?CATEGORIAS:campo==='et'?ETAPAS
   :[{v:'',t:'Sin vincular'},...CUENTAS.map(c=>({v:c.id,t:c.n}))];
 const titulo=campo==='cat'?'Cambiar categoría':campo==='et'?'Mover de etapa':'Asignar institución';
 modal({titulo:`${titulo} · ${FB.sel.size} contacto(s)`,ok:'Aplicar',campos:[
  {k:'v',l:titulo,t:'select',opts:Array.isArray(opts)&&typeof opts[0]==='string'?opts.map(x=>({v:x,t:x})):opts,req:campo!=='cta'}],
  onOk:async v=>{const val=campo==='cta'?(v.v?+v.v:null):v.v;
   for(const id of FB.sel)await DB.updContacto(id,{[campo]:val});
   toast(`${FB.sel.size} contacto(s) actualizados.`,'ok');FB.sel.clear();render();}});
}
function lotePrescriptor(){
 const n=FB.sel.size;
 modal({titulo:`Marcar ${n} como prescriptores`,ok:'Marcar',campos:[
  {k:'esp',l:'Especialidad',t:'select',val:'Nutrición',opts:ESPECIALIDADES.map(x=>({v:x,t:x}))},
  {k:'x',t:'nota',l:'',ph:'Pasan a figurar en el ranking. Si alguno no prescribe, se lo saca después desde su ficha.'}],
  onOk:async v=>{for(const id of FB.sel)await DB.updContacto(id,{presc:true,cat:'Profesional',esp:v.esp});
   toast(`${n} prescriptor(es) marcados.`,'ok');FB.sel.clear();render();}});
}
function loteBorrar(){
 const n=FB.sel.size;
 modal({titulo:`Borrar ${n} contacto(s)`,ok:'Sí, borrar',campos:[
  {k:'x',l:'',t:'nota',ph:`Se eliminan ${n} contactos de la base. No se puede deshacer desde acá: si te arrepentís, se recupera del respaldo.`}],
  onOk:async()=>{await DB.borrarContactos([...FB.sel]);toast(`${n} contacto(s) borrados.`);FB.sel.clear();render();}});
}
function exportarFiltrado(){
 const l=contactosFiltrados();
 dl(`nucleo_contactos_${l.length}.csv`,
  [['Nombre','Email','Telefono','Categoria','Profesion','Institucion','Origen','TipoOrigen','FechaAlta','Etapa'],
  ...l.map(c=>[c.n,c.mail||'',c.tel||'',catDe(c),c.r||'',C(c.cta)?.n||c.i||'',c.o||'',c.tipo||'',c.f||'',etapaDe(c)])]);
 toast(`${l.length} contacto(s) exportados.`,'ok');
}

V.base=()=>{
 const T=CONTACTOS.length;
 if(!T) return `<div class="card">${vacio('La base está vacía. Importá el archivo de las jornadas y clases, o cargá un contacto a mano.',{t:'↥ Importar CSV',fn:"$('#csvIn').click()"})}</div>`;

 const fuentes=[];
 CONTACTOS.forEach(c=>{
  const k=c.o||'Sin origen';
  let f=fuentes.find(x=>x.k===k);
  if(!f){f={k,tipo:c.tipo||'',f:c.f||'',n:0,dec:0,tel:0,arch:c.arch||''};fuentes.push(f);}
  f.n++; if(catDe(c)!=='A confirmar')f.dec++; if(c.tel)f.tel++;
  if(c.f&&(!f.f||c.f<f.f))f.f=c.f;
 });
 fuentes.sort((a,b)=>b.n-a.n);

 const porCat=CATEGORIAS.map(k=>({k,n:CONTACTOS.filter(c=>catDe(c)===k).length}));
 const porEtapa=ETAPAS.map(k=>({k,n:CONTACTOS.filter(c=>etapaDe(c)===k).length}));
 const decl=T-porCat[0].n, conTel=CONTACTOS.filter(c=>c.tel).length;
 const lista=contactosFiltrados();
 const chips=[
  FB.q?{t:`«${FB.q}»`,f:"buscarBase('')"}:null,
  FB.cat?{t:FB.cat,f:`filtroBase('cat','${FB.cat}')`}:null,
  FB.org?{t:FB.org,f:`filtroBase('org','${esc(FB.org)}')`}:null,
  FB.et?{t:FB.et,f:`filtroBase('et','${FB.et}')`}:null,
  FB.inst?{t:C(FB.inst)?.n||'Institución',f:`filtroBase('inst',${FB.inst})`}:null,
 ].filter(Boolean);

 return `<div class="card" style="margin-bottom:16px">
  <div class="chead"><div><h3>Base unificada de contactos</h3>
   <p class="sub">Universidades, jornadas y hospitales en un solo lugar, con el origen de cada dato</p></div>
   <div class="btnrow"><button class="btn" onclick="$('#csvIn').click()">↥ Importar CSV</button>
   <button class="btn pri" onclick="nuevoContacto()">+ Nuevo contacto</button></div></div>
  <div class="grid g4">
   <div class="card tile" style="padding:16px"><div class="lbl">Contactos</div><div class="val" style="font-size:24px">${T}</div>
    <div class="dlt">${fuentes.length} orígenes</div></div>
   <div class="card tile" style="padding:16px"><div class="lbl">Categoría declarada</div><div class="val" style="font-size:24px">${decl}</div>
    <div class="dlt">${(decl/T*100).toFixed(0)}% de la base</div></div>
   <div class="card tile" style="padding:16px"><div class="lbl">Con teléfono</div><div class="val" style="font-size:24px">${conTel}</div>
    <div class="dlt">${(conTel/T*100).toFixed(0)}% alcanzable por WhatsApp</div></div>
   <div class="card tile" style="padding:16px"><div class="lbl">Instituciones</div>
    <div class="val" style="font-size:24px">${new Set(CONTACTOS.map(c=>c.cta).filter(Boolean)).size}</div>
    <div class="dlt">${CONTACTOS.filter(c=>c.cta).length} contactos vinculados</div></div>
  </div>
 </div>

 <div class="grid g2" style="margin-bottom:16px">
  <div class="card"><h3>Segmentos</h3><p class="sub">La categoría la declara la persona. Tocá un segmento para filtrar.</p>
   ${porCat.map(x=>{const pct=x.n/T*100,col=x.k==='A confirmar'?'var(--ink-3)':'var(--s1)';
    return `<div class="segrow${FB.cat===x.k?' on':''}" onclick="filtroBase('cat','${x.k}')">
     <div class="segtop"><span>${x.k}</span><b>${x.n}</b></div>
     <div class="bar"><i style="width:${pct.toFixed(1)}%;background:${col}"></i></div></div>`}).join('')}
   ${porCat[0].n?`<p class="src">Los ${porCat[0].n} "a confirmar" no se completan a dedo: la categoría entra sola cuando la persona responde el primer mensaje.</p>`:''}
  </div>
  <div class="card"><h3>Cómo se mueve la base</h3><p class="sub">Cada paso lo dispara un hecho, no una intención</p>
   ${porEtapa.map(x=>`<div class="segrow${FB.et===x.k?' on':''}" onclick="filtroBase('et','${x.k}')">
     <div class="segtop"><span>${x.k}</span><b>${x.n}</b></div>
     <div class="bar"><i style="width:${(x.n/T*100).toFixed(1)}%;background:var(--s3)"></i></div></div>`).join('')}
   <p class="src">Cargado → Contactado (salió el mensaje) → Declaró categoría (respondió) → Interactuó (descargó o pidió algo) → Cuenta abierta.</p>
  </div>
 </div>

 <div class="card" style="margin-bottom:16px"><h3>Origen del dato</h3>
  <p class="sub">De dónde salió cada contacto y qué archivo lo trajo</p>
  ${tbl([{t:'Origen'},{t:'Tipo'},{t:'Desde'},{t:'Contactos',n:1},{t:'Declarados',n:1},{t:'Con teléfono',n:1}],
   fuentes.map(f=>[`<b>${esc(f.k)}</b>${f.arch?`<div class="mini">${esc(f.arch)}</div>`:''}`,
    f.tipo?`<span class="tag">${esc(f.tipo)}</span>`:'<span class="mini">sin definir</span>',fmtF(f.f),
    `<a href="#" onclick="filtroBase('org','${esc(f.k)}');return false">${f.n}</a>`,
    f.dec||'<span class="mini">—</span>',f.tel||'<span class="mini">—</span>']))}
  <p class="src">El origen no se edita: es la trazabilidad del dato.</p>
 </div>

 <div class="card">
  <div class="chead"><div><h3>Contactos</h3>
   <p class="sub">${lista.length===T?`${T} registros`:`${lista.length} de ${T} registros`}</p></div>
   <div class="btnrow"><button class="btn" onclick="exportarFiltrado()">↧ Exportar ${lista.length===T?'todo':'lo filtrado'}</button></div></div>

  <div class="barra">
   <input id="qBase" class="buscador" type="search" placeholder="Buscar por nombre, mail, institución o teléfono…"
    value="${esc(FB.q)}" oninput="buscarBase(this.value)">
   <select class="btn" onchange="filtroBase('inst',this.value?+this.value:'')">
    <option value="">Todas las instituciones</option>
    ${CUENTAS.filter(c=>CONTACTOS.some(x=>x.cta===c.id)).sort((a,b)=>a.n.localeCompare(b.n,'es'))
      .map(c=>`<option value="${c.id}"${FB.inst===c.id?' selected':''}>${esc(c.n)}</option>`).join('')}
   </select>
  </div>
  ${chips.length?`<div class="chips">${chips.map(c=>`<button class="chip" onclick="${c.f}">${esc(c.t)} <span>✕</span></button>`).join('')}
   <button class="chip lim" onclick="limpiarFiltros()">Quitar todo</button></div>`:''}

  <div class="lotebar${FB.sel.size?' on':''}" id="lote">
   <span><b id="loteN">${FB.sel.size}</b> seleccionados</span>
   <div class="btnrow">
    <button class="btn" onclick="loteCampo('cat')">Categoría</button>
    <button class="btn" onclick="loteCampo('et')">Etapa</button>
    <button class="btn" onclick="loteCampo('cta')">Institución</button>
    <button class="btn" onclick="lotePrescriptor()">Marcar prescriptor</button>
    <button class="btn" onclick="loteBorrar()">Borrar</button>
    <button class="btn" onclick="FB.sel.clear();render()">Deseleccionar</button></div>
  </div>

 ${lista.length?tbl([
   {t:'',s:1,th:`<input type="checkbox" id="selTodo" onchange="selTodos(this.checked)"${lista.length&&lista.every(c=>FB.sel.has(c.id))?' checked':''} aria-label="Seleccionar todos">`},{t:'Nombre',k:'n'},{t:'Categoría',k:'cat'},{t:'Institución',k:'i'},
   {t:'Contacto'},{t:'Origen',k:'o'},{t:'Etapa',k:'et'},{t:''}],
  lista.map(c=>{const cat=catDe(c),pend=cat==='A confirmar';
   return [`<input type="checkbox" onchange="selUno(${c.id},this.checked)"${FB.sel.has(c.id)?' checked':''} aria-label="Seleccionar">`,
   `<b>${esc(c.n)}</b>${c.presc?' <span class="tag t-good" style="padding:1px 8px">prescribe</span>':''}${c.r?`<div class="mini">${esc(c.r)}</div>`:''}`,
   pend?`<span class="tag">${cat}</span>${c.pista?`<div class="mini">parece ${esc(c.pista).toLowerCase()}</div>`:''}`
       :`<span class="tag t-good"><span class="d"></span>${esc(cat)}</span>`,
   esc(C(c.cta)?.n||c.i||'—'),
   `<span class="mini">${esc(c.mail||'')}${c.tel?'<br>'+esc(c.tel):''}</span>`,
   esc(c.o||'—'),esc(etapaDe(c)),
   `<a href="#" onclick="editarContacto(${c.id});return false">editar</a>${c.cat==='Profesional'&&!c.presc?`<br><a href="#" onclick="marcarPrescriptor(${c.id});return false" class="mini">marcar prescriptor</a>`:c.presc?`<br><a href="#" onclick="fichaPr(${c.id});return false" class="mini">ver ranking</a>`:''}`];}),
  {k:FB.k,asc:FB.asc,fn:'ordenarBase'})
  :vacio('Ningún contacto cumple el filtro.',{t:'Quitar filtros',fn:'limpiarFiltros()'})}
 </div>`;
};

V.instituciones=()=>{
 const g=[];
 CONTACTOS.forEach(c=>{
  const cta=C(c.cta), k=cta?cta.id:('_'+(c.i||'Sin institución'));
  let x=g.find(y=>y.k===k);
  if(!x){x={k,id:cta?cta.id:null,n:cta?cta.n:(c.i||'Sin institución'),t:cta?cta.t:'',
    n_:0,prof:0,est:0,doc:0,pend:0,tel:0,desde:c.f||'',orig:new Set()};g.push(x);}
  x.n_++; const cat=catDe(c);
  if(cat==='Profesional')x.prof++;else if(cat==='Estudiante')x.est++;
  else if(cat==='Docente')x.doc++;else x.pend++;
  if(c.tel)x.tel++;
  if(c.o)x.orig.add(c.o);
  if(c.f&&(!x.desde||c.f<x.desde))x.desde=c.f;
 });
 g.sort((a,b)=>b.n_-a.n_);
 const max=g.length?g[0].n_:1;
 const conVenta=g.filter(x=>x.id&&VENTAS.some(v=>v.c===x.id)).length;

 if(!g.length)return `<div class="card">${vacio('Todavía no hay instituciones. Se crean solas al importar contactos con el campo Institución.')}</div>`;

 return `<div class="grid g4" style="margin-bottom:16px">
  <div class="card tile"><div class="lbl">Instituciones</div><div class="val">${g.length}</div>
   <div class="dlt">con al menos un contacto</div></div>
  <div class="card tile"><div class="lbl">Contactos alcanzados</div><div class="val">${CONTACTOS.length}</div>
   <div class="dlt">promedio ${(CONTACTOS.length/g.length).toFixed(1)} por institución</div></div>
  <div class="card tile"><div class="lbl">Con actividad comercial</div>
   <div class="val" style="color:${conVenta?'var(--good)':'var(--ink-3)'}">${conVenta}</div>
   <div class="dlt">${conVenta?'ya compraron':'ninguna compró todavía'}</div></div>
  <div class="card tile"><div class="lbl">Institución más grande</div><div class="val" style="font-size:22px">${g[0].n_}</div>
   <div class="dlt">${esc(g[0].n)}</div></div>
 </div>

 <div class="card" style="margin-bottom:16px"><h3>Presencia por institución</h3>
  <p class="sub">Cuántos contactos tenemos en cada una y cómo se componen</p>
  ${g.slice(0,12).map(x=>`<div class="instrow" onclick="FB.inst=${x.id||"''"};ir('base')">
   <div class="segtop"><span>${esc(x.n)}</span><b>${x.n_}</b></div>
   <div class="bar comp">
    ${x.prof?`<i style="width:${x.prof/max*100}%;background:var(--s1)" title="Profesionales"></i>`:''}
    ${x.est?`<i style="width:${x.est/max*100}%;background:var(--s3)" title="Estudiantes"></i>`:''}
    ${x.doc?`<i style="width:${x.doc/max*100}%;background:var(--s2)" title="Docentes"></i>`:''}
    ${x.pend?`<i style="width:${x.pend/max*100}%;background:var(--grid)" title="A confirmar"></i>`:''}
   </div></div>`).join('')}
  <div class="legend"><span><i style="background:var(--s1)"></i>Profesionales</span>
   <span><i style="background:var(--s3)"></i>Estudiantes</span>
   <span><i style="background:var(--s2)"></i>Docentes</span>
   <span><i style="background:var(--grid)"></i>A confirmar</span></div>
 </div>

 <div class="card"><h3>Detalle</h3><p class="sub">Tocá una fila para ver sus contactos</p>
 ${tbl([{t:'Institución'},{t:'Contactos',n:1},{t:'Profesionales',n:1},{t:'Estudiantes',n:1},
    {t:'A confirmar',n:1},{t:'Con teléfono',n:1},{t:'Desde'},{t:'Orígenes'}],
  g.map(x=>[`<b>${esc(x.n)}</b>${x.t?`<div class="mini">${esc(x.t)}</div>`:''}`,
   x.id?`<a href="#" onclick="FB.inst=${x.id};ir('base');return false">${x.n_}</a>`:x.n_,
   x.prof||'<span class="mini">—</span>',x.est||'<span class="mini">—</span>',
   x.pend||'<span class="mini">—</span>',x.tel||'<span class="mini">—</span>',fmtF(x.desde),
   [...x.orig].map(o=>`<span class="tag">${esc(o)}</span>`).join(' ')||'<span class="mini">—</span>']))}
 <p class="src">Una institución aparece acá apenas tiene un contacto. Que aparezca no significa que sea cliente: eso se ve en Cuentas.</p></div>`;
};


var FP={q:'',amb:'',k:'fact'};
function ordenarPr(k){FP.k=k;render();}
function filtroPr(k,v){FP[k]=FP[k]===v?'':v;render();}
function buscarPr(v){FP.q=v;render();const i=$('#qPr');if(i){i.focus();i.setSelectionRange(v.length,v.length);}}

V.prescriptores=()=>{
 const l=PRESC();
 if(!l.length) return `<div class="card">${vacio(
  'Todavía no hay prescriptores cargados. Se dan de alta al cargar una venta, o marcando a un profesional que ya está en la base.',
  {t:'+ Nuevo prescriptor',fn:'nuevoPrescriptor()'})}</div>`;

 const filas=l.map(c=>({c,f:factPr(c.id),u:unidPr(c.id),n:ventasDe(c.id).length,
   d:diasSinPr(c.id),amb:ambitoDe(c),inst:dondeDe(c)}));
 const totalPr=filas.reduce((a,x)=>a+x.f,0);
 const totalGral=fact(VENTAS);
 const sinPresc=fact(VENTAS.filter(v=>!v.pr));
 const dormidos=filas.filter(x=>x.d!==null&&x.d>DORMIDO);
 const nunca=filas.filter(x=>x.d===null);
 const activos=filas.filter(x=>x.d!==null&&x.d<=DORMIDO);
 const porInst=filas.filter(x=>x.amb!=='Consultorio propio').reduce((a,x)=>a+x.f,0);
 const indep=totalPr-porInst;
 /* concentración: cuánto pesan los cinco primeros */
 const top5=[...filas].sort((a,b)=>b.f-a.f).slice(0,5).reduce((a,x)=>a+x.f,0);

 const q=SHEET.norm(FP.q);
 let vis=filas.filter(x=>(!FP.amb||x.amb===FP.amb)&&
   (!q||[x.c.n,x.inst,x.c.esp,x.c.mat].some(y=>SHEET.norm(y).includes(q))));
 vis.sort((a,b)=>FP.k==='fact'?b.f-a.f:FP.k==='unid'?b.u-a.u:
   FP.k==='dias'?((a.d===null?1e9:a.d)-(b.d===null?1e9:b.d))*-1:a.c.n.localeCompare(b.c.n,'es'));

 /* mix de producto por prescriptor */
 const mixDe=id=>{const m={};ventasDe(id).forEach(v=>{const k=P(v.p)?.cat||'—';m[k]=(m[k]||0)+v.u*v.pu;});
  const t=Object.values(m).reduce((a,b)=>a+b,0)||1;
  return ['SNO','Sonda','Módulos'].filter(k=>m[k]).map(k=>({k,pct:m[k]/t*100}));};
 const colCat={'SNO':'var(--s1)','Sonda':'var(--s2)','Módulos':'var(--s3)'};

 return `<div class="grid g4" style="margin-bottom:16px">
  <div class="card tile"><div class="lbl">Prescriptores</div><div class="val">${l.length}</div>
   <div class="dlt">${activos.length} activos · ${nunca.length} sin primera prescripción</div></div>
  <div class="card tile"><div class="lbl">Facturación atribuida</div><div class="val">${money(totalPr)}</div>
   <div class="dlt">${totalGral?(totalPr/totalGral*100).toFixed(0):0}% del total · ${money(sinPresc)} sin identificar</div></div>
  <div class="card tile"><div class="lbl">Dormidos</div>
   <div class="val" style="color:${dormidos.length?'var(--serious)':'var(--good)'}">${dormidos.length}</div>
   <div class="dlt">sin prescribir hace más de ${DORMIDO} días</div></div>
  <div class="card tile"><div class="lbl">Concentración</div>
   <div class="val">${totalPr?(top5/totalPr*100).toFixed(0):0}%</div>
   <div class="dlt">de lo atribuido son los 5 primeros</div></div>
 </div>

 ${dormidos.length?`<div class="card alerta" style="margin-bottom:16px">
  <h3>Prescriptores dormidos</h3><p class="sub">Prescribían y dejaron de hacerlo. Recuperar a uno cuesta menos que conseguir uno nuevo.</p>
  ${tbl([{t:'Prescriptor'},{t:'Dónde'},{t:'Facturación',n:1},{t:'Última vez'},{t:'Días',n:1},{t:''}],
   dormidos.sort((a,b)=>b.f-a.f).map(x=>[
    `<b>${esc(x.c.n)}</b>${x.c.esp?`<div class="mini">${esc(x.c.esp)}</div>`:''}`,
    esc(x.inst||'Consultorio propio'),money(x.f),fmtF(ultimaPr(x.c.id)),
    `<span style="color:var(--serious);font-weight:600">${x.d}</span>`,
    `${x.c.tel?`<a href="https://wa.me/54${String(x.c.tel).replace(/\D/g,'')}" target="_blank" rel="noopener">WhatsApp</a>`:x.c.mail?`<a href="mailto:${esc(x.c.mail)}">Mail</a>`:'<span class="mini">sin contacto</span>'}`]))}
 </div>`:''}

 <div class="grid g2" style="margin-bottom:16px">
  <div class="card"><h3>Institución o consultorio propio</h3>
   <p class="sub">De dónde viene la facturación que sí tiene prescriptor</p>
   ${totalPr?`<div class="segrow${FP.amb==='Institución'?' on':''}" onclick="filtroPr('amb','Institución')">
     <div class="segtop"><span>Desde instituciones</span><b>${money(porInst)}</b></div>
     <div class="bar"><i style="width:${porInst/totalPr*100}%;background:var(--s2)"></i></div></div>
    <div class="segrow${FP.amb==='Consultorio propio'?' on':''}" onclick="filtroPr('amb','Consultorio propio')">
     <div class="segtop"><span>Consultorio propio</span><b>${money(indep)}</b></div>
     <div class="bar"><i style="width:${indep/totalPr*100}%;background:var(--s1)"></i></div></div>`
    :'<p class="mini">Todavía no hay ventas atribuidas.</p>'}
   <p class="src">Un profesional que atiende en los dos lados suma del lado de la institución. Se cambia en su ficha.</p>
  </div>
  <div class="card"><h3>Por especialidad</h3><p class="sub">Quién indica la línea</p>
   ${(()=>{const e={};filas.forEach(x=>{const k=x.c.esp||'Sin definir';e[k]=(e[k]||0)+x.f;});
     const ord=Object.entries(e).sort((a,b)=>b[1]-a[1]);
     const mx=ord[0]?.[1]||1;
     return ord.length?barsH(ord.map(([n,v])=>({n,v,t:money(v)})),'var(--s1)')
      :'<p class="mini">Sin datos todavía.</p>';})()}
  </div>
 </div>

 <div class="card">
  <div class="chead"><div><h3>Ranking de prescriptores</h3>
   <p class="sub">${vis.length===filas.length?`${filas.length} profesionales`:`${vis.length} de ${filas.length}`}</p></div>
   <div class="btnrow"><button class="btn pri" onclick="nuevoPrescriptor()">+ Nuevo prescriptor</button></div></div>
  <div class="barra">
   <input id="qPr" class="buscador" type="search" placeholder="Buscar por nombre, institución, especialidad o matrícula…"
    value="${esc(FP.q)}" oninput="buscarPr(this.value)">
   <select class="btn" onchange="FP.k=this.value;render()">
    <option value="fact"${FP.k==='fact'?' selected':''}>Ordenar por facturación</option>
    <option value="unid"${FP.k==='unid'?' selected':''}>Ordenar por unidades</option>
    <option value="dias"${FP.k==='dias'?' selected':''}>Ordenar por actividad reciente</option>
    <option value="nom"${FP.k==='nom'?' selected':''}>Ordenar por nombre</option>
   </select>
  </div>
  ${FP.amb?`<div class="chips"><button class="chip" onclick="filtroPr('amb','${FP.amb}')">${FP.amb} <span>✕</span></button></div>`:''}
 ${vis.length?tbl([{t:'#',n:1},{t:'Prescriptor'},{t:'Dónde ejerce'},{t:'Mix de la línea'},
   {t:'Unidades',n:1},{t:'Facturación',n:1},{t:'Últ. prescripción'},{t:''}],
  vis.map((x,i)=>{const mix=mixDe(x.c.id);
   return [`${i+1}`,
   `<b>${esc(x.c.n)}</b><div class="mini">${esc(x.c.esp||'sin especialidad')}${matDe(x.c)?' · '+esc(matDe(x.c)):''}</div>`,
   x.inst?`${esc(x.inst)}${x.amb==='Ambos'?'<div class="mini">y consultorio propio</div>':''}`
     :'<span class="tag">Consultorio propio</span>',
   mix.length?`<div class="bar comp" style="min-width:90px">${mix.map(m=>`<i style="width:${m.pct}%;background:${colCat[m.k]}" title="${m.k} ${m.pct.toFixed(0)}%"></i>`).join('')}</div>
     <div class="mini">${mix.map(m=>m.k+' '+m.pct.toFixed(0)+'%').join(' · ')}</div>`
    :'<span class="mini">sin ventas</span>',
   x.u||'<span class="mini">—</span>',
   x.f?`<b>${money(x.f)}</b>`:'<span class="mini">—</span>',
   x.d===null?'<span class="tag">nunca</span>'
    :x.d>DORMIDO?`<span class="tag t-ser"><span class="d"></span>hace ${x.d} días</span>`
    :`<span class="tag t-good"><span class="d"></span>${fmtF(ultimaPr(x.c.id))}</span>`,
   `<a href="#" onclick="fichaPr(${x.c.id});return false">ver</a>`];}))
  :vacio('Ningún prescriptor cumple el filtro.')}
 <p class="src">La facturación se atribuye al prescriptor indicado al cargar cada venta. Lo que quedó "sin identificar" no se reparte: se muestra aparte para no inflar a nadie.</p>
 </div>`;
};

/* ficha individual */
function fichaPr(id){
 const c=PR(id); if(!c)return;
 const vs=ventasDe(id).slice().sort((a,b)=>b.f.localeCompare(a.f));
 const prod={};vs.forEach(v=>{prod[v.p]=(prod[v.p]||0)+v.u;});
 const ctas={};vs.forEach(v=>{const k=C(v.c)?.n||'—';ctas[k]=(ctas[k]||0)+v.u*v.pu;});
 const d=diasSinPr(id);
 const cuerpo=`
  <div class="grid g3" style="margin-bottom:16px">
   <div class="card tile" style="padding:14px"><div class="lbl">Facturación</div><div class="val" style="font-size:20px">${money(factPr(id))}</div></div>
   <div class="card tile" style="padding:14px"><div class="lbl">Unidades</div><div class="val" style="font-size:20px">${unidPr(id)}</div></div>
   <div class="card tile" style="padding:14px"><div class="lbl">Prescripciones</div><div class="val" style="font-size:20px">${vs.length}</div></div>
  </div>
  <p class="mini" style="margin-bottom:14px">
   ${esc(c.esp||'Sin especialidad')}${matDe(c)?' · '+esc(matDe(c)):''} · ${esc(ambitoDe(c))}${dondeDe(c)?' · '+esc(dondeDe(c)):''}
   ${c.mail?`<br>${esc(c.mail)}`:''}${c.tel?` · ${esc(c.tel)}`:''}
   <br>Origen del contacto: ${esc(c.o||'—')}
   ${d===null?'<br><b>Todavía no registró prescripciones.</b>':d>DORMIDO?`<br><b style="color:var(--serious)">Dormido: hace ${d} días que no prescribe.</b>`:''}
  </p>
  ${Object.keys(ctas).length?`<h3 style="margin-bottom:8px">Por dónde compraron</h3>
   ${barsH(Object.entries(ctas).sort((a,b)=>b[1]-a[1]).map(([n,v])=>({n,v,t:money(v)})),'var(--s2)')}`:''}
  ${Object.keys(prod).length?`<h3 style="margin:16px 0 8px">Qué indica</h3>
   ${barsH(Object.entries(prod).sort((a,b)=>b[1]-a[1]).map(([k,v])=>({n:P(k)?.n||k,v,t:v+' u.'})),'var(--s1)')}`:''}
  ${vs.length?`<h3 style="margin:16px 0 8px">Últimas prescripciones</h3>
   ${tbl([{t:'Fecha'},{t:'Cliente'},{t:'Producto'},{t:'Unid.',n:1},{t:'Total',n:1}],
    vs.slice(0,10).map(v=>[fmtF(v.f),esc(C(v.c)?.n||'—'),esc(P(v.p)?.n||v.p),v.u,money(v.u*v.pu)]))}`
   :'<p class="mini">Sin ventas atribuidas todavía.</p>'}`;
 $('#dlg').innerHTML=`<div class="dlg-h"><h2>${esc(c.n)}</h2></div>
  <div class="dlg-b" style="display:block">${cuerpo}</div>
  <div class="dlg-f"><button class="btn" onclick="quitarPrescriptor(${id})">Quitar del ranking</button>
   <button class="btn" onclick="marcarPrescriptor(${id})">Editar datos</button>
   <button class="btn pri" onclick="$('#dlg').close();nuevaVenta(${id})">+ Cargar prescripción</button></div>`;
 $('#dlg').classList.add('wide');$('#dlg').showModal();
}

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
function exportVentas(){dl(`nucleo_ventas_${MESES[MES]}_${AÑO}.csv`,
 [['Fecha','Cliente','Tipo','Zona','Prescriptor','Especialidad','Ambito','Institucion del prescriptor',
   'Producto','Presentacion','Categoria','Unidades','Precio unitario','Total','Origen'],
 ...ventasMes(MES).map(v=>{const p=v.pr?PR(v.pr):null;
  return [v.f,C(v.c)?.n,C(v.c)?.t,C(v.c)?.z,p?.n||'',p?.esp||'',p?ambitoDe(p):'',p?dondeDe(p):'',
   P(v.p)?.n,P(v.p)?.pres,P(v.p)?.cat,v.u,v.pu,v.u*v.pu,v.o];})]);}
function exportBase(){dl('nucleo_contactos.csv',
 [['Nombre','Email','Telefono','Categoria','Pista','Profesion','Origen','Institucion','TipoOrigen','FechaAlta','Archivo','Etapa','Prescriptor','Especialidad','Ambito','Matricula','Cuenta'],
 ...CONTACTOS.map(c=>[c.n,c.mail,c.tel,catDe(c),c.pista||'',c.r||'',c.o||'',c.i||'',c.tipo||'',c.f||'',c.arch||'',etapaDe(c),c.presc?'si':'no',c.esp||'',c.presc?ambitoDe(c):'',c.mat||'',c.cta?C(c.cta)?.n:''])]);}
function exportStock(){dl(`nucleo_stock_valorizado_${MESES[MES]}_${AÑO}.csv`,
 [['Producto','Presentacion','Categoria','Lote','Unidades','Costo unitario','Valorizado a costo','Precio de lista','Valorizado a venta','Vencimiento','Dias','Estado'],
 ...LOTES.map(l=>({l,d:diasA(l.v)})).sort((a,b)=>a.d-b.d).map(r=>{const[,t]=nivelVto(r.d);
  return [P(r.l.p)?.n||r.l.p,P(r.l.p)?.pres||'',P(r.l.p)?.cat||'',r.l.l,r.l.u,
   costoDe(r.l.p)||'',costoDe(r.l.p)?valorLote(r.l):'',precioDe(r.l.p)||'',precioDe(r.l.p)?valorVentaLote(r.l):'',
   r.l.v,r.d,t];})]);}
function exportTodo(){bajar('nucleo_respaldo.json',new Blob([DB.exportar()],{type:'application/json'}));}

/* Importar contactos desde CSV.
   Reconoce el archivo consolidado (Nombre;Email;Categoria;Origen;Institucion;TipoOrigen;FechaAlta…)
   y también planillas sueltas con solo nombre y mail.
   Nunca pisa el origen de un contacto que ya estaba: ese dato es la trazabilidad. */
function importarCSV(file){
 const fr=new FileReader();
 fr.onload=async()=>{
  const filas=SHEET.parseCSV(String(fr.result));
  if(filas.length<2)return toast('El archivo no tiene filas.','err');
  const h=filas[0];
  const col=(...n)=>SHEET.col(h,n);
  const iN=col('nombre','apellido'),iM=col('mail','correo','email'),iT=col('tel','cel','whats'),
   iR=col('profesion','rol','cargo'),iI=col('institucion','instituci','hospital','universidad','empresa'),
   iC=col('categoria','segmento'),iO=col('origen','fuente','accion'),iTO=col('tipoorigen','tipo de origen','tipo'),
   iF=col('fechaalta','fecha'),iA=col('archivo'),iP=col('pista');
  if(iN<0)return toast('No encontré la columna Nombre.','err');
  if(iM<0&&iT<0)return toast('El archivo no trae ni mail ni teléfono: así no sirve para contactar.','err');

  const val=(r,i)=>i>=0&&r[i]!=null?String(r[i]).trim():'';
  const norm=s=>SHEET.norm(s);
  let nuevos=0,repetidos=0,sinMail=0,ctasNuevas=0,actualizados=0;

  for(const r of filas.slice(1)){
   const nom=val(r,iN); if(!nom)continue;
   const mail=val(r,iM).toLowerCase();
   const tel=val(r,iT);
   if(!mail&&!tel){sinMail++;continue;}

   /* ¿ya estaba? por mail, si no por nombre + origen */
   const ya=CONTACTOS.find(c=>(mail&&norm(c.mail)===norm(mail))||(!mail&&norm(c.n)===norm(nom)&&norm(c.o)===norm(val(r,iO))));
   const cat=CATEGORIAS.includes(val(r,iC))?val(r,iC):'A confirmar';
   if(ya){
    repetidos++;
    /* completa lo que falte, sin tocar origen ni categoría ya declarada */
    const parche={};
    if(!ya.tel&&tel)parche.tel=tel;
    if(!ya.mail&&mail)parche.mail=mail;
    if(!ya.i&&val(r,iI))parche.i=val(r,iI);
    if((!ya.cat||ya.cat==='A confirmar')&&cat!=='A confirmar')parche.cat=cat;
    if(Object.keys(parche).length){await DB.updContacto(ya.id,parche);actualizados++;}
    continue;
   }

   const inst=val(r,iI);
   let ctaId=null;
   if(inst){
    let c=CUENTAS.find(x=>norm(x.n)===norm(inst));
    if(!c){c=await DB.addCuenta({n:inst,t:'Institución',z:'',ref:'',tel:'',mail:'',
      e:'Contactada',notas:'Alta automática al importar la base de contactos.',desde:''});ctasNuevas++;}
    ctaId=c.id;
   }
   await DB.addContacto({n:nom,r:val(r,iR),i:inst,mail,tel,
    cat,pista:val(r,iP),
    o:val(r,iO)||'Importado',tipo:TIPOS_ORIGEN.includes(val(r,iTO))?val(r,iTO):'',
    arch:val(r,iA)||file.name.replace(/\.csv$/i,''),
    f:val(r,iF)||hoy(),et:'Cargado',cta:ctaId});
   nuevos++;
  }
  toast(`${nuevos} contactos nuevos${ctasNuevas?` · ${ctasNuevas} institución(es) dada(s) de alta`:''}.`,'ok');
  if(repetidos)toast(`${repetidos} ya estaban en la base${actualizados?`, ${actualizados} completado(s) con el dato nuevo`:', sin cambios'}.`);
  if(sinMail)toast(`${sinMail} fila(s) sin mail ni teléfono quedaron afuera.`,'err');
  render();
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
 prescriptores:['Ranking de <em>prescriptores</em>','Quiénes indican la línea'],
 instituciones:['<em>Instituciones</em>','Dónde tenemos presencia real'],
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
