/* Datos de ejemplo — se usan solo cuando no hay conexión a Supabase (modo demo). */
/* ============ 1. DATOS DE EJEMPLO ============ */
var MESES=['Ene','Feb','Mar','Abr','May','Jun','Jul'];
var PROD=[
 {id:'SNO-HCHP-300',n:'SNO Hipercalórico Hiperproteico',cat:'SNO',pres:'Lata 300 g',p:21500},
 {id:'SNO-NCHP-300',n:'SNO Normocalórico Hiperproteico c/ fibra',cat:'SNO',pres:'Lata 300 g',p:20800},
 {id:'SNO-NPHC-300',n:'SNO Normoproteico Hipercalórico',cat:'SNO',pres:'Lata 300 g',p:20200},
 {id:'SNO-DBHC-300',n:'SNO Diabetes Hipercalórico Hiperproteico',cat:'SNO',pres:'Lata 300 g',p:23400},
 {id:'SNO-DBNC-400',n:'SNO Diabetes Normocalórico Hiperproteico',cat:'SNO',pres:'Lata 400 g',p:27900},
 {id:'SNO-INMU-300',n:'SNO Inmunonutrientes',cat:'SNO',pres:'Lata 300 g',p:29500},
 {id:'SNO-ONCO-300',n:'SNO Oncológico',cat:'SNO',pres:'Lata 300 g',p:31200},
 {id:'SNO-PEPT-240',n:'SNO Peptídico neutro',cat:'SNO',pres:'Lata 240 g',p:33800},
 {id:'SND-HCHP-400',n:'Fórmula sonda Hipercalórica Hiperproteica c/ fibra',cat:'Sonda',pres:'Lata 400 g',p:26800},
 {id:'SND-NCNP-400',n:'Fórmula sonda Normocalórica Normoproteica c/ fibra',cat:'Sonda',pres:'Lata 400 g',p:25100},
 {id:'SND-DBHC-400',n:'Fórmula sonda Diabetes Hipercalórica',cat:'Sonda',pres:'Lata 400 g',p:28300},
 {id:'SND-INMU-400',n:'Fórmula sonda Inmunonutrientes',cat:'Sonda',pres:'Lata 400 g',p:32600},
 {id:'MOD-ESPE-240',n:'Módulo Espesante instantáneo',cat:'Módulos',pres:'Lata 240 g',p:19400},
 {id:'MOD-PROT-100',n:'Módulo Proteico limón',cat:'Módulos',pres:'Caja 100 x 7 g',p:88000},
 {id:'MOD-AMIN-100',n:'Módulo de Aminoácidos limón',cat:'Módulos',pres:'Caja 100 x 7 g',p:94500},
 {id:'MOD-GLUT-100',n:'Módulo L-Glutamina',cat:'Módulos',pres:'Caja 100 x 7 g',p:97200}
];
var P=id=>PROD.find(x=>x.id===id);

var CUENTAS=[
 {id:1,n:'Hospital Británico — Servicio de Nutrición',t:'Institución',z:'CABA',e:'Recurrente',ref:'Lic. M. Ferrari',desde:'Feb'},
 {id:2,n:'Sanatorio Anchorena',t:'Institución',z:'CABA',e:'Recurrente',ref:'Dra. L. Paz',desde:'Mar'},
 {id:3,n:'Geriátrico Los Nogales',t:'Institución',z:'GBA Norte',e:'Recurrente',ref:'Lic. C. Duarte',desde:'Feb'},
 {id:4,n:'Farmacia Del Águila',t:'Farmacia',z:'CABA',e:'Recurrente',ref:'Farm. J. Vega',desde:'Ene'},
 {id:5,n:'Clínica Zabala',t:'Institución',z:'CABA',e:'Activa',ref:'Lic. S. Miño',desde:'Abr'},
 {id:6,n:'Instituto Oncológico Belgrano',t:'Institución',z:'CABA',e:'Activa',ref:'Dr. R. Sosa',desde:'May'},
 {id:7,n:'Residencia Villa Adelina',t:'Institución',z:'GBA Norte',e:'Activa',ref:'Lic. P. Rey',desde:'Abr'},
 {id:8,n:'Droguería Sur Salud',t:'Distribuidor',z:'GBA Sur',e:'Activa',ref:'Sr. D. Ledesma',desde:'Mar'},
 {id:9,n:'Lic. Ana Torres — consultorio',t:'Profesional',z:'CABA',e:'Activa',ref:'Ana Torres',desde:'Jun'},
 {id:10,n:'Hospital Alemán — Soporte Nutricional',t:'Institución',z:'CABA',e:'Primera compra',ref:'Lic. F. Bianchi',desde:'Jul'},
 {id:11,n:'Sanatorio Las Lomas',t:'Institución',z:'GBA Norte',e:'Primera compra',ref:'Dra. V. Correa',desde:'Jul'},
 {id:12,n:'Farmacia Nutrivida',t:'Farmacia',z:'GBA Oeste',e:'Primera compra',ref:'Farm. E. Ruiz',desde:'Jul'},
 {id:13,n:'Hospital Italiano — Nutrición',t:'Institución',z:'CABA',e:'Muestra entregada',ref:'Lic. G. Ponce',desde:'—'},
 {id:14,n:'Clínica Bazterrica',t:'Institución',z:'CABA',e:'Muestra entregada',ref:'Dra. N. Ayala',desde:'—'},
 {id:15,n:'Hogar San José',t:'Institución',z:'GBA Sur',e:'Muestra entregada',ref:'Lic. M. Britos',desde:'—'},
 {id:16,n:'Sanatorio Güemes',t:'Institución',z:'CABA',e:'Contactada',ref:'Lic. H. Ramos',desde:'—'},
 {id:17,n:'Hospital Austral',t:'Institución',z:'GBA Norte',e:'Contactada',ref:'Dr. I. Funes',desde:'—'},
 {id:18,n:'Red Geriátrica Norte (4 sedes)',t:'Institución',z:'GBA Norte',e:'Contactada',ref:'Sra. B. Nieto',desde:'—'},
 {id:19,n:'Clínica San Camilo',t:'Institución',z:'CABA',e:'Prospecto',ref:'—',desde:'—'},
 {id:20,n:'Sanatorio Trinidad Palermo',t:'Institución',z:'CABA',e:'Prospecto',ref:'—',desde:'—'},
 {id:21,n:'Farmacia Central Morón',t:'Farmacia',z:'GBA Oeste',e:'Prospecto',ref:'—',desde:'—'},
 {id:22,n:'Geriátrico Del Sol',t:'Institución',z:'GBA Sur',e:'Dormida',ref:'Lic. O. Vera',desde:'Feb'}
];
var C=id=>CUENTAS.find(x=>x.id===id);
var ESTADOS=['Prospecto','Contactada','Muestra entregada','Primera compra','Activa','Recurrente','Dormida'];

/* ventas sintéticas ene→jul con crecimiento */
var VENTAS=[];
(function(){
 let seed=7; const rnd=()=>(seed=(seed*1103515245+12345)%2147483648)/2147483648;
 const plan=[ {m:0,n:4,cu:[4,22]}, {m:1,n:7,cu:[1,3,4,22]}, {m:2,n:11,cu:[1,2,3,4,8]},
   {m:3,n:14,cu:[1,2,3,4,5,7,8]}, {m:4,n:18,cu:[1,2,3,4,5,6,7,8]},
   {m:5,n:22,cu:[1,2,3,4,5,6,7,8,9]}, {m:6,n:27,cu:[1,2,3,4,5,6,7,8,9,10,11,12]} ];
 const orig=['Visita en campo','Recompra','Acción de marketing','Inbound institucional'];
 plan.forEach(pl=>{
  for(let i=0;i<pl.n;i++){
   const cu=pl.cu[Math.floor(rnd()*pl.cu.length)];
   const r=rnd(), pool=r<.58?PROD.filter(p=>p.cat==='SNO'):r<.86?PROD.filter(p=>p.cat==='Sonda'):PROD.filter(p=>p.cat==='Módulos');
   const pr=pool[Math.floor(rnd()*pool.length)];
   const base=C(cu).t==='Institución'?12:C(cu).t==='Distribuidor'?24:6;
   let u=Math.max(2,Math.round(base*(0.5+rnd())));
   if(pr.pres.startsWith('Caja')) u=1+Math.floor(rnd()*3);
   const d=1+Math.floor(rnd()*27);
   VENTAS.push({f:`2026-${String(pl.m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`,m:pl.m,c:cu,p:pr.id,u,pu:pr.p,o:i===0?'Visita en campo':orig[Math.floor(rnd()*orig.length)]});
  }
 });
})();

var LOTES=[
 {p:'SNO-HCHP-300',l:'L2508A',u:186,v:'2026-11-20'},
 {p:'SNO-HCHP-300',l:'L2601B',u:240,v:'2027-04-15'},
 {p:'SNO-NCHP-300',l:'L2507C',u:64,v:'2026-09-10'},
 {p:'SNO-NPHC-300',l:'L2512D',u:145,v:'2027-01-28'},
 {p:'SNO-DBHC-300',l:'L2509E',u:98,v:'2026-10-05'},
 {p:'SNO-DBNC-400',l:'L2602F',u:120,v:'2027-05-30'},
 {p:'SNO-INMU-300',l:'L2506G',u:38,v:'2026-08-22'},
 {p:'SNO-ONCO-300',l:'L2511H',u:76,v:'2026-12-12'},
 {p:'SNO-PEPT-240',l:'L2603J',u:54,v:'2027-06-18'},
 {p:'SND-HCHP-400',l:'L2510K',u:210,v:'2026-12-01'},
 {p:'SND-NCNP-400',l:'L2604L',u:168,v:'2027-07-09'},
 {p:'SND-DBHC-400',l:'L2508M',u:42,v:'2026-09-28'},
 {p:'SND-INMU-400',l:'L2605N',u:88,v:'2027-08-14'},
 {p:'MOD-ESPE-240',l:'L2507P',u:26,v:'2026-08-30'},
 {p:'MOD-PROT-100',l:'L2601Q',u:63,v:'2027-03-22'},
 {p:'MOD-AMIN-100',l:'L2606R',u:41,v:'2027-09-05'},
 {p:'MOD-GLUT-100',l:'L2512S',u:19,v:'2027-02-11'}
];

var ACCIONES=[
 {n:'Jornada Nutrición Clínica — Hospital Británico',t:'Jornada',f:'2026-08-02',inv:60000,cont:359,cta:4,vta:0,est:'En curso'},
 {n:'Sorteo 10 becas (IG pauta)',t:'Digital',f:'2026-07-24',inv:60000,cont:359,cta:2,vta:0,est:'En curso'},
 {n:'Capacitación USAL — Nutrición',t:'Académica',f:'2026-06-11',inv:0,cont:84,cta:3,vta:2,est:'Cerrada'},
 {n:'Ateneo Sanatorio Anchorena',t:'Institucional',f:'2026-05-20',inv:45000,cont:22,cta:2,vta:2,est:'Cerrada'},
 {n:'Muestreo geriátricos GBA Norte',t:'Campo',f:'2026-04-08',inv:180000,cont:31,cta:6,vta:4,est:'Cerrada'},
 {n:'Vademécum digital — descargas',t:'Digital',f:'2026-03-01',inv:0,cont:146,cta:5,vta:3,est:'Permanente'},
 {n:'Universidad de Belgrano — clase abierta',t:'Académica',f:'2026-02-19',inv:0,cont:57,cta:1,vta:1,est:'Cerrada'}
];

var CONTACTOS=[
 {n:'Lic. Micaela Ferrari',r:'Nutricionista',i:'Hospital Británico',o:'Muestreo geriátricos',f:'2026-04-12',cta:1},
 {n:'Dra. Laura Paz',r:'Médica clínica',i:'Sanatorio Anchorena',o:'Ateneo Anchorena',f:'2026-05-20',cta:2},
 {n:'Lic. Carla Duarte',r:'Nutricionista',i:'Geriátrico Los Nogales',o:'Muestreo geriátricos',f:'2026-04-08',cta:3},
 {n:'Lic. Sofía Miño',r:'Nutricionista',i:'Clínica Zabala',o:'Vademécum digital',f:'2026-03-28',cta:5},
 {n:'Dr. Ricardo Sosa',r:'Oncólogo',i:'Inst. Oncológico Belgrano',o:'Capacitación USAL',f:'2026-06-11',cta:6},
 {n:'Lic. Paula Rey',r:'Nutricionista',i:'Residencia Villa Adelina',o:'Muestreo geriátricos',f:'2026-04-08',cta:7},
 {n:'Lic. Ana Torres',r:'Nutricionista',i:'Consultorio privado',o:'Capacitación USAL',f:'2026-06-11',cta:9},
 {n:'Lic. Florencia Bianchi',r:'Nutricionista',i:'Hospital Alemán',o:'Sorteo becas IG',f:'2026-07-25',cta:10},
 {n:'Dra. Verónica Correa',r:'Geriatra',i:'Sanatorio Las Lomas',o:'Sorteo becas IG',f:'2026-07-26',cta:11},
 {n:'Lic. Gabriel Ponce',r:'Nutricionista',i:'Hospital Italiano',o:'Jornada Hosp. Británico',f:'2026-07-28',cta:13},
 {n:'Dra. Natalia Ayala',r:'Médica clínica',i:'Clínica Bazterrica',o:'Jornada Hosp. Británico',f:'2026-07-28',cta:14},
 {n:'Lic. Martín Britos',r:'Nutricionista',i:'Hogar San José',o:'Vademécum digital',f:'2026-06-02',cta:15},
 {n:'Lic. Hernán Ramos',r:'Nutricionista',i:'Sanatorio Güemes',o:'Sorteo becas IG',f:'2026-07-27',cta:16},
 {n:'Est. Julieta Sández',r:'Estudiante avanzada',i:'USAL',o:'Capacitación USAL',f:'2026-06-11',cta:null},
 {n:'Est. Tomás Aguirre',r:'Estudiante avanzada',i:'U. de Belgrano',o:'UB clase abierta',f:'2026-02-19',cta:null},
 {n:'Lic. Rocío Medina',r:'Nutricionista',i:'Independiente',o:'Sorteo becas IG',f:'2026-07-26',cta:null}
];

window.DEMO={PROD,CUENTAS,VENTAS,LOTES,ACCIONES,CONTACTOS};
