/* ==========================================================
   Sincronización con la planilla de logística (Google Sheets)
   La planilla tiene que estar compartida como "Cualquiera con el enlace · Lector".
   Se lee cada vez que se abre el sitio y con el botón Sincronizar.
   No escribe nada en la planilla: solo lee.
   ========================================================== */
var CFG_SHEET = { url: '', hoja: '', ultima: '', auto: true };

const SHEET = {
  idDe(url) {
    const m = String(url).match(/\/d\/([a-zA-Z0-9-_]+)/);
    return m ? m[1] : null;
  },
  gidDe(url) {
    const m = String(url).match(/[#&?]gid=([0-9]+)/);
    return m ? m[1] : null;
  },
  endpoint(url, hoja) {
    const id = this.idDe(url);
    if (!id) return null;
    let e = `https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:csv`;
    const gid = this.gidDe(url);
    if (hoja) e += '&sheet=' + encodeURIComponent(hoja);
    else if (gid) e += '&gid=' + gid;
    return e;
  },

  /* CSV con comillas y saltos de línea dentro de celdas */
  parseCSV(txt) {
    const filas = []; let f = [], c = '', q = false;
    for (let i = 0; i < txt.length; i++) {
      const ch = txt[i];
      if (q) {
        if (ch === '"' && txt[i + 1] === '"') { c += '"'; i++; }
        else if (ch === '"') q = false;
        else c += ch;
      } else if (ch === '"') q = true;
      else if (ch === ',') { f.push(c); c = ''; }
      else if (ch === '\n') { f.push(c); filas.push(f); f = []; c = ''; }
      else if (ch !== '\r') c += ch;
    }
    if (c || f.length) { f.push(c); filas.push(f); }
    return filas.filter(r => r.some(x => String(x).trim() !== ''));
  },

  norm(s) {
    return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  },

  /* encuentra la columna cuyo encabezado contenga alguna de las palabras */
  col(head, palabras) {
    for (let i = 0; i < head.length; i++) {
      const h = this.norm(head[i]);
      if (palabras.some(p => h.includes(p))) return i;
    }
    return -1;
  },

  fecha(v) {
    const s = String(v || '').trim();
    if (!s) return null;
    let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (m) return `${m[1]}-${String(m[2]).padStart(2, '0')}-${String(m[3]).padStart(2, '0')}`;
    m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
    if (m) {
      let a = m[3]; if (a.length === 2) a = '20' + a;
      return `${a}-${String(m[2]).padStart(2, '0')}-${String(m[1]).padStart(2, '0')}`;
    }
    const d = new Date(s);
    return isNaN(d) ? null : d.toISOString().slice(0, 10);
  },

  /* busca el producto por SKU o por nombre aproximado */
  producto(sku, nombre) {
    const s = this.norm(sku);
    let p = PROD.find(x => this.norm(x.id) === s);
    if (p) return p;
    const n = this.norm(nombre || sku);
    if (!n) return null;
    p = PROD.find(x => this.norm(x.n) === n);
    if (p) return p;
    const palabras = n.split(/\s+/).filter(w => w.length > 3);
    let mejor = null, max = 0;
    PROD.forEach(x => {
      const t = this.norm(x.n + ' ' + x.pres + ' ' + x.id);
      const score = palabras.filter(w => t.includes(w)).length;
      if (score > max) { max = score; mejor = x; }
    });
    return max >= 2 ? mejor : null;
  },

  async sincronizar() {
    if (!CFG_SHEET.url) throw new Error('Falta el enlace de la planilla.');
    const e = this.endpoint(CFG_SHEET.url, CFG_SHEET.hoja);
    if (!e) throw new Error('El enlace no parece de Google Sheets.');
    let txt;
    try {
      const r = await fetch(e);
      if (!r.ok) throw new Error('HTTP ' + r.status);
      txt = await r.text();
    } catch (err) {
      throw new Error('No se pudo leer la planilla. Revisá que esté compartida como "Cualquiera con el enlace · Lector".');
    }
    if (/^\s*<|<!DOCTYPE/i.test(txt)) throw new Error('La planilla no es pública. Compartila como "Cualquiera con el enlace · Lector".');

    const filas = this.parseCSV(txt);
    if (filas.length < 2) throw new Error('La planilla no tiene filas de datos.');

    const head = filas[0];
    const iSku = this.col(head, ['sku', 'codigo', 'cod.', 'articulo', 'artículo']);
    const iNom = this.col(head, ['producto', 'descripcion', 'detalle', 'nombre']);
    const iLote = this.col(head, ['lote', 'partida', 'batch']);
    const iUni = this.col(head, ['unidad', 'cantidad', 'stock', 'saldo', 'existencia']);
    const iVto = this.col(head, ['vencim', 'vto', 'caduc', 'expira']);

    if (iUni < 0) throw new Error('No encontré la columna de cantidad. Debería llamarse Unidades, Cantidad o Stock.');
    if (iSku < 0 && iNom < 0) throw new Error('No encontré la columna de producto. Debería llamarse SKU, Código o Producto.');

    const lotes = [], sinReconocer = [];
    filas.slice(1).forEach(r => {
      const p = this.producto(iSku >= 0 ? r[iSku] : '', iNom >= 0 ? r[iNom] : '');
      const u = parseInt(String(r[iUni]).replace(/[^\d-]/g, ''), 10);
      if (!p) { const et = (iNom >= 0 ? r[iNom] : r[iSku] || '').trim(); if (et) sinReconocer.push(et); return; }
      if (!isFinite(u) || u <= 0) return;
      const lote = iLote >= 0 ? String(r[iLote]).trim() : '—';
      const vto = iVto >= 0 ? this.fecha(r[iVto]) : null;
      const ex = lotes.find(l => l.p === p.id && l.l === lote);
      if (ex) ex.u += u; else lotes.push({ p: p.id, l: lote || '—', u, v: vto || '2099-12-31' });
    });

    await DB.reemplazarLotes(lotes);
    CFG_SHEET.ultima = new Date().toISOString();
    DB.guardarLocal();
    return { lotes: lotes.length, unidades: lotes.reduce((a, l) => a + l.u, 0), sinReconocer: [...new Set(sinReconocer)] };
  }
};
