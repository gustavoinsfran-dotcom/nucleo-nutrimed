# NÚCLEO — Sistema comercial y de marketing

Línea de nutrición clínica (Bi¹) — Infinity Pharma / Nutrimed Argentina.

Sitio estático + base de datos Postgres. Sin licencias, sin servidor propio, sin costo.

| Capa | Qué es | Costo |
|---|---|---|
| Interfaz | HTML/CSS/JS, sin framework | $0 (GitHub Pages) |
| Base de datos | Supabase (Postgres + login) | $0 (plan free) |

---

## Publicar el sitio (GitHub Pages)

1. Crear el repositorio y subir esta carpeta.

```bash
git init
git add .
git commit -m "NÚCLEO v0.1"
git branch -M main
git remote add origin git@github.com:USUARIO/nucleo.git
git push -u origin main
```

2. En GitHub: **Settings → Pages → Source: GitHub Actions**.
   El workflow de `.github/workflows/pages.yml` publica solo en cada push a `main`.

3. Queda en `https://USUARIO.github.io/nucleo/`.
   Para dominio propio (`nucleo.infinitynutricion.com.ar`): agregar un archivo `CNAME`
   con el dominio y en el DNS un registro CNAME apuntando a `USUARIO.github.io`.

Sin configurar la base de datos, el sitio abre en **modo demo**: datos de ejemplo que
no se guardan. Sirve para mostrarlo; no para trabajar.

---

## Conectar la base de datos (modo vivo)

1. Crear un proyecto gratis en [supabase.com](https://supabase.com) (región: São Paulo).
2. **SQL Editor → New query**, pegar todo `supabase/schema.sql` y ejecutar.
3. **Authentication → Users → Add user**: crear un usuario por persona del equipo
   (Gustavo, Juli, Juan Pablo). Sin usuario no se entra: el sitio es público, los datos no.
4. **Settings → API**: copiar *Project URL* y *anon public key* en `assets/config.js`.
5. Commit y push. Listo: el sitio pasa a modo vivo y todos ven lo mismo.

> La `anon key` es pública por diseño. La seguridad la dan el login y las políticas RLS
> del schema: sin sesión iniciada, la base no devuelve una sola fila.

### Cargar los datos reales

Por SQL Editor, o desde **Table Editor → Import data from CSV** en cada tabla:

- `producto` — SKU, nombre, categoría, presentación, **precio de lista vigente**
- `cuenta` — clientes reales con tipo, zona, referente y estado
- `lote` — stock actual: SKU, lote, unidades, vencimiento
- `venta` — histórico enero a julio desde la planilla de logística
- `contacto` — bases de universidades, jornadas, sorteo y clínicas
- `accion` — acciones de marketing con inversión y resultados

---

## Estructura

```
index.html              interfaz
assets/styles.css       identidad visual — toda la marca vive en el bloque :root
assets/app.js           vistas, gráficos, cálculos
assets/db.js            capa de datos (Supabase o demo)
assets/demo-data.js     datos de ejemplo del modo demo
assets/config.js        credenciales de Supabase
supabase/schema.sql     tablas, vistas y seguridad
```

### Identidad visual

Aplica el **Manual de marca Infinity Nutrición v1.0**. Todo vive en el bloque `:root`
de `assets/styles.css`:

```css
--verde:   #17C26E;   /* firma — siempre presente */
--cian:    #2BA4D9;   /* funcional: kickers, enlaces, foco */
--navy:    #0C1A2B;   /* solo texto, nunca fondo */
--gris:    #3C4A59;   /* cuerpo */
--celeste: #EAF4F6;
--degrade: linear-gradient(135deg,#1BA5C9,#17C26E);
--s1 --s2 --s3        /* series de los gráficos */
```

Poppins como familia tipográfica, radios 10/18/28/999, sombras suaves, borde hairline
al 10% de navy, esferas translúcidas de fondo. Sin modo oscuro: el manual prohíbe navy
como color de fondo.

Los colores de los gráficos (`--s1` verde, `--s2` azul profundo, `--s3` cian) están
validados para daltonismo: todos los pares superan ΔE 16 en deuteranopía y protanopía.
Si se cambian, hay que revalidarlos.

El logo de Infinity Pharma aparece como sello de aval al pie del menú, nunca como
estilo dominante.

---

## Reglas de negocio implementadas

- **FEFO**: al cargar una venta se descuenta del lote más próximo a vencer.
- **Alertas de vencimiento**: 180 días vigilar · 90 urgente · 60 crítico.
- **Cobertura**: meses de stock según promedio de venta de los últimos 3 meses.
- **Embudo**: Prospecto → Contactada → Muestra entregada → Primera compra → Activa → Recurrente → Dormida.
- **Trazabilidad de marketing**: acción → contacto → cuenta → primera venta.

## Pendiente de definición

- Días sin comprar para pasar una cuenta a "Dormida" (propuesta: 60).
- Stock mínimo que dispara alerta de reposición (propuesta: 50 unidades).
- Consentimiento y finalidad por contacto (Ley 25.326) — validar con regulatorios
  antes de usar la base para envíos.
