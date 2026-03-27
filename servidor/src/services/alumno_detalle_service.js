import { sequelize } from "../database/sequelize.js";
import { QueryTypes } from "sequelize";

export async function obtenerDetalleAlumno({ alumno_id }) {
  // 1) Datos alumno + persona + estado
  const sqlAlumno = `
    SELECT
      a.gym_alumno_id,
      a.gym_alumno_fecharegistro,
      a.gym_alumno_rela_estadoalumno AS estado_id,
      ea.gym_cat_estadoalumno_descripcion AS estado_desc,

      p.gym_persona_id,
      p.gym_persona_nombre,
      p.gym_persona_apellido,
      p.gym_persona_documento,
      p.gym_persona_email,
      p.gym_persona_celular,
      p.gym_persona_fechanacimiento
    FROM gym_alumno a
    JOIN gym_persona p ON p.gym_persona_id = a.gym_alumno_rela_persona
    LEFT JOIN gym_cat_estado_alumno ea
      ON ea.gym_cat_estadoalumno_id = a.gym_alumno_rela_estadoalumno
    WHERE a.gym_alumno_id = :alumno_id
    LIMIT 1;
  `;

  const alumno = await sequelize.query(sqlAlumno, {
    replacements: { alumno_id },
    type: QueryTypes.SELECT,
  });

  if (!alumno?.length) {
    return {
      ok: false,
      codigo: "NO_EXISTE",
      mensaje: "No existe el alumno",
    };
  }

  // 2) Plan actual (regla 3: vigente hoy; si no, último por fin)
  const sqlPlanActual = `
    WITH fvig AS (
      SELECT f.gym_fecha_id
      FROM gym_plan_alumno f
      WHERE f.gym_fecha_rela_alumno = :alumno_id
        AND f.gym_fecha_inicio <= CURRENT_DATE
        AND f.gym_fecha_fin >= CURRENT_DATE
      ORDER BY f.gym_fecha_fin DESC, f.gym_fecha_id DESC
      LIMIT 1
    ),
    fult AS (
      SELECT f.gym_fecha_id
      FROM gym_plan_alumno f
      WHERE f.gym_fecha_rela_alumno = :alumno_id
        AND f.gym_fecha_fin IS NOT NULL
      ORDER BY f.gym_fecha_fin DESC, f.gym_fecha_id DESC
      LIMIT 1
    )
    SELECT
      f.gym_fecha_id AS plan_id,
      f.gym_fecha_inicio AS inicio,
      f.gym_fecha_fin AS fin,
      f.gym_fecha_montopagado AS monto_pagado,
      f.gym_fecha_metodopago AS metodo_pago,
      f.gym_fecha_ingresosdisponibles AS ingresos_disponibles,
      f.gym_fecha_rela_tipoplan AS tipoplan_id,
      tp.gym_cat_tipoplan_descripcion AS tipoplan_desc,
      CASE WHEN (SELECT gym_fecha_id FROM fvig) IS NOT NULL THEN true ELSE false END AS vigente_hoy
    FROM gym_plan_alumno f
    LEFT JOIN gym_cat_tipoplan tp ON tp.gym_cat_tipoplan_id = f.gym_fecha_rela_tipoplan
    WHERE f.gym_fecha_id = COALESCE((SELECT gym_fecha_id FROM fvig),(SELECT gym_fecha_id FROM fult))
    LIMIT 1;
  `;

  const plan_actual = await sequelize.query(sqlPlanActual, {
    replacements: { alumno_id },
    type: QueryTypes.SELECT,
  });

  // 3) Historial de planes/pagos (gym_plan_alumno)
  const sqlPlanes = `
    SELECT
      f.gym_fecha_id AS plan_id,
      f.gym_fecha_inicio AS inicio,
      f.gym_fecha_fin AS fin,
      f.gym_fecha_montopagado AS monto_pagado,
      f.gym_fecha_metodopago AS metodo_pago,
      f.gym_fecha_diasingreso AS dias_ingreso,
      f.gym_fecha_ingresosdisponibles AS ingresos_disponibles,
      f.gym_fecha_rela_tipoplan AS tipoplan_id,
      tp.gym_cat_tipoplan_descripcion AS tipoplan_desc
    FROM gym_plan_alumno f
    LEFT JOIN gym_cat_tipoplan tp ON tp.gym_cat_tipoplan_id = f.gym_fecha_rela_tipoplan
    WHERE f.gym_fecha_rela_alumno = :alumno_id
    ORDER BY f.gym_fecha_fin DESC NULLS LAST, f.gym_fecha_id DESC;
  `;

  const planes = await sequelize.query(sqlPlanes, {
    replacements: { alumno_id },
    type: QueryTypes.SELECT,
  });

  // 4) Resumen (opcional)
  const total_pagos = planes.length;
  const total_recaudado = planes.reduce((acc, it) => acc + Number(it.monto_pagado || 0), 0);
  const ultimo_pago_fecha = planes?.[0]?.inicio ? String(planes[0].inicio).slice(0, 10) : null;

  return {
    ok: true,
    alumno: alumno[0],
    plan_actual: plan_actual?.[0] ?? null,
    planes,
    resumen: { total_pagos, total_recaudado, ultimo_pago_fecha },
  };
}