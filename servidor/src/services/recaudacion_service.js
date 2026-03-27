import { sequelize } from "../database/sequelize.js";
import { QueryTypes } from "sequelize";

/**
 * REGLA DE NEGOCIO
 * - La recaudación se imputa por gym_fecha_inicio
 * - La hora de auditoría se muestra con gym_fecha_fechacambio
 * - El usuario que cobró sale de gym_fecha_rela_usuario_cobro
 */

function validarAnioMesDia({ anio, mes, dia = null }) {
  if (!Number.isInteger(anio) || anio < 2000 || anio > 2100) {
    throw new Error("ANIO_INVALIDO");
  }

  if (!Number.isInteger(mes) || mes < 1 || mes > 12) {
    throw new Error("MES_INVALIDO");
  }

  if (dia !== null && (!Number.isInteger(dia) || dia < 1 || dia > 31)) {
    throw new Error("DIA_INVALIDO");
  }
}

/**
 * 1) Totales por mes de un año
 */
export async function obtenerRecaudacionMesesPorAnio({ anio }) {
  if (!Number.isInteger(anio) || anio < 2000 || anio > 2100) {
    throw new Error("ANIO_INVALIDO");
  }

  const sql = `
    SELECT
      EXTRACT(MONTH FROM f.gym_fecha_inicio)::int AS mes,
      COALESCE(SUM(f.gym_fecha_montopagado::numeric), 0) AS total
    FROM gym_plan_alumno f
    WHERE EXTRACT(YEAR FROM f.gym_fecha_inicio) = :anio
      AND COALESCE(f.gym_fecha_montopagado, 0) > 0
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

  for (const row of rows) {
    const mes = Number(row.mes);
    if (mes >= 1 && mes <= 12) {
      items[mes - 1].total = Number(row.total || 0);
    }
  }

  return { items };
}

/**
 * 2) Totales por día de un mes
 */
export async function obtenerRecaudacionDiasDeMes({ anio, mes }) {
  validarAnioMesDia({ anio, mes });

  const desde = `${anio}-${String(mes).padStart(2, "0")}-01`;

  const fechaHasta = new Date(anio, mes, 1);
  const hasta = fechaHasta.toISOString().slice(0, 10);

  const sql = `
    SELECT
      f.gym_fecha_inicio AS dia,
      COALESCE(SUM(f.gym_fecha_montopagado::numeric), 0) AS total
    FROM gym_plan_alumno f
    WHERE f.gym_fecha_inicio >= :desde::date
      AND f.gym_fecha_inicio < :hasta::date
      AND COALESCE(f.gym_fecha_montopagado, 0) > 0
    GROUP BY 1
    ORDER BY 1 ASC;
  `;

  const rows = await sequelize.query(sql, {
    type: QueryTypes.SELECT,
    replacements: { desde, hasta },
  });

  return {
    items: rows.map((row) => ({
      dia: String(row.dia).slice(0, 10),
      total: Number(row.total || 0),
    })),
  };
}

/**
 * 3) Detalle de un día
 * Filtra por gym_fecha_inicio para coincidir con mensual y diario.
 * Muestra hora y usuario usando gym_fecha_fechacambio y gym_fecha_rela_usuario_cobro.
 */
export async function obtenerDetalleRecaudacionDia({ anio, mes, dia }) {
  validarAnioMesDia({ anio, mes, dia });

  const fecha = `${anio}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;

  const sql = `
    SELECT
      f.gym_fecha_id,
      f.gym_fecha_inicio,
      f.gym_fecha_fechacambio,
      f.gym_fecha_montopagado,
      f.gym_fecha_metodopago,

      p_alumno.gym_persona_nombre AS alumno_nombre,
      p_alumno.gym_persona_apellido AS alumno_apellido,
      p_alumno.gym_persona_documento AS alumno_documento,

      tp.gym_cat_tipoplan_descripcion AS plan_descripcion,

      p_usuario.gym_persona_nombre AS usuario_nombre,
      p_usuario.gym_persona_apellido AS usuario_apellido
    FROM gym_plan_alumno f
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

  const items = rows.map((row) => ({
    gym_fecha_id: row.gym_fecha_id,
    fecha_inicio: row.gym_fecha_inicio,
    fecha_hora: row.gym_fecha_fechacambio,
    monto: Number(row.gym_fecha_montopagado || 0),
    metodo_pago: row.gym_fecha_metodopago || null,
    alumno: [row.alumno_nombre, row.alumno_apellido].filter(Boolean).join(" "),
    alumno_documento: row.alumno_documento || null,
    plan: row.plan_descripcion || null,
    usuario_cobro: [row.usuario_nombre, row.usuario_apellido].filter(Boolean).join(" "),
  }));

  const total_dia = items.reduce((acc, item) => acc + Number(item.monto || 0), 0);

  return {
    total_dia,
    cantidad_cobros: items.length,
    items,
  };
}