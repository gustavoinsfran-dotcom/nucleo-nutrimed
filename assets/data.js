/* ==========================================================
   Catálogo base — línea Bi¹ de nutrición clínica
   Nombres comerciales y agrupación tomados del vademécum 2026.
   Los precios se cargan desde Catálogo; las fotos van en assets/productos/.
   Todo lo demás (cuentas, ventas, stock, contactos) lo carga el equipo.
   ========================================================== */
var MESES=['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

var PROD=[
 /* --- Enteral oral estándar --- */
 {id:'SNO-HCHP-300',n:'Bi¹ hp/hc',d:'Hipercalórico e hiperproteico · sabor melocotón',cat:'SNO',sub:'Oral estándar',pres:'Brik 200 ml',p:0},
 {id:'SNO-NCHP-300',n:'Bi¹ hp fibra',d:'Normocalórico, hiperproteico con fibra · capuchino',cat:'SNO',sub:'Oral estándar',pres:'Brik 200 ml',p:0},
 {id:'SNO-NPHC-300',n:'Bi¹ plus',d:'Normoproteico e hipercalórico · sabor frutilla',cat:'SNO',sub:'Oral estándar',pres:'Brik 200 ml',p:0},
 /* --- Enteral oral específica --- */
 {id:'SNO-DBHC-300',n:'Bi¹ diacare hp/hc',d:'Diabetes · hipercalórico e hiperproteico · capuchino',cat:'SNO',sub:'Oral específica',pres:'Brik 200 ml',p:0},
 {id:'SNO-DBNC-400',n:'Bi¹ diacare',d:'Diabetes · normocalórico e hiperproteico · vainilla',cat:'SNO',sub:'Oral específica',pres:'Brik 200 ml',p:0},
 {id:'SNO-INMU-300',n:'Bi¹ procare',d:'Con inmunonutrientes · sabor mandarina',cat:'SNO',sub:'Oral específica',pres:'Brik 200 ml',p:0},
 {id:'SNO-ONCO-300',n:'Bi¹ alisenoc',d:'Paciente oncológico · sabor vainilla',cat:'SNO',sub:'Oral específica',pres:'Brik 200 ml',p:0},
 {id:'SNO-PEPT-240',n:'Bi¹ peptidic',d:'Fórmula peptídica · sabor vainilla',cat:'SNO',sub:'Oral específica',pres:'Brik 200 ml',p:0},
 /* --- Enteral sonda estándar --- */
 {id:'SND-HCHP-400',n:'Bi¹Via hp/hc fibra',d:'Hipercalórica e hiperproteica con fibra',cat:'Sonda',sub:'Sonda estándar',pres:'Listo para administrar',p:0},
 {id:'SND-NCNP-400',n:'Bi¹Via standard fibra',d:'Normocalórica y normoproteica con fibra',cat:'Sonda',sub:'Sonda estándar',pres:'Listo para administrar',p:0},
 /* --- Enteral sonda específica --- */
 {id:'SND-DBHC-400',n:'Bi¹Via diacare hp/hc',d:'Diabetes · hipercalórica e hiperproteica',cat:'Sonda',sub:'Sonda específica',pres:'Listo para administrar',p:0},
 {id:'SND-DBNC-400',n:'Bi¹Via diacare',d:'Diabetes · normocalórica y normoproteica',cat:'Sonda',sub:'Sonda específica',pres:'Listo para administrar',p:0},
 {id:'SND-INMU-400',n:'Bi¹Via procare',d:'Con inmunonutrientes',cat:'Sonda',sub:'Sonda específica',pres:'Listo para administrar',p:0},
 /* --- Módulos --- */
 {id:'MOD-ESPE-240',n:'Espesante Bi¹',d:'Espesante instantáneo · neutro',cat:'Módulos',sub:'Módulo',pres:'Lata 240 g',p:0},
 {id:'MOD-CLEA-000',n:'Bi¹ clear',d:'Fórmula clara, sin residuos',cat:'Módulos',sub:'Módulo',pres:'A confirmar',p:0},
 {id:'MOD-PROT-100',n:'Bi¹ protein',d:'Módulo proteico · sabor limón',cat:'Módulos',sub:'Módulo',pres:'Caja 100 x 7 g',p:0},
 {id:'MOD-AMIN-100',n:'Bi¹ aminomix',d:'Módulo de aminoácidos · sabor limón',cat:'Módulos',sub:'Módulo',pres:'Caja 100 x 7 g',p:0},
 {id:'MOD-ARGI-000',n:'Bi¹ arginin',d:'Módulo de arginina',cat:'Módulos',sub:'Módulo',pres:'A confirmar',p:0},
 {id:'MOD-GLUT-100',n:'Bi¹ glutamin',d:'Módulo de L-glutamina',cat:'Módulos',sub:'Módulo',pres:'Caja 100 x 7 g',p:0}
];

/* Datos operativos: arrancan vacíos. Los carga el equipo. */
var CUENTAS=[], VENTAS=[], LOTES=[], ACCIONES=[], CONTACTOS=[];

var ESTADOS=['Prospecto','Contactada','Muestra entregada','Primera compra','Activa','Recurrente','Dormida'];
var TIPOS_CUENTA=['Institución','Farmacia','Distribuidor','Profesional'];
var ORIGENES_VENTA=['Visita en campo','Recompra','Acción de marketing','Inbound institucional','Licitación'];
var TIPOS_ACCION=['Jornada','Académica','Institucional','Campo','Digital','Otra'];

/* ---------- base de contactos ----------
   La CATEGORÍA la declara la persona. Mientras no lo haga queda "A confirmar":
   no se completa por inferencia, porque de ahí salen los mensajes equivocados. */
var CATEGORIAS=['A confirmar','Estudiante','Docente','Profesional'];
/* De dónde salió el dato. Es lo único que sabemos con certeza desde el día uno. */
var TIPOS_ORIGEN=['Académico','Asistencial','Digital','Comercial'];
/* Cómo se mueve el contacto. Cada paso lo dispara un hecho, no una intención. */
var ETAPAS=['Cargado','Contactado','Declaró categoría','Interactuó','Cuenta abierta'];
var CONSENTIMIENTO=['Pendiente','Otorgado','Baja'];

var P=id=>PROD.find(x=>x.id===id);
var C=id=>CUENTAS.find(x=>x.id===id);

/* ==========================================================
   Acciones de marketing ya realizadas — datos reales del equipo.
   Se cargan la primera vez que se abre el sistema y después se
   pueden editar o completar desde la sección Acciones.
   ========================================================== */
var ACCIONES_SEMILLA=[
 {n:'Sorteo de becas — Jornada Nutrición Clínica (Hospital Británico)',t:'Digital',f:'2026-07-24',
  inv:60000,cont:359,cta:0,vta:0,est:'En curso',
  nota:'Pauta IG desde @infinity.nutricion.ar, 24/07 al 02/08, $6.000 por día. Audiencia Salud y Nutrición AMBA, radio de 25 km desde el Hospital Británico, 18 a 55 años. Al 27/07: 23.015 visualizaciones, 13.337 de alcance, 403 visitas al perfil, +87 seguidores (la cuenta pasó de 54 a 141), 359 comentarios, 16 guardados y 13 compartidos.'},
 {n:'Jornada de Nutrición Clínica — Hospital Británico',t:'Jornada',f:'2026-08-07',
  inv:0,cont:10,cta:0,vta:0,est:'En curso',
  nota:'30 becas en total: 10 del cupo "Los elegidos" (confirmadas, profesionales de instituciones), 10 del cupo Acción IG y 10 de universidades y estudiantes. Al 31/07 hay 10 confirmadas y 20 disponibles. Los contactos con sus datos personales se importan por CSV desde Base de datos: no viajan en el código del sitio.'},
 {n:'Vademécum digital — descargas por DM',t:'Digital',f:'2026-07-24',
  inv:0,cont:9,cta:0,vta:0,est:'Permanente',
  nota:'Automatización ManyChat en plan gratuito: 9 DMs enviados y 5 clics al vademécum (CTR 56%). El límite de 25 contactos se alcanzó el 25/07.'},
 {n:'Outreach institucional por DM',t:'Institucional',f:'2026-07-24',
  inv:0,cont:7,cta:0,vta:0,est:'En curso',
  nota:'Cuentas contactadas: @entrenutris (respondieron), @nutricionresidenciacaba, @sancnutricion, @sanutricion, @escuelanutricionuba, @esp.nutricionclinica.uba y @colegionutricionistaspba. AALEN por canal institucional, no por DM frío.'}
];
