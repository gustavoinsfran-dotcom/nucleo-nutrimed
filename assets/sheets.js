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
    txt = txt.replace(/^﻿/, '');
    /* separador: coma o punto y coma, el que más aparezca en la primera línea */
    const l1 = txt.split('\n')[0] || '';
    const sep = (l1.split(';').length > l1.split(',').length) ? ';' : ',';
    const filas = []; let f = [], c = '', q = false;
    for (let i = 0; i < txt.length; i++) {
      const ch = txt[i];
      if (q) {
        if (ch === '"' && txt[i + 1] === '"') { c += '"'; i++; }
        else if (ch === '"') q = false;
        else c += ch;
      } else if (ch === '"') q = true;
      else if (ch === sep) { f.push(c); c = ''; }
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

/* ==========================================================
   Tienda online (Tienda Nube) — pedidos hacia NÚCLEO
   Los pedidos se leen de una hoja de Google que actualiza la tienda.
   Cada pedido entra como venta del canal Ecommerce, con Logevity
   como cuenta: es el eslabón de la cadena de comercialización.
   ========================================================== */
var CFG_TIENDA = { url:'', hoja:'', ultima:'', auto:true, cuenta:'Logevity' };

const TIENDA = {
  async sincronizar(){
    if(!CFG_TIENDA.url) throw new Error('Falta el enlace de la hoja de pedidos.');
    const e = SHEET.endpoint(CFG_TIENDA.url, CFG_TIENDA.hoja);
    if(!e) throw new Error('El enlace no parece de Google Sheets.');
    let txt;
    try{
      const r = await fetch(e);
      if(!r.ok) throw new Error('HTTP '+r.status);
      txt = await r.text();
    }catch(err){
      throw new Error('No se pudo leer la hoja de pedidos. Revisá que esté compartida como "Cualquiera con el enlace · Lector".');
    }
    if(/^\s*<|<!DOCTYPE/i.test(txt)) throw new Error('La hoja no es pública. Compartila como "Cualquiera con el enlace · Lector".');

    const filas = SHEET.parseCSV(txt);
    if(filas.length < 2) throw new Error('La hoja no tiene pedidos.');
    const head = filas[0];
    const iNro  = SHEET.col(head,['pedido','orden','order','n°','nro','numero']);
    const iFec  = SHEET.col(head,['fecha','creado','date']);
    const iSku  = SHEET.col(head,['sku','codigo','cod.']);
    const iNom  = SHEET.col(head,['producto','articulo','artículo','detalle','nombre']);
    const iCant = SHEET.col(head,['cantidad','unidad','cant','qty']);
    const iPre  = SHEET.col(head,['precio','unitario','importe','total','subtotal']);
    const iEst  = SHEET.col(head,['estado','status','pago']);

    if(iCant < 0) throw new Error('No encontré la columna de cantidad.');
    if(iSku < 0 && iNom < 0) throw new Error('No encontré la columna de producto.');
    if(iFec < 0) throw new Error('No encontré la columna de fecha.');

    /* la cuenta del canal se crea una sola vez */
    let cta = CUENTAS.find(c => SHEET.norm(c.n) === SHEET.norm(CFG_TIENDA.cuenta));
    if(!cta) cta = await DB.addCuenta({n:CFG_TIENDA.cuenta, t:'Distribuidor', z:'Nacional',
      ref:'Tienda online', tel:'', mail:'', e:'Activa',
      notas:'Eslabón de la cadena de comercialización para la venta online. Las ventas de la tienda se registran acá.',
      desde:''});

    const yaCargados = new Set(VENTAS.filter(v => v.ped).map(v => v.ped + '|' + v.p));
    let nuevos = 0, sinReconocer = [];
    for(const r of filas.slice(1)){
      const p = SHEET.producto(iSku>=0?r[iSku]:'', iNom>=0?r[iNom]:'');
      if(!p){ const et=(iNom>=0?r[iNom]:r[iSku]||'').trim(); if(et) sinReconocer.push(et); continue; }
      const u = parseInt(String(r[iCant]).replace(/[^\d-]/g,''),10);
      if(!isFinite(u) || u <= 0) continue;
      const f = SHEET.fecha(r[iFec]); if(!f) continue;
      const est = iEst>=0 ? String(r[iEst]).toLowerCase() : '';
      if(/cancel|anul|rechaz/.test(est)) continue;
      const nro = iNro>=0 ? String(r[iNro]).trim() : f+'-'+p.id;
      if(yaCargados.has(nro+'|'+p.id)) continue;
      let pu = iPre>=0 ? parseFloat(String(r[iPre]).replace(/[^\d,.-]/g,'').replace(/\.(?=\d{3})/g,'').replace(',','.')) : NaN;
      if(!isFinite(pu) || pu <= 0) pu = p.p || 0;
      if(iPre>=0 && /total|importe|subtotal/.test(SHEET.norm(head[iPre])) && u>1) pu = pu/u;
      await DB.addVenta({f, m:+f.split('-')[1]-1, c:cta.id, p:p.id, u, pu, o:'Ecommerce', ped:nro});
      nuevos++;
    }
    CFG_TIENDA.ultima = new Date().toISOString();
    DB.guardarLocal();
    return { nuevos, sinReconocer:[...new Set(sinReconocer)], cuenta:cta.n };
  }
};
