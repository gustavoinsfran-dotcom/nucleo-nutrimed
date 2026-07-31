/* Capa de datos de NÚCLEO
   Modo demo  → arrays en memoria (assets/demo-data.js)
   Modo vivo  → Supabase (Postgres) con login por email
*/
const DB = {
  modo: 'demo',
  sb: null,
  user: null,

  async init() {
    const c = window.NUCLEO_CFG || {};
    if (!c.url || !c.key || typeof supabase === 'undefined') { this.modo = 'demo'; return this.modo; }
    this.sb = supabase.createClient(c.url, c.key);
    const { data } = await this.sb.auth.getSession();
    if (!data.session) { this.modo = 'login'; return this.modo; }
    this.user = data.session.user;
    await this.cargar();
    this.modo = 'vivo';
    return this.modo;
  },

  async login(email, pass) {
    const { data, error } = await this.sb.auth.signInWithPassword({ email, password: pass });
    if (error) throw error;
    this.user = data.user;
    await this.cargar();
    this.modo = 'vivo';
  },

  async logout() { await this.sb.auth.signOut(); location.reload(); },

  async cargar() {
    const t = n => this.sb.from(n).select('*');
    const [p, c, v, l, a, k] = await Promise.all([
      t('producto'), t('cuenta'), t('venta'), t('lote'), t('accion'), t('contacto')
    ]);
    const err = [p, c, v, l, a, k].find(r => r.error);
    if (err) throw err.error;

    PROD = p.data.map(r => ({ id: r.sku, n: r.nombre, cat: r.categoria, pres: r.presentacion, p: Number(r.precio) }));
    CUENTAS = c.data.map(r => ({ id: r.id, n: r.nombre, t: r.tipo, z: r.zona, e: r.estado, ref: r.referente || '—', desde: r.desde || '—' }));
    VENTAS = v.data.map(r => ({
      f: r.fecha, m: new Date(r.fecha + 'T12:00:00').getMonth(),
      c: r.cuenta_id, p: r.sku, u: r.unidades, pu: Number(r.precio_unitario), o: r.origen
    }));
    LOTES = l.data.map(r => ({ p: r.sku, l: r.lote, u: r.unidades, v: r.vencimiento }));
    ACCIONES = a.data.map(r => ({
      n: r.nombre, t: r.tipo, f: r.fecha, inv: Number(r.inversion || 0),
      cont: r.contactos || 0, cta: r.cuentas || 0, vta: r.ventas || 0, est: r.estado
    }));
    CONTACTOS = k.data.map(r => ({ n: r.nombre, r: r.rol, i: r.institucion, o: r.origen, f: r.alta, cta: r.cuenta_id }));
  },

  /* alta de venta + descuento FEFO */
  async addVenta(v) {
    let resto = v.u;
    const lotes = LOTES.filter(l => l.p === v.p).sort((a, b) => a.v.localeCompare(b.v));
    const tocados = [];
    lotes.forEach(l => { if (resto <= 0) return; const q = Math.min(l.u, resto); l.u -= q; resto -= q; tocados.push(l); });

    if (this.modo === 'vivo') {
      const { error } = await this.sb.from('venta').insert({
        fecha: v.f, cuenta_id: v.c, sku: v.p, unidades: v.u,
        precio_unitario: v.pu, origen: v.o, cargado_por: this.user?.email || null
      });
      if (error) throw error;
      for (const l of tocados) {
        await this.sb.from('lote').update({ unidades: l.u }).eq('sku', l.p).eq('lote', l.l);
      }
    }
    VENTAS.push(v);
    LOTES = LOTES.filter(l => l.u > 0);
  }
};
