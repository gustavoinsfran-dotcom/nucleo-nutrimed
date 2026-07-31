/* ==========================================================
   Catálogo base — línea Bi¹ de nutrición clínica
   Es el único dato precargado del sistema y sale del vademécum.
   Los precios se cargan desde Catálogo; las fotos van en assets/productos/.
   Todo lo demás (cuentas, ventas, stock, contactos) lo carga el equipo.
   ========================================================== */
var MESES=['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

var PROD=[
 {id:'SNO-HCHP-300',n:'SNO Hipercalórico Hiperproteico',cat:'SNO',pres:'Lata 300 g',p:0},
 {id:'SNO-NCHP-300',n:'SNO Normocalórico Hiperproteico c/ fibra',cat:'SNO',pres:'Lata 300 g',p:0},
 {id:'SNO-NPHC-300',n:'SNO Normoproteico Hipercalórico',cat:'SNO',pres:'Lata 300 g',p:0},
 {id:'SNO-DBHC-300',n:'SNO Diabetes Hipercalórico Hiperproteico',cat:'SNO',pres:'Lata 300 g',p:0},
 {id:'SNO-DBNC-400',n:'SNO Diabetes Normocalórico Hiperproteico',cat:'SNO',pres:'Lata 400 g',p:0},
 {id:'SNO-INMU-300',n:'SNO Inmunonutrientes',cat:'SNO',pres:'Lata 300 g',p:0},
 {id:'SNO-ONCO-300',n:'SNO Oncológico',cat:'SNO',pres:'Lata 300 g',p:0},
 {id:'SNO-PEPT-240',n:'SNO Peptídico neutro',cat:'SNO',pres:'Lata 240 g',p:0},
 {id:'SND-HCHP-400',n:'Fórmula sonda Hipercalórica Hiperproteica c/ fibra',cat:'Sonda',pres:'Lata 400 g',p:0},
 {id:'SND-NCNP-400',n:'Fórmula sonda Normocalórica Normoproteica c/ fibra',cat:'Sonda',pres:'Lata 400 g',p:0},
 {id:'SND-DBHC-400',n:'Fórmula sonda Diabetes Hipercalórica',cat:'Sonda',pres:'Lata 400 g',p:0},
 {id:'SND-DBNC-400',n:'Fórmula sonda Diabetes Normocalórica Normoproteica',cat:'Sonda',pres:'Lata 400 g',p:0},
 {id:'SND-INMU-400',n:'Fórmula sonda Inmunonutrientes',cat:'Sonda',pres:'Lata 400 g',p:0},
 {id:'MOD-ESPE-240',n:'Módulo Espesante instantáneo',cat:'Módulos',pres:'Lata 240 g',p:0},
 {id:'MOD-PROT-100',n:'Módulo Proteico limón',cat:'Módulos',pres:'Caja 100 x 7 g',p:0},
 {id:'MOD-AMIN-100',n:'Módulo de Aminoácidos limón',cat:'Módulos',pres:'Caja 100 x 7 g',p:0},
 {id:'MOD-GLUT-100',n:'Módulo L-Glutamina',cat:'Módulos',pres:'Caja 100 x 7 g',p:0}
];

/* Datos operativos: arrancan vacíos. Los carga el equipo. */
var CUENTAS=[], VENTAS=[], LOTES=[], ACCIONES=[], CONTACTOS=[];

var ESTADOS=['Prospecto','Contactada','Muestra entregada','Primera compra','Activa','Recurrente','Dormida'];
var TIPOS_CUENTA=['Institución','Farmacia','Distribuidor','Profesional'];
var ORIGENES_VENTA=['Visita en campo','Recompra','Acción de marketing','Inbound institucional','Licitación'];
var TIPOS_ACCION=['Jornada','Académica','Institucional','Campo','Digital','Otra'];

var P=id=>PROD.find(x=>x.id===id);
var C=id=>CUENTAS.find(x=>x.id===id);

/* ==========================================================
   Acciones de marketing ya realizadas — datos reales del equipo.
   Se cargan la primera vez que se abre el sistema y después se
   pueden editar o completar desde la sección Acciones.
   ========================================================== */
var ACCIONES_SEMILLA=[
 {n:'Sorteo 10 becas — Jornada Nutrición Clínica (Hospital Británico)',t:'Digital',f:'2026-07-24',
  inv:60000,cont:359,cta:0,vta:0,est:'En curso',
  nota:'Pauta IG desde @infinity.nutricion.ar, 24/07 al 02/08, $6.000/día. Audiencia Salud y Nutrición AMBA, radio 25 km desde el Hospital Británico, 18–55 años. Al 27/07: 23.015 visualizaciones, 13.337 de alcance, 403 visitas al perfil, +87 seguidores (la cuenta pasó de 54 a 141), 359 comentarios, 16 guardados, 13 compartidos.'},
 {n:'Jornada de Nutrición Clínica — Hospital Británico',t:'Jornada',f:'2026-08-02',
  inv:0,cont:0,cta:0,vta:0,est:'En curso',
  nota:'Jornada para la que se sortearon las 10 becas. Completar asistentes y contactos generados al cierre.'},
 {n:'Vademécum digital — descargas por DM',t:'Digital',f:'2026-07-24',
  inv:0,cont:9,cta:0,vta:0,est:'Permanente',
  nota:'Automatización ManyChat plan free: 9 DMs enviados, 5 clics al vademécum (CTR 56%). Límite de 25 contactos alcanzado el 25/07.'},
 {n:'Outreach institucional por DM',t:'Institucional',f:'2026-07-24',
  inv:0,cont:7,cta:0,vta:0,est:'En curso',
  nota:'Cuentas contactadas: @entrenutris (respondieron), @nutricionresidenciacaba, @sancnutricion, @sanutricion, @escuelanutricionuba, @esp.nutricionclinica.uba, @colegionutricionistaspba. AALEN por canal institucional, no por DM frío.'}
];
