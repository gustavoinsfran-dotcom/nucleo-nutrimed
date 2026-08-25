-- ============================================================
-- NÚCLEO — esquema de base de datos
-- Pegar completo en Supabase → SQL Editor → Run
-- ============================================================

-- ---------- Maestros ----------
create table if not exists producto (
  sku           text primary key,
  nombre        text not null,
  categoria     text not null check (categoria in ('SNO','Sonda','Módulos')),
  presentacion  text not null,
  precio        numeric(12,2) not null default 0,
  costo         numeric(12,2),
  activo        boolean not null default true
);

create table if not exists cuenta (
  id          bigint generated always as identity primary key,
  nombre      text not null unique,
  tipo        text not null check (tipo in ('Institución','Farmacia','Distribuidor','Profesional')),
  zona        text,
  referente   text,
  estado      text not null default 'Prospecto'
              check (estado in ('Prospecto','Contactada','Muestra entregada','Primera compra','Activa','Recurrente','Dormida')),
  desde       text,
  cuit        text,
  notas       text,
  creado      timestamptz not null default now()
);

create table if not exists contacto (
  id            bigint generated always as identity primary key,
  nombre        text not null,
  rol           text,
  institucion   text,
  email         text,
  telefono      text,
  origen        text,                             -- hecho: de qué lista salió. No se edita.
  tipo_origen   text,                             -- Académico | Asistencial | Digital | Comercial
  archivo       text,                             -- planilla de procedencia, para trazar el dato
  categoria     text not null default 'A confirmar',  -- la declara la persona, no el sistema
  prescriptor   boolean not null default false,   -- entra al ranking de quienes indican
  especialidad  text,
  ambito        text,                             -- Institución | Consultorio propio | Ambos
  matricula     text,
  pista         text,                             -- lo que el dominio sugiere. Nunca es el dato.
  etapa         text not null default 'Cargado',  -- Cargado → Contactado → Declaró categoría → Interactuó → Cuenta abierta
  cuenta_id     bigint references cuenta(id) on delete set null,
  alta          date not null default current_date,
  constraint contacto_email_unico unique (email)
);
create index if not exists contacto_cuenta_idx on contacto(cuenta_id);
create index if not exists contacto_origen_idx on contacto(origen);
create index if not exists contacto_categoria_idx on contacto(categoria);

-- Migración para una base que ya existe: corré esto una sola vez.
-- alter table contacto add column if not exists tipo_origen text;
-- alter table contacto add column if not exists archivo text;
-- alter table contacto add column if not exists categoria text not null default 'A confirmar';
-- alter table contacto add column if not exists pista text;
-- alter table contacto add column if not exists etapa text not null default 'Cargado';
-- alter table contacto drop column if exists consentimiento;
-- alter table contacto add column if not exists prescriptor boolean not null default false;
-- alter table contacto add column if not exists especialidad text;
-- alter table contacto add column if not exists ambito text;
-- alter table contacto add column if not exists matricula text;
-- alter table venta   add column if not exists prescriptor_id bigint references contacto(id) on delete set null;

-- ---------- Operación ----------
create table if not exists venta (
  id              bigint generated always as identity primary key,
  fecha           date not null,
  cuenta_id       bigint not null references cuenta(id),
  sku             text not null references producto(sku),
  unidades        integer not null check (unidades > 0),
  precio_unitario numeric(12,2) not null,
  origen          text,
  prescriptor_id  bigint references contacto(id) on delete set null,  -- quién la indicó
  cargado_por     text,
  creado          timestamptz not null default now()
);
create index if not exists venta_fecha_idx on venta(fecha);
create index if not exists venta_cuenta_idx on venta(cuenta_id);
create index if not exists venta_prescriptor_idx on venta(prescriptor_id);

create table if not exists lote (
  sku         text not null references producto(sku),
  lote        text not null,
  unidades    integer not null default 0 check (unidades >= 0),
  vencimiento date not null,
  primary key (sku, lote)
);
create index if not exists lote_venc_idx on lote(vencimiento);

create table if not exists accion (
  id          bigint generated always as identity primary key,
  nombre      text not null,
  tipo        text,
  fecha       date not null,
  inversion   numeric(12,2) default 0,
  contactos   integer default 0,
  cuentas     integer default 0,
  ventas      integer default 0,
  estado      text default 'En curso',
  validado_tecnico    text,   -- quién validó (Juli)
  validado_regulatorio text   -- quién validó (Gabi)
);

-- ---------- Vistas útiles para reportes ----------
create or replace view v_ventas_mes as
select date_trunc('month', fecha)::date as mes,
       sum(unidades)                    as unidades,
       sum(unidades * precio_unitario)  as facturacion,
       count(*)                         as operaciones,
       count(distinct cuenta_id)        as cuentas
from venta group by 1 order by 1;

create or replace view v_vencimientos as
select l.sku, p.nombre, l.lote, l.unidades, l.vencimiento,
       (l.vencimiento - current_date) as dias,
       case when l.vencimiento < current_date then 'Vencido'
            when l.vencimiento - current_date <= 60  then 'Crítico'
            when l.vencimiento - current_date <= 90  then 'Urgente'
            when l.vencimiento - current_date <= 180 then 'Vigilar'
            else 'OK' end as estado
from lote l join producto p using (sku)
where l.unidades > 0
order by l.vencimiento;

-- ---------- Seguridad ----------
-- Solo usuarios logueados leen y escriben. Nadie anónimo ve nada.
alter table producto  enable row level security;
alter table cuenta    enable row level security;
alter table contacto  enable row level security;
alter table venta     enable row level security;
alter table lote      enable row level security;
alter table accion    enable row level security;

do $$
declare t text;
begin
  foreach t in array array['producto','cuenta','contacto','venta','lote','accion'] loop
    execute format('drop policy if exists equipo_lee on %I', t);
    execute format('drop policy if exists equipo_escribe on %I', t);
    execute format('create policy equipo_lee on %I for select to authenticated using (true)', t);
    execute format('create policy equipo_escribe on %I for all to authenticated using (true) with check (true)', t);
  end loop;
end $$;

-- ============================================================
-- Carga inicial de productos (línea Bi¹ — ajustar precios reales)
-- ============================================================
insert into producto (sku, nombre, categoria, presentacion, precio) values
 ('SNO-HCHP-300','SNO Hipercalórico Hiperproteico','SNO','Lata 300 g',0),
 ('SNO-NCHP-300','SNO Normocalórico Hiperproteico c/ fibra','SNO','Lata 300 g',0),
 ('SNO-NPHC-300','SNO Normoproteico Hipercalórico','SNO','Lata 300 g',0),
 ('SNO-DBHC-300','SNO Diabetes Hipercalórico Hiperproteico','SNO','Lata 300 g',0),
 ('SNO-DBNC-400','SNO Diabetes Normocalórico Hiperproteico','SNO','Lata 400 g',0),
 ('SNO-INMU-300','SNO Inmunonutrientes','SNO','Lata 300 g',0),
 ('SNO-ONCO-300','SNO Oncológico','SNO','Lata 300 g',0),
 ('SNO-PEPT-240','SNO Peptídico neutro','SNO','Lata 240 g',0),
 ('SND-HCHP-400','Fórmula sonda Hipercalórica Hiperproteica c/ fibra','Sonda','Lata 400 g',0),
 ('SND-NCNP-400','Fórmula sonda Normocalórica Normoproteica c/ fibra','Sonda','Lata 400 g',0),
 ('SND-DBHC-400','Fórmula sonda Diabetes Hipercalórica','Sonda','Lata 400 g',0),
 ('SND-INMU-400','Fórmula sonda Inmunonutrientes','Sonda','Lata 400 g',0),
 ('MOD-ESPE-240','Módulo Espesante instantáneo','Módulos','Lata 240 g',0),
 ('MOD-PROT-100','Módulo Proteico limón','Módulos','Caja 100 x 7 g',0),
 ('MOD-AMIN-100','Módulo de Aminoácidos limón','Módulos','Caja 100 x 7 g',0),
 ('MOD-GLUT-100','Módulo L-Glutamina','Módulos','Caja 100 x 7 g',0)
on conflict (sku) do nothing;
