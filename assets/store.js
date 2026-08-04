/* ==========================================================
   Capa de datos de NÚCLEO
   - Con Supabase configurado  → los datos viven en la base, todos ven lo mismo.
   - Sin Supabase              → se guardan en este navegador, no se pierden al cerrar.
   En los dos casos la interfaz es la misma; abajo del menú se indica cuál está activo.
   ========================================================== */
const KEY = 'nucleo.v1';

const DB = {
  modo: 'local',      // 'local' | 'vivo' | 'login'
  sb: null,
  user: null,

  /* ---------- arranque ---------- */
  async init() {
    const c = window.NUCLEO_CFG || {};
    if (c.url && c.key && typeof supabase !== 'undefined') {
      this.sb = supabase.createClient(c.url, c.key);
      const { data } = await this.sb.auth.getSession();
      if (!data.session) { this.modo = 'login'; return this.modo; }
      this.user = data.session.user;
      await this.cargarRemoto();
      this.modo = 'vivo';
      return this.modo;
    }
    this.cargarLocal();
    this.modo = 'local';
    return this.modo;
  },

  async login(email, pass) {
    const { data, error } = await this.sb.auth.signInWithPassword({ email, password: pass });
    if (error) throw error;
    this.user = data.user;
    await this.cargarRemoto();
    this.modo = 'vivo';
  },
  async logout() { await this.sb.auth.signOut(); location.reload(); },

  /* ---------- navegador ---------- */
  cargarLocal() {
    let d = null;
    try { d = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { d = null; }
    if (!d) { this.sembrar(); return; }
    if (d.PROD && d.PROD.length) PROD = d.PROD;
    CUENTAS = d.CUENTAS || []; VENTAS = d.VENTAS || []; LOTES = d.LOTES || [];
    ACCIONES = d.ACCIONES || []; CONTACTOS = d.CONTACTOS || [];
    CFG_SHEET = d.CFG_SHEET || CFG_SHEET;
    if (d.CFG_TIENDA) CFG_TIENDA = d.CFG_TIENDA;
  },
  /* primera vez: deja cargadas las acciones de marketing ya realizadas */
  sembrar() {
    if (typeof ACCIONES_SEMILLA === 'undefined' || ACCIONES.length) return;
    ACCIONES = ACCIONES_SEMILLA.map((a, i) => ({ ...a, id: i + 1 }));
    this.guardarLocal();
  },

  guardarLocal() {
    if (this.modo === 'vivo') return;
    try {
      localStorage.setItem(KEY, JSON.stringify({ PROD, CUENTAS, VENTAS, LOTES, ACCIONES, CONTACTOS, CFG_SHEET, CFG_TIENDA }));
    } catch (e) { console.warn('No se pudo guardar en el navegador', e); }
  },

  /* ---------- Supabase ---------- */
  async cargarRemoto() {
    const t = n => this.sb.from(n).select('*');
    const [p, c, v, l, a, k] = await Promise.all([
      t('producto'), t('cuenta'), t('venta'), t('lote'), t('accion'), t('contacto')]);
    const err = [p, c, v, l, a, k].find(r => r.error);
    if (err) throw err.error;
    if (p.data.length) PROD = p.data.map(r => ({ id: r.sku, n: r.nombre, cat: r.categoria, pres: r.presentacion, p: Number(r.precio) }));
    CUENTAS = c.data.map(r => ({ id: r.id, n: r.nombre, t: r.tipo, z: r.zona, e: r.estado, ref: r.referente || '', tel: r.telefono || '', mail: r.email || '', notas: r.notas || '', desde: r.desde || '' }));
    VENTAS = v.data.map(r => ({ id: r.id, f: r.fecha, m: mesDe(r.fecha), c: r.cuenta_id, p: r.sku, u: r.unidades, pu: Number(r.precio_unitario), o: r.origen }));
    LOTES = l.data.map(r => ({ p: r.sku, l: r.lote, u: r.unidades, v: r.vencimiento }));
    ACCIONES = a.data.map(r => ({ id: r.id, n: r.nombre, t: r.tipo, f: r.fecha, inv: Number(r.inversion || 0), cont: r.contactos || 0, cta: r.cuentas || 0, vta: r.ventas || 0, est: r.estado }));
    CONTACTOS = k.data.map(r => ({ id: r.id, n: r.nombre, r: r.rol, i: r.institucion, mail: r.email || '', tel: r.telefono || '', o: r.origen, f: r.alta, cta: r.cuenta_id, cons: r.consentimiento }));
  },

  /* ---------- altas ---------- */
  async addCuenta(x) {
    if (this.modo === 'vivo') {
      const { data, error } = await this.sb.from('cuenta').insert({
        nombre: x.n, tipo: x.t, zona: x.z, referente: x.ref, telefono: x.tel,
        email: x.mail, estado: x.e, notas: x.notas, desde: x.desde }).select().single();
      if (error) throw error;
      x.id = data.id;
    } else { x.id = (CUENTAS.reduce((a, c) => Math.max(a, c.id || 0), 0) || 0) + 1; }
    CUENTAS.push(x); this.guardarLocal(); return x;
  },

  async updCuenta(id, campos) {
    const c = C(id); if (!c) return;
    Object.assign(c, campos);
    if (this.modo === 'vivo') {
      await this.sb.from('cuenta').update({
        nombre: c.n, tipo: c.t, zona: c.z, referente: c.ref, telefono: c.tel,
        email: c.mail, estado: c.e, notas: c.notas }).eq('id', id);
    }
    this.guardarLocal();
  },

  async addContacto(x) {
    if (this.modo === 'vivo') {
      const { data, error } = await this.sb.from('contacto').insert({
        nombre: x.n, rol: x.r, institucion: x.i, email: x.mail, telefono: x.tel,
        origen: x.o, cuenta_id: x.cta || null, consentimiento: !!x.cons, alta: x.f }).select().single();
      if (error) throw error;
      x.id = data.id;
    } else { x.id = (CONTACTOS.reduce((a, c) => Math.max(a, c.id || 0), 0) || 0) + 1; }
    CONTACTOS.push(x); this.guardarLocal(); return x;
  },

  async addAccion(x) {
    if (this.modo === 'vivo') {
      const { data, error } = await this.sb.from('accion').insert({
        nombre: x.n, tipo: x.t, fecha: x.f, inversion: x.inv, contactos: x.cont,
        cuentas: x.cta, ventas: x.vta, estado: x.est }).select().single();
      if (error) throw error;
      x.id = data.id;
    } else { x.id = (ACCIONES.reduce((a, c) => Math.max(a, c.id || 0), 0) || 0) + 1; }
    ACCIONES.push(x); this.guardarLocal(); return x;
  },

  async addLote(x) {
    const ex = LOTES.find(l => l.p === x.p && l.l === x.l);
    if (ex) { ex.u = x.u; ex.v = x.v; } else { LOTES.push(x); }
    if (this.modo === 'vivo') {
      await this.sb.from('lote').upsert({ sku: x.p, lote: x.l, unidades: x.u, vencimiento: x.v });
    }
    this.guardarLocal();
  },

  async setPrecio(sku, precio, costo) {
    const p = P(sku); if (!p) return;
    p.p = precio;
    if (costo !== undefined && costo !== null && isFinite(costo)) p.costo = costo || 0;
    if (this.modo === 'vivo') await this.sb.from('producto').update({ precio, costo: p.costo || null }).eq('sku', sku);
    this.guardarLocal();
  },

  /* alta de venta con descuento FEFO.
     Las ventas importadas del sistema NO descuentan: el archivo de stock del sistema
     ya viene con esas salidas aplicadas. Descuentan solo las que se cargan a mano
     y las del ecommerce, que todavía no están reflejadas en el archivo. */
  async addVenta(v, sinStock) {
    let resto = sinStock ? 0 : v.u;
    const tocados = [];
    if (!sinStock) LOTES.filter(l => l.p === v.p).sort((a, b) => a.v.localeCompare(b.v)).forEach(l => {
      if (resto <= 0) return;
      const q = Math.min(l.u, resto); l.u -= q; resto -= q; tocados.push(l);
    });
    if (this.modo === 'vivo') {
      const { error } = await this.sb.from('venta').insert({
        fecha: v.f, cuenta_id: v.c, sku: v.p, unidades: v.u,
        precio_unitario: v.pu, origen: v.o, pedido: v.ped || null, cargado_por: this.user?.email || null });
      if (error) throw error;
      for (const l of tocados) await this.sb.from('lote').update({ unidades: l.u }).eq('sku', l.p).eq('lote', l.l);
    }
    VENTAS.push(v);
    LOTES = LOTES.filter(l => l.u > 0);
    /* la cuenta avanza sola en el embudo */
    const c = C(v.c);
    if (c) {
      const compras = VENTAS.filter(x => x.c === c.id).length;
      const nuevo = compras >= 3 ? 'Recurrente' : compras === 1 ? 'Primera compra' : 'Activa';
      if (ESTADOS.indexOf(nuevo) > ESTADOS.indexOf(c.e) || c.e === 'Dormida') await this.updCuenta(c.id, { e: nuevo });
      if (!c.desde) await this.updCuenta(c.id, { desde: v.f });
    }
    this.guardarLocal();
  },

  /* reemplazo completo de lotes — lo usa la sincronización con logística */
  async reemplazarLotes(nuevos) {
    LOTES = nuevos;
    if (this.modo === 'vivo') {
      await this.sb.from('lote').delete().neq('sku', '');
      if (nuevos.length) await this.sb.from('lote').insert(
        nuevos.map(l => ({ sku: l.p, lote: l.l, unidades: l.u, vencimiento: l.v })));
    }
    this.guardarLocal();
  },

  /* ---------- respaldo ---------- */
  exportar() { return JSON.stringify({ PROD, CUENTAS, VENTAS, LOTES, ACCIONES, CONTACTOS, CFG_SHEET, CFG_TIENDA }, null, 2); },
  importar(txt) {
    const d = JSON.parse(txt);
    if (d.PROD) PROD = d.PROD;
    CUENTAS = d.CUENTAS || []; VENTAS = d.VENTAS || []; LOTES = d.LOTES || [];
    ACCIONES = d.ACCIONES || []; CONTACTOS = d.CONTACTOS || [];
    CFG_SHEET = d.CFG_SHEET || CFG_SHEET;
    if (d.CFG_TIENDA) CFG_TIENDA = d.CFG_TIENDA;
    this.guardarLocal();
  }
};

function mesDe(f) { return Math.max(0, Math.min(11, +String(f).split('-')[1] - 1)); }
