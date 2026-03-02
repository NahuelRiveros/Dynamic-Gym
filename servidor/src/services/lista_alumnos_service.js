// src/services/lista_alumnos_service.js
import { sequelize } from "../database/sequelize.js";
import { QueryTypes } from "sequelize";

export async function listarAlumnos({
  q,
  dni,
  estado_id,
  plan_vigente,
  page = 1,
  limit = 20,
  sort = "apellido",
  order = "asc",
}) {
  const p = Math.max(1, Number(page) || 1);
  const l = Math.min(100, Math.max(1, Number(limit) || 20));
  const offset = (p - 1) * l;

  const where = [];
  const repl = { limit: l, offset };

  if (dni) {
    where.push(`p.gym_persona_documento::text ILIKE :dni`);
    repl.dni = `%${dni}%`;
  }

  if (q) {
    where.push(`
      (
        p.gym_persona_documento::text ILIKE :q OR
        COALESCE(p.gym_persona_nombre,'') ILIKE :q OR
        COALESCE(p.gym_persona_apellido,'') ILIKE :q OR
        COALESCE(p.gym_persona_email,'') ILIKE :q
      )
    `);
    repl.q = `%${q}%`;
  }

  if (estado_id != null) {
    where.push(`a.gym_alumno_rela_estadoalumno = :estado_id`);
    repl.estado_id = Number(estado_id);
  }

  // plan vigente hoy (solo para filtro)
  if (plan_vigente === true) where.push(`fvig.gym_fecha_id IS NOT NULL`);
  if (plan_vigente === false) where.push(`fvig.gym_fecha_id IS NULL`);

  const whereSQL = where.length ? `WHERE ${where.join(" AND ")}` : "";

  // whitelist sort
  const sortMap = {
    apellido: `p.gym_persona_apellido`,
    nombre: `p.gym_persona_nombre`,
    dni: `p.gym_persona_documento`,
    estado: `a.gym_alumno_rela_estadoalumno`,
    vencimiento: `fsel.plan_fin`,
  };
  const sortSQL = sortMap[sort] ?? sortMap.apellido;
  const orderSQL = String(order).toLowerCase() === "asc" ? "ASC" : "DESC";

  const sqlItems = `
    SELECT
      a.gym_alumno_id,
      a.gym_alumno_fecharegistro,

      p.gym_persona_id,
      p.gym_persona_nombre,
      p.gym_persona_apellido,
      p.gym_persona_documento,
      p.gym_persona_email,
      p.gym_persona_celular,

      a.gym_alumno_rela_estadoalumno AS estado_id,
      ea.gym_cat_estadoalumno_descripcion AS estado_desc,

      -- plan seleccionado (regla 3: vigente hoy, si no, último)
      fsel.plan_id,
      fsel.plan_inicio,
      fsel.plan_fin,
      fsel.ingresos_disponibles,
      fsel.plan_tipo_id,
      tp.gym_cat_tipoplan_descripcion AS plan_tipo_desc,

      CASE WHEN fvig.gym_fecha_id IS NOT NULL THEN true ELSE false END AS tiene_plan_vigente

    FROM public.gym_alumno a
    JOIN public.gym_persona p
      ON p.gym_persona_id = a.gym_alumno_rela_persona
    LEFT JOIN public.gym_cat_estado_alumno ea
      ON ea.gym_cat_estadoalumno_id = a.gym_alumno_rela_estadoalumno

    -- plan vigente HOY (solo id, para filtro y selección)
    LEFT JOIN LATERAL (
      SELECT f.gym_fecha_id
      FROM public.gym_fecha_disponible f
      WHERE f.gym_fecha_rela_alumno = a.gym_alumno_id
        AND f.gym_fecha_inicio <= CURRENT_DATE
        AND f.gym_fecha_fin >= CURRENT_DATE
      ORDER BY f.gym_fecha_fin DESC, f.gym_fecha_id DESC
      LIMIT 1
    ) fvig ON TRUE

    -- último plan por fin (fallback)
    LEFT JOIN LATERAL (
      SELECT f.gym_fecha_id AS plan_id
      FROM public.gym_fecha_disponible f
      WHERE f.gym_fecha_rela_alumno = a.gym_alumno_id
        AND f.gym_fecha_fin IS NOT NULL
      ORDER BY f.gym_fecha_fin DESC, f.gym_fecha_id DESC
      LIMIT 1
    ) fult ON TRUE

    -- detalles del plan seleccionado
    LEFT JOIN LATERAL (
      SELECT
        f.gym_fecha_id AS plan_id,
        f.gym_fecha_inicio AS plan_inicio,
        f.gym_fecha_fin AS plan_fin,
        f.gym_fecha_ingresosdisponibles AS ingresos_disponibles,
        f.gym_fecha_rela_tipoplan AS plan_tipo_id
      FROM public.gym_fecha_disponible f
      WHERE f.gym_fecha_id = COALESCE(fvig.gym_fecha_id, fult.plan_id)
      LIMIT 1
    ) fsel ON TRUE

    LEFT JOIN public.gym_cat_tipoplan tp
      ON tp.gym_cat_tipoplan_id = fsel.plan_tipo_id

    ${whereSQL}
    ORDER BY ${sortSQL} ${orderSQL}
    LIMIT :limit OFFSET :offset
  `;

  const sqlCount = `
    SELECT COUNT(*)::int AS total
    FROM public.gym_alumno a
    JOIN public.gym_persona p
      ON p.gym_persona_id = a.gym_alumno_rela_persona
    LEFT JOIN LATERAL (
      SELECT f.gym_fecha_id
      FROM public.gym_fecha_disponible f
      WHERE f.gym_fecha_rela_alumno = a.gym_alumno_id
        AND f.gym_fecha_inicio <= CURRENT_DATE
        AND f.gym_fecha_fin >= CURRENT_DATE
      ORDER BY f.gym_fecha_fin DESC, f.gym_fecha_id DESC
      LIMIT 1
    ) fvig ON TRUE
    ${whereSQL}
  `;

  const items = await sequelize.query(sqlItems, { replacements: repl, type: QueryTypes.SELECT });
  const [countRow] = await sequelize.query(sqlCount, { replacements: repl, type: QueryTypes.SELECT });

  const total = countRow?.total ?? 0;
  const totalPages = Math.ceil(total / l);

  return {
    ok: true,
    items,
    pagination: { page: p, limit: l, total, totalPages },
  };
}