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
