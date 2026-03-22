import { sequelize } from "../database/sequelize.js";
import { QueryTypes } from "sequelize";

const TZ_AR = "America/Argentina/Cordoba";

function armarRangoMes(anio, mes) {
  const desde = new Date(anio, mes - 1, 1);
  const hasta = new Date(anio, mes, 1);
  return { desde, hasta };
}

/**
 * =========================
 * 1) RECAUDACIÓN MENSUAL
 * Mantiene la lógica original por gym_fecha_inicio
 * =========================
 */
export async function obtenerRecaudacionMensual({ anio }) {
  const sql = `
    SELECT
      EXTRACT(MONTH FROM gym_fecha_inicio)::int AS mes,
      COALESCE(SUM(gym_fecha_montopagado::numeric), 0) AS total
    FROM gym_fecha_disponible
    WHERE EXTRACT(YEAR FROM gym_fecha_inicio) = :anio
      AND COALESCE(gym_fecha_montopagado, 0) > 0
    GROUP BY 1
    ORDER BY 1 ASC;
  `;

  const rows = await sequelize.query(sql, {
    type: QueryTypes.SELECT,
    replacements: { anio },
  });

  const items = Array.from({ length: 12 }, (_, i) => ({
    mes: i + 1,
    total: 0,
  }));

  for (const r of rows) {
    const mes = Number(r.mes);
    if (mes >= 1 && mes <= 12) {
      items[mes - 1].total = Number(r.total || 0);
    }
  }

  return { items };
}

/**
 * =========================
 * 2) RECAUDACIÓN DIARIA DE UN MES
 * Mantiene la lógica original por gym_fecha_inicio
 * =========================
 */
export async function obtenerRecaudacionDiariaMes({ anio, mes }) {
  const { desde, hasta } = armarRangoMes(anio, mes);

  const sql = `
    SELECT
      gym_fecha_inicio AS dia,
      COALESCE(SUM(gym_fecha_montopagado::numeric), 0) AS total
    FROM gym_fecha_disponible
    WHERE gym_fecha_inicio >= :desde::date
      AND gym_fecha_inicio < :hasta::date
      AND COALESCE(gym_fecha_montopagado, 0) > 0
    GROUP BY 1
    ORDER BY 1 ASC;
  `;

  const rows = await sequelize.query(sql, {
    type: QueryTypes.SELECT,
    replacements: { desde, hasta },
  });

  return {
    items: rows.map((r) => ({
      dia: String(r.dia).slice(0, 10),
      total: Number(r.total || 0),
    })),
  };
}

/**
 * =========================
 * 3) DETALLE DE RECAUDACIÓN DE UN DÍA
 * CORREGIDO:
 * ahora filtra por gym_fecha_inicio para coincidir
 * con mensual y diariaMes.
 *
 * La hora mostrada sigue siendo gym_fecha_fechacambio.
 * =========================
 */
export async function obtenerRecaudacionDetalleDia({ anio, mes, dia }) {
  const fecha = `${anio}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;

  const sql = `
    SELECT
      f.gym_fecha_id,
      f.gym_fecha_inicio,
      f.gym_fecha_fechacambio AS fecha_hora,
      f.gym_fecha_montopagado AS monto,
      f.gym_fecha_metodopago AS metodo_pago,

      p_alumno.gym_persona_nombre AS alumno_nombre,
      p_alumno.gym_persona_apellido AS alumno_apellido,
      p_alumno.gym_persona_documento AS alumno_documento,

      tp.gym_cat_tipoplan_descripcion AS plan_descripcion,

      p_usuario.gym_persona_nombre AS usuario_nombre,
      p_usuario.gym_persona_apellido AS usuario_apellido
    FROM gym_fecha_disponible f
    LEFT JOIN gym_alumno a
      ON a.gym_alumno_id = f.gym_fecha_rela_alumno
    LEFT JOIN gym_persona p_alumno
      ON p_alumno.gym_persona_id = a.gym_alumno_rela_persona
    LEFT JOIN gym_cat_tipoplan tp
      ON tp.gym_cat_tipoplan_id = f.gym_fecha_rela_tipoplan
    LEFT JOIN gym_usuario u
      ON u.gym_usuario_id = f.gym_fecha_rela_usuario_cobro
    LEFT JOIN gym_persona p_usuario
      ON p_usuario.gym_persona_id = u.gym_usuario_rela_persona
    WHERE f.gym_fecha_inicio = :fecha::date
      AND COALESCE(f.gym_fecha_montopagado, 0) > 0
    ORDER BY f.gym_fecha_fechacambio ASC NULLS LAST, f.gym_fecha_id ASC;
  `;

  const rows = await sequelize.query(sql, {
    type: QueryTypes.SELECT,
    replacements: { fecha },
  });

  const items = rows.map((r) => ({
    gym_fecha_id: r.gym_fecha_id,
    fecha_inicio: r.gym_fecha_inicio,
    fecha_hora: r.fecha_hora,
    monto: Number(r.monto || 0),
    metodo_pago: r.metodo_pago || null,
    alumno: [r.alumno_nombre, r.alumno_apellido].filter(Boolean).join(" "),
    alumno_documento: r.alumno_documento || null,
    plan: r.plan_descripcion || null,
    usuario_cobro: [r.usuario_nombre, r.usuario_apellido].filter(Boolean).join(" "),
  }));

  const total_dia = items.reduce((acc, it) => acc + Number(it.monto || 0), 0);

  return {
    total_dia,
    cantidad_cobros: items.length,
    items,
  };
}

/**
 * =========================
 * 4) ALUMNOS NUEVOS
 * =========================
 */
export async function obtenerAlumnosNuevos({ desde, hasta } = {}) {
  const hoy = new Date();
  const fechaDesde = desde ? new Date(desde) : new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  const fechaHasta = hasta ? new Date(hasta) : new Date(hoy.getFullYear(), hoy.getMonth() + 1, 1);

  const sql = `
    SELECT
      a.gym_alumno_id,
      a.gym_alumno_fecharegistro,
      p.gym_persona_nombre,
      p.gym_persona_apellido,
      p.gym_persona_documento,
      p.gym_persona_email
    FROM gym_alumno a
    INNER JOIN gym_persona p
      ON p.gym_persona_id = a.gym_alumno_rela_persona
    WHERE a.gym_alumno_fecharegistro >= :desde
      AND a.gym_alumno_fecharegistro < :hasta
    ORDER BY a.gym_alumno_fecharegistro DESC;
  `;

  const items = await sequelize.query(sql, {
    type: QueryTypes.SELECT,
    replacements: { desde: fechaDesde, hasta: fechaHasta },
  });

  return { items };
}

/**
 * =========================
 * 5) VENCIMIENTOS
 * =========================
 */
export async function obtenerVencimientos({ dias = 7 } = {}) {
  const sql = `
    SELECT
      a.gym_alumno_id,
      p.gym_persona_nombre,
      p.gym_persona_apellido,
      p.gym_persona_documento,
      f.gym_fecha_fin,
      f.gym_fecha_ingresosdisponibles
    FROM gym_fecha_disponible f
    INNER JOIN gym_alumno a
      ON a.gym_alumno_id = f.gym_fecha_rela_alumno
    INNER JOIN gym_persona p
      ON p.gym_persona_id = a.gym_alumno_rela_persona
    WHERE DATE(f.gym_fecha_fin) >= DATE(now() AT TIME ZONE '${TZ_AR}')
      AND DATE(f.gym_fecha_fin) <= DATE(now() AT TIME ZONE '${TZ_AR}') + (:dias::int)
    ORDER BY f.gym_fecha_fin ASC;
  `;

  const items = await sequelize.query(sql, {
    type: QueryTypes.SELECT,
    replacements: { dias },
  });

  return { items };
}

/**
 * =========================
 * 6) ASISTENCIAS POR DÍA
 * =========================
 */
export async function obtenerAsistencias({ desde, hasta } = {}) {
  const hoy = new Date();
  const fechaDesde = desde ? new Date(desde) : new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  const fechaHasta = hasta ? new Date(hasta) : new Date(hoy.getFullYear(), hoy.getMonth() + 1, 1);

  const sql = `
    SELECT
      DATE(di.gym_diaingreso_fechaingreso AT TIME ZONE '${TZ_AR}') AS dia,
      COUNT(*)::int AS total
    FROM gym_dia_ingreso di
    WHERE di.gym_diaingreso_fechaingreso >= :desde
      AND di.gym_diaingreso_fechaingreso < :hasta
    GROUP BY 1
    ORDER BY 1 ASC;
  `;

  const items = await sequelize.query(sql, {
    type: QueryTypes.SELECT,
    replacements: { desde: fechaDesde, hasta: fechaHasta },
  });

  return {
    items: items.map((r) => ({
      dia: String(r.dia).slice(0, 10),
      total: Number(r.total || 0),
    })),
  };
}

/**
 * =========================
 * 7) ASISTENCIAS POR HORA
 * =========================
 */
export async function obtenerAsistenciasHoras({ desde, hasta } = {}) {
  const hoy = new Date();
  const fechaDesde = desde ? new Date(desde) : new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  const fechaHasta = hasta ? new Date(hasta) : new Date(hoy.getFullYear(), hoy.getMonth() + 1, 1);

  const sql = `
    SELECT
      EXTRACT(HOUR FROM (di.gym_diaingreso_fechaingreso AT TIME ZONE '${TZ_AR}'))::int AS hora,
      COUNT(*)::int AS total
    FROM gym_dia_ingreso di
    WHERE di.gym_diaingreso_fechaingreso >= :desde
      AND di.gym_diaingreso_fechaingreso < :hasta
    GROUP BY 1
    ORDER BY 1 ASC;
  `;

  const rows = await sequelize.query(sql, {
    type: QueryTypes.SELECT,
    replacements: { desde: fechaDesde, hasta: fechaHasta },
  });

  return { items: rows };
}

/**
 * =========================
 * 8) ASISTENCIAS POR HORA Y DÍA DE SEMANA
 * =========================
 */
export async function obtenerAsistenciasHoraDiaSemana({ desde, hasta } = {}) {
  const hoy = new Date();
  const fechaDesde = desde ? new Date(desde) : new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  const fechaHasta = hasta ? new Date(hasta) : new Date(hoy.getFullYear(), hoy.getMonth() + 1, 1);

  const sql = `
    SELECT
      EXTRACT(DOW FROM (di.gym_diaingreso_fechaingreso AT TIME ZONE '${TZ_AR}'))::int AS dia_semana,
      EXTRACT(HOUR FROM (di.gym_diaingreso_fechaingreso AT TIME ZONE '${TZ_AR}'))::int AS hora,
      COUNT(*)::int AS total
    FROM gym_dia_ingreso di
    WHERE di.gym_diaingreso_fechaingreso >= :desde
      AND di.gym_diaingreso_fechaingreso < :hasta
    GROUP BY 1, 2
    ORDER BY 1 ASC, 2 ASC;
  `;

  const items = await sequelize.query(sql, {
    type: QueryTypes.SELECT,
    replacements: { desde: fechaDesde, hasta: fechaHasta },
  });

  return { items };
}