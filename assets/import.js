/* ==========================================================
   Importación de los archivos del sistema (.xlsx)
   Copia los formatos tal como los descarga Gustavo:
     · Stock  → Sucursal, Depósito, Codigo, Descripción, Stock Actual, Partida, Vencimiento…
     · Ventas → Cliente, Comprobante, Fecha, Cod Prod, Producto, Cantidad, PreUniVta, TotalVta, Lote, Vendedor…
   Todo se procesa dentro del navegador: el archivo no se sube a ningún lado.
   ========================================================== */

const XLS = {
  /* ---------- utilidades ---------- */
  norm: s => String(s == null ? '' : s).toLowerCase().normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim(),

  /* número en formato argentino: 1.234,56 → 1234.56 */
  num(v) {
    if (typeof v === 'number') return v;
    let s = String(v == null ? '' : v).replace(/[^\d,.\-]/g, '');
    if (!s) return NaN;
    if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
    return parseFloat(s);
  },

  fecha(v) {
    if (v instanceof Date && !isNaN(v)) {
      return `${v.getFullYear()}-${String(v.getMonth() + 1).padStart(2, '0')}-${String(v.getDate()).padStart(2, '0')}`;
    }
    return SHEET.fecha(v);
  },

  /* busca la columna por nombre exacto y, si no, por coincidencia parcial */
  col(head, ...nombres) {
    for (const n of nombres) {
      const i = head.findIndex(h => this.norm(h) === this.norm(n));
      if (i >= 0) return i;
    }
    for (const n of nombres) {
      const i = head.findIndex(h => this.norm(h).includes(this.norm(n)));
      if (i >= 0) return i;
    }
    return -1;
  },

  /* lee el archivo y devuelve [encabezados, filas] de la primera hoja */
  async leer(file) {
    if (typeof XLSX === 'undefined') throw new Error('No se pudo cargar el lector de Excel. Revisá la conexión y volvé a intentar.');
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { cellDates: true });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const filas = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true, defval: null });
    const limpias = filas.filter(f => f && f.some(c => c !== null && String(c).trim() !== ''));
    if (limpias.length < 2) throw new Error('El archivo no tiene filas de datos.');
    return [limpias[0], limpias.slice(1)];
  },

  /* ---------- catálogo: reconocer o crear el producto del sistema ---------- */
  categoria(desc) {
    const d = this.norm(desc);
    if (/\bvia\b|sonda/.test(d)) return 'Sonda';
    if (/espesante|protein|glutamin|arginin|aminomix|modulo|módulo/.test(d)) return 'Módulos';
    return 'SNO';
  },
  presentacion(desc) {
    const d = String(desc);
    let m = d.match(/(\d+)\s*ml/i);              if (m) return `Brik ${m[1]} ml`;
    m = d.match(/lata\s*x?\s*(\d+)\s*(g|gr)/i);  if (m) return `Lata ${m[1]} g`;
    m = d.match(/sobres?\s*x?\s*(\d+)/i);        if (m) return `Sobres x ${m[1]}`;
    m = d.match(/(\d+)\s*(g|gr)\b/i);            if (m) return `${m[1]} g`;
    return '—';
  },
  limpiar(desc) {
    return String(desc).replace(/\s*x\s*1\s*$/i, '').replace(/\s+/g, ' ').trim();
  },
  /* clave del producto en el catálogo del vademécum (bi1 plus, bi1 protein…) */
  clave(desc) {
    const d = this.norm(desc).replace(/^bi\s*1|^bi1|^bi¹/, '').trim();
    const m = d.match(/^(via\s+)?([a-z\/]+)/);
    return m ? (m[1] ? 'via ' + m[2] : m[2]) : d;
  },

  async producto(cod, desc) {
    cod = String(cod == null ? '' : cod).trim();
    if (cod) {
      const porCod = PROD.find(p => String(p.cod || '') === cod);
      if (porCod) return porCod;
    }
    /* primera vez: intenta pegarlo al producto del vademécum que todavía no tiene código */
    const k = this.clave(desc);
    const cand = PROD.find(p => !p.cod && (this.clave(p.n) === k || this.norm(p.n) === this.norm(desc)));
    if (cand) {
      cand.cod = cod;
      cand.pres = this.presentacion(desc) !== '—' ? this.presentacion(desc) : cand.pres;
      cand.sis = this.limpiar(desc);
      DB.guardarLocal();
      return cand;
    }
    /* producto nuevo del sistema */
    const nuevo = {
      id: cod || ('SYS-' + (PROD.length + 1)),
      cod,
      n: this.limpiar(desc),
      d: 'Alta automática desde el sistema',
      cat: this.categoria(desc),
      sub: this.categoria(desc) === 'Sonda' ? 'Sonda' : this.categoria(desc) === 'Módulos' ? 'Módulo' : 'Oral',
      pres: this.presentacion(desc),
      p: 0
    };
    PROD.push(nuevo);
    DB.guardarLocal();
    return nuevo;
  },

  /* ---------- STOCK ---------- */
  async stock(file) {
    const [head, filas] = await this.leer(file);
    const iCod = this.col(head, 'Codigo', 'Código', 'Cod Prod');
    const iDes = this.col(head, 'Descripción', 'Descripcion', 'Producto');
    const iStk = this.col(head, 'Stock Actual', 'Stock', 'Cantidad');
    const iPar = this.col(head, 'Partida', 'Lote');
    const iVto = this.col(head, 'Vencimiento', 'Vto');
    const iDep = this.col(head, 'Depósito', 'Deposito');
    const iSuc = this.col(head, 'Sucursal');
    const iCos = this.col(head, 'Costo Unit', 'CostoUnit', 'Costo');
    const iPre = this.col(head, 'Precio Unit', 'Precio', 'PreUniVta');
    const iVal = this.col(head, 'Valorizado', 'Importe', 'Valor');
    if (iStk < 0 || (iCod < 0 && iDes < 0))
      throw new Error('No reconozco el archivo. Esperaba las columnas Codigo, Descripción y Stock Actual.');

    const lotes = [], omitidos = [];
    let productosNuevos = 0;
    const antes = PROD.length;
    for (const f of filas) {
      const cod = iCod >= 0 ? f[iCod] : '';
      const des = iDes >= 0 ? f[iDes] : '';
      if (!cod && !des) continue;                       // fila de totales
      const bruto = f[iStk];
      /* las filas de totales traen texto tipo "Stk Total : 3.641" */
      if (typeof bruto === 'string' && /[a-z]/i.test(bruto)) continue;
      const u = Math.round(this.num(bruto));
      if (!isFinite(u) || u <= 0) continue;
      const dep = iDep >= 0 ? this.norm(f[iDep]) : '';
      if (/cuarentena|rechaz|vencid|baja/.test(dep)) { omitidos.push(this.limpiar(des)); continue; }
      const p = await this.producto(cod, des);
      /* si la planilla trae valores, esos mandan sobre lo que veníamos usando */
      if (iCos >= 0) { const c = this.num(f[iCos]); if (isFinite(c) && c > 0) p.costo = c; }
      if (iPre >= 0) { const v = this.num(f[iPre]); if (isFinite(v) && v > 0) p.p = v; }
      if (iVal >= 0 && u > 0) { const t = this.num(f[iVal]); if (isFinite(t) && t > 0) p.costo = t / u; }
      const lote = iPar >= 0 && f[iPar] ? String(f[iPar]).trim() : '—';
      const vto = iVto >= 0 ? this.fecha(f[iVto]) : null;
      const suc = iSuc >= 0 && f[iSuc] ? String(f[iSuc]).trim() : '';
      const ex = lotes.find(l => l.p === p.id && l.l === lote);
      if (ex) ex.u += u;
      else lotes.push({ p: p.id, l: lote, u, v: vto || '2099-12-31', suc });
    }
    productosNuevos = PROD.length - antes;
    if (!lotes.length) throw new Error('No encontré filas de stock válidas en el archivo.');
    await DB.reemplazarLotes(lotes);
    CFG_SHEET.ultima = new Date().toISOString();
    CFG_SHEET.origen = 'archivo';
    DB.guardarLocal();
    return { lotes: lotes.length, unidades: lotes.reduce((a, l) => a + l.u, 0),
             productosNuevos, omitidos: [...new Set(omitidos)] };
  },

  /* ---------- VENTAS ---------- */
  async ventas(file) {
    const [head, filas] = await this.leer(file);
    const iCli = this.col(head, 'Cliente');
    const iCmp = this.col(head, 'Comprobante');
    const iFec = this.col(head, 'Fecha');
    const iCod = this.col(head, 'Cod Prod', 'Codigo');
    const iPro = this.col(head, 'Producto', 'Descripción');
    const iCan = this.col(head, 'Cantidad');
    const iPre = this.col(head, 'PreUniVta', 'PrecUnit');
    const iTot = this.col(head, 'TotalVta', 'Total Vta');
    const iLot = this.col(head, 'Lote', 'Partida');
    const iVen = this.col(head, 'Vendedor');
    const iTC  = this.col(head, 'TComp');
    const iCos = this.col(head, 'CostoUnit', 'Costo Unit');
    const iRep = this.col(head, 'Costo Repo Unit', 'Costo Repo');
    const iSIva = this.col(head, 'PrecUnit');
    if (iCli < 0 || iCan < 0 || (iCod < 0 && iPro < 0))
      throw new Error('No reconozco el archivo. Esperaba las columnas Cliente, Cod Prod, Producto y Cantidad.');

    const yaCargadas = new Set(VENTAS.filter(v => v.cmp).map(v => v.cmp + '|' + v.p + '|' + (v.lote || '')));
    let nuevas = 0, notas = 0, cuentasNuevas = 0, prodNuevos = 0, valorizados = 0;
    const antesP = PROD.length;

    for (const f of filas) {
      const cli = iCli >= 0 ? f[iCli] : null;
      if (!cli) continue;                                  // fila de totales
      if (/^\s*(cantidad|total)\s*:/i.test(String(cli))) continue;
      const u = Math.round(this.num(f[iCan]));
      if (!isFinite(u) || u === 0) continue;
      const fec = this.fecha(f[iFec]); if (!fec) continue;
      const p = await this.producto(iCod >= 0 ? f[iCod] : '', iPro >= 0 ? f[iPro] : '');
      const cmp = iCmp >= 0 && f[iCmp] ? String(f[iCmp]).trim() : fec + '-' + p.id;
      const lote = iLot >= 0 && f[iLot] ? String(f[iLot]).trim() : '';
      const clave = cmp + '|' + p.id + '|' + lote;

      /* precio unitario: el de venta o el total dividido por cantidad */
      let pu = iPre >= 0 ? this.num(f[iPre]) : NaN;
      if (!isFinite(pu) || pu <= 0) {
        const t = iTot >= 0 ? this.num(f[iTot]) : NaN;
        pu = isFinite(t) && u ? Math.abs(t / u) : (p.p || 0);
      }

      /* el archivo trae el costo y el precio: así el stock queda valorizado.
         Se aplica siempre, aun si la venta ya estaba cargada: sirve para refrescar
         valores volviendo a subir el mismo archivo. */
      const costo = iCos >= 0 ? this.num(f[iCos]) : NaN;
      const repo  = iRep >= 0 ? this.num(f[iRep]) : NaN;
      const sIva  = iSIva >= 0 ? this.num(f[iSIva]) : NaN;
      if (!p.fval || fec >= p.fval) {
        p.fval = fec;
        if (isFinite(costo) && costo > 0) { if (p.costo !== costo) valorizados++; p.costo = costo; }
        if (isFinite(repo) && repo > 0) p.repo = repo;
        if (isFinite(sIva) && sIva > 0) p.pSinIva = sIva;
        if (pu > 0) p.p = pu;
      }

      if (yaCargadas.has(clave)) continue;
      yaCargadas.add(clave);

      /* nota de crédito o devolución → resta */
      const tc = iTC >= 0 ? this.norm(f[iTC]) : '';
      const signo = /credito|crédito|devol/.test(tc) ? -1 : 1;
      if (signo < 0) notas++;

      /* la cuenta se crea sola: "91 - KRONOS CYA" → KRONOS CYA */
      const txt = String(cli).trim();
      const m = txt.match(/^(\d+)\s*-\s*(.+)$/);
      const codCli = m ? m[1] : '';
      const nomCli = (m ? m[2] : txt).trim();
      let cta = CUENTAS.find(c => (codCli && String(c.cod || '') === codCli) || this.norm(c.n) === this.norm(nomCli));
      if (!cta) {
        cta = await DB.addCuenta({ n: nomCli, t: 'Distribuidor', z: '', ref: iVen >= 0 && f[iVen] ? String(f[iVen]).replace(/^\d+\s*-\s*/, '') : '',
          tel: '', mail: '', e: 'Activa', notas: 'Alta automática al importar ventas del sistema.', desde: fec });
        cta.cod = codCli; cuentasNuevas++;
      }

      await DB.addVenta({ f: fec, m: +fec.split('-')[1] - 1, c: cta.id, p: p.id,
        u: signo * u, pu, o: 'Sistema', cmp, lote }, true);   /* no descuenta: ya viene descontado */
      nuevas++;
    }
    prodNuevos = PROD.length - antesP;
    DB.guardarLocal();
    return { nuevas, notas, cuentasNuevas, prodNuevos, valorizados };
  }
};

/* ---------- disparadores desde la interfaz ---------- */
async function importarStockXLS(file) {
  toast('Leyendo el archivo de stock…');
  try {
    const r = await XLS.stock(file);
    toast(`Stock actualizado: ${r.lotes} lotes, ${r.unidades} unidades${r.productosNuevos ? ` · ${r.productosNuevos} producto(s) nuevo(s)` : ''}.`, 'ok');
    if (r.omitidos.length) toast('Omití depósitos no disponibles: ' + r.omitidos.slice(0, 2).join(' · '), 'err');
    render();
  } catch (e) { toast(e.message, 'err'); }
}
async function importarVentasXLS(file) {
  toast('Leyendo el archivo de ventas…');
  try {
    const r = await XLS.ventas(file);
    toast(r.nuevas ? `${r.nuevas} línea(s) de venta cargadas${r.cuentasNuevas ? ` · ${r.cuentasNuevas} cuenta(s) nueva(s)` : ''}.`
                   : 'No había ventas nuevas: ya estaban todas cargadas.', 'ok');
    if (r.valorizados) toast(`${r.valorizados} producto(s) con costo actualizado: el stock ya queda valorizado.`, 'ok');
    if (r.prodNuevos) toast(`${r.prodNuevos} producto(s) dados de alta desde el archivo.`);
    render();
  } catch (e) { toast(e.message, 'err'); }
}
