/* ==========================================================
   Bienvenida, visita guiada y ayuda por sección
   ========================================================== */
const VISTO='nucleo.visto';

/* ---------- bienvenida ---------- */
function bienvenida(forzar){
 if(!forzar&&localStorage.getItem(VISTO))return false;
 const d=$('#dlg');
 d.innerHTML=`<div class="wel">
   <div class="wel-top">
     <p class="kicker" style="color:#fff;opacity:.85">Infinity Nutrición</p>
     <h2>Bienvenido a <b>NÚCLEO</b></h2>
     <p class="wel-sub">El sistema comercial y de marketing de la línea de nutrición clínica.</p>
   </div>
   <div class="wel-body">
     <div class="wel-item"><span>◧</span><div><b>Todo en un solo lugar</b><p>Ventas, cuentas, stock, contactos y acciones de marketing.</p></div></div>
     <div class="wel-item"><span>▦</span><div><b>El stock se actualiza solo</b><p>Se lee de la planilla que usa logística: ellos cargan allá, vos lo ves acá.</p></div></div>
     <div class="wel-item"><span>◈</span><div><b>Marketing que se puede medir</b><p>Cada acción muestra los contactos que generó y las cuentas que abrió.</p></div></div>
     <div class="wel-item"><span>↧</span><div><b>Reportes en un clic</b><p>El cierre del mes se exporta listo para dirección y casa matriz.</p></div></div>
   </div>
   <div class="wel-foot">
     <button class="btn" data-x="skip">Explorar por mi cuenta</button>
     <button class="btn pri" data-x="tour">Hacer la visita guiada</button>
   </div></div>`;
 d.classList.add('wide');
 d.showModal();
 localStorage.setItem(VISTO,'1');
 d.querySelector('[data-x="skip"]').onclick=()=>{d.close();d.classList.remove('wide');};
 d.querySelector('[data-x="tour"]').onclick=()=>{d.close();d.classList.remove('wide');tour.iniciar();};
 return true;
}

/* ---------- visita guiada ---------- */
const PASOS=[
 {v:'panel',sel:'#periodo',t:'Elegí el mes',
  d:'Todo lo que ves — facturación, ventas, reportes — corresponde al mes seleccionado acá.',pos:'abajo'},
 {v:'catalogo',sel:'.cat',t:'Tus 17 productos',
  d:'Es la línea Bi¹ completa, tomada del vademécum. Tocá cualquiera para cargarle el precio de lista: después se usa solo al registrar una venta.',pos:'abajo'},
 {v:'cuentas',sel:'.chead .btn.pri',t:'Cargá tus instituciones',
  d:'Hospitales, sanatorios, farmacias, droguerías y profesionales. Cada una avanza sola en el embudo cuando le cargás una venta.',pos:'izq'},
 {v:'stock',sel:'.sync',t:'Conectá la planilla de logística',
  d:'Pegás el enlace de la planilla de Google y el stock con sus vencimientos entra solo. Cada vez que ellos la actualizan, acá se refleja.',pos:'abajo'},
 {v:'ventas',sel:'#newSale',t:'Cargar una venta: 30 segundos',
  d:'Cuenta, producto, unidades y listo. Se descuenta el stock del lote que vence primero y se actualizan el panel y el reporte.',pos:'abajo'},
 {v:'acciones',sel:'#views',t:'Marketing con trazabilidad',
  d:'Cada jornada, capacitación o pauta con su inversión, los contactos que generó y las cuentas que abrió. Es el dato que justifica el presupuesto.',pos:'arriba'},
 {v:'reportes',sel:'#views',t:'El cierre del mes',
  d:'Ventas en Excel, reporte ejecutivo en PDF y respaldo completo. Listo para mandar sin rearmar nada.',pos:'arriba'}
];

const tour={
 i:0,activo:false,
 iniciar(){this.i=0;this.activo=true;
  document.body.insertAdjacentHTML('beforeend',
   '<div class="spot" id="spot"></div><div class="tourbox" id="tourbox"></div>');
  this.paso();
  addEventListener('resize',this.reubicar);},
 cerrar(){this.activo=false;
  ['spot','tourbox'].forEach(id=>{const e=document.getElementById(id);if(e)e.remove();});
  removeEventListener('resize',this.reubicar);
  cerrarMenu();},
 reubicar(){if(tour.activo)tour.pintar();},
 paso(){
  const p=PASOS[this.i];
  if(VISTA!==p.v)ir(p.v);
  setTimeout(()=>this.pintar(),90);
 },
 pintar(){
  const p=PASOS[this.i],el=document.querySelector(p.sel),spot=$('#spot'),box=$('#tourbox');
  if(!spot||!box)return;
  const movil=innerWidth<=860;
  if(el){
   el.scrollIntoView({block:'center',behavior:'smooth'});
   const r=el.getBoundingClientRect(),m=8;
   spot.style.cssText=`top:${r.top-m}px;left:${r.left-m}px;width:${r.width+m*2}px;height:${Math.min(r.height+m*2,innerHeight*.6)}px`;
  }else spot.style.cssText='top:50%;left:50%;width:0;height:0';
  box.innerHTML=`<div class="tb-h"><span>${this.i+1} de ${PASOS.length}</span>
    <button class="linkbtn" onclick="tour.cerrar()">Saltar</button></div>
   <b>${esc(p.t)}</b><p>${esc(p.d)}</p>
   <div class="tb-f">
    ${this.i?'<button class="btn" onclick="tour.atras()">Atrás</button>':'<span></span>'}
    <button class="btn pri" onclick="tour.siguiente()">${this.i===PASOS.length-1?'Terminar':'Siguiente'}</button></div>`;
  if(movil){box.style.cssText='left:12px;right:12px;bottom:84px;top:auto;width:auto';return;}
  const r=el?el.getBoundingClientRect():{top:innerHeight/2,left:innerWidth/2,width:0,height:0,bottom:innerHeight/2,right:innerWidth/2};
  const bw=320;let top,left;
  if(p.pos==='izq'){top=r.top;left=Math.max(16,r.left-bw-18);}
  else if(p.pos==='arriba'){top=Math.max(16,r.top-190);left=Math.min(innerWidth-bw-16,r.left);}
  else{top=r.bottom+16;left=Math.min(innerWidth-bw-16,Math.max(16,r.left));}
  if(top+220>innerHeight)top=Math.max(16,innerHeight-240);
  box.style.cssText=`top:${top}px;left:${left}px;width:${bw}px`;
 },
 siguiente(){if(this.i>=PASOS.length-1){this.cerrar();toast('Listo. Podés repetir la visita con el botón de ayuda.','ok');return;}
  this.i++;this.paso();},
 atras(){if(this.i)this.i--;this.paso();}
};

/* ---------- ayuda por sección ---------- */
const AYUDA={
 panel:{t:'Panel',d:'Resumen del mes elegido: facturación, unidades, cuentas que compraron y alertas abiertas.',
  l:['Las cuatro tarjetas de arriba comparan siempre contra el mes anterior.',
     'El gráfico de evolución muestra el año completo: pasá el mouse por cada mes.',
     'Mix por línea separa SNO oral, sonda y módulos.',
     'Las alertas de vencimiento salen del stock de logística.']},
 ventas:{t:'Ventas',d:'El registro de cada operación. Es la sección que hay que mantener al día.',
  l:['Cargá la venta apenas la cerrás, desde el celular.',
     'El precio viene del catálogo, pero se puede cambiar en cada venta.',
     'Al guardar se descuenta el stock del lote que vence primero.',
     'La cuenta avanza sola en el embudo: primera compra, activa y recurrente.']},
 cuentas:{t:'Cuentas',d:'Instituciones, farmacias, distribuidores y profesionales, con el estado del vínculo.',
  l:['El embudo va de prospecto a recurrente.',
     'Dormida = compró alguna vez y lleva más de 60 días sin recomprar. Es la lista de recuperación del mes.',
     'El botón editar de cada fila permite corregir datos o mover el estado a mano.']},
 catalogo:{t:'Catálogo',d:'Los 17 productos de la línea Bi¹, con precio, stock y cobertura.',
  l:['Tocá cualquier producto para cargar o corregir el precio de lista.',
     'La cobertura en meses compara el stock con el promedio vendido en los últimos tres meses.',
     'Menos de dos meses de cobertura es señal de reposición.']},
 stock:{t:'Stock y vencimientos',d:'Se alimenta de la planilla de logística. También se pueden cargar lotes a mano.',
  l:['La planilla tiene que estar compartida como "Cualquiera con el enlace · Lector".',
     'Reconoce las columnas producto o SKU, lote, unidades y vencimiento, en cualquier orden.',
     'Semáforo: 180 días vigilar, 90 urgente, 60 crítico.',
     'El sistema solo lee la planilla. Nunca escribe en ella.']},
 acciones:{t:'Acciones',d:'Cada acción de marketing con su inversión y lo que generó.',
  l:['Cargá jornadas, capacitaciones, muestreos, pautas y outreach.',
     'Contactos generados y cuentas abiertas son los que convierten la acción en resultado.',
     'Toda pieza necesita validación técnica y regulatoria antes de publicarse.']},
 base:{t:'Base de datos',d:'Todos los contactos en un solo padrón, con su origen.',
  l:['Importá un CSV para volcar de una las listas de jornadas y universidades.',
     'Vinculá el contacto a su institución para conectar marketing con la venta.',
     'Marcá el consentimiento: sin eso no se puede usar para envíos (Ley 25.326).']},
 reportes:{t:'Reportes',d:'El cierre del mes, listo para mandar.',
  l:['Ventas del mes en CSV, se abre en Excel.',
     'Reporte ejecutivo en PDF desde la impresión del navegador.',
     'El respaldo completo en JSON guarda todo el sistema por si hay que restaurarlo.']}
};
function ayuda(){
 const a=AYUDA[VISTA];
 const d=$('#dlg');
 d.innerHTML=`<div class="dlg-h"><b>${esc(a.t)}</b></div>
  <div class="dlg-b" style="display:block">
   <p style="margin:0 0 14px;color:var(--gris)">${esc(a.d)}</p>
   <ul class="hlist">${a.l.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div>
  <div class="dlg-f"><button class="btn" data-x="tour">Ver la visita guiada</button>
   <button class="btn pri" data-x="c">Entendido</button></div>`;
 d.showModal();
 d.querySelector('[data-x="c"]').onclick=()=>d.close();
 d.querySelector('[data-x="tour"]').onclick=()=>{d.close();tour.iniciar();};
}

/* ---------- menú en celular ---------- */
function abrirMenu(){document.body.classList.add('menu-on');}
function cerrarMenu(){document.body.classList.remove('menu-on');}
