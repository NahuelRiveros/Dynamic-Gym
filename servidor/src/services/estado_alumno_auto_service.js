import { sequelize } from "../database/sequelize.js";
import { QueryTypes } from "sequelize";

const ESTADO = {
  HABILITADO: 1,
  RESTRINGIDO: 2,
  PENDIENTE: 3,
};

// Reglas (MVP):
// - Si NO tiene plan vigente hoy => RESTRINGIDO
// - Si tiene plan vigente hoy pero ingresos_disponibles <= 0 => RESTRINGIDO
// - Si tiene plan vigente hoy y (ingresos_disponibles es null o > 0) => HABILITADO
//
// Nota: ingresos_disponibles NULL lo tratamos como "ilimitado" (mensual por fecha).
function calcularNuevoEstado({ tiene_plan_vigente, ingresos_disponibles }) {
  if (!tiene_plan_vigente) return ESTADO.RESTRINGIDO;

  // Si el plan usa ingresos y llegó a 0 => restringido
  if (ingresos_disponibles != null && Number(ingresos_disponibles) <= 0) {
    return ESTADO.RESTRINGIDO;
  }

  return ESTADO.HABILITADO;
}

function motivoCambio({ tiene_plan_vigente, ingresos_disponibles, nuevoEstado }) {
  if (nuevoEstado === ESTADO.HABILITADO) {
    return "Cambio automático: plan vigente (habilitado)";
  }
  // restringido
  if (!tiene_plan_vigente) return "Cambio automático: plan vencido";
  if (ingresos_disponibles != null && Number(ingresos_disponibles) <= 0) {
    return "Cambio automático: sin ingresos disponibles";
  }
  return "Cambio automático: restricción por reglas";
}

/**
 * Actualiza estados según reglas y registra log.
 * @param {object} opts
 * @param {string} opts.fuente  ejemplo: "AUTO_CRON" | "AUTO_KIOSK" | "ADMIN_PANEL"
 * @param {string} opts.modificado_por ejemplo: "SYSTEM" o email del admin
 * @param {number} opts.limit opcional para procesar en lotes
 */
export async function actualizarEstadosAlumnosAutomatico({
  fuente = "AUTO_CRON",
  modificado_por = "SYSTEM",
  limit = 5000,
} = {}) {
  const t = await sequelize.transaction();

  try {
    // Traemos alumnos + estado actual + plan vigente hoy (si existe)
    // Usamos LATERAL para plan vigente y sus ingresos.
    const sql = `
      SELECT
        a.gym_alumno_id AS alumno_id,
        a.gym_alumno_rela_estadoalumno AS estado_actual,

        fvig.gym_fecha_id AS plan_vigente_id,
        fvig.gym_fecha_ingresosdisponibles AS ingresos_disponibles
      FROM gym_alumno a
      LEFT JOIN LATERAL (
        SELECT
          f.gym_fecha_id,
          f.gym_fecha_ingresosdisponibles
        FROM gym_fecha_disponible f
        WHERE f.gym_fecha_rela_alumno = a.gym_alumno_id
          AND f.gym_fecha_inicio <= CURRENT_DATE
          AND f.gym_fecha_fin >= CURRENT_DATE
        ORDER BY f.gym_fecha_fin DESC, f.gym_fecha_id DESC
        LIMIT 1
      ) fvig ON TRUE
      LIMIT :limit;
    `;

    const alumnos = await sequelize.query(sql, {
      type: QueryTypes.SELECT,
      replacements: { limit },
      transaction: t,
    });

    const cambios = [];

    for (const row of alumnos) {
      const tiene_plan_vigente = row.plan_vigente_id != null;
      const nuevo = calcularNuevoEstado({
        tiene_plan_vigente,
        ingresos_disponibles: row.ingresos_disponibles,
      });

      const anterior = Number(row.estado_actual);

      // Si no cambia, no hacemos nada
      if (anterior === nuevo) continue;

      const motivo = motivoCambio({
        tiene_plan_vigente,
        ingresos_disponibles: row.ingresos_disponibles,
        nuevoEstado: nuevo,
      });

      // Update alumno
      await sequelize.query(
        `
        UPDATE gym_alumno
        SET gym_alumno_rela_estadoalumno = :nuevo,
            gym_alumno_fechacambio = NOW()
        WHERE gym_alumno_id = :alumno_id;
        `,
        {
          type: QueryTypes.UPDATE,
          replacements: { nuevo, alumno_id: row.alumno_id },
          transaction: t,
        }
      );

      // Insert log
      await sequelize.query(
        `
        INSERT INTO gym_log_estado_alumno (
          gym_log_estadoalumno_rela_alumno,
          gym_log_estadoalumno_estado_anterior,
          gym_log_estadoalumno_estado_nuevo,
          gym_log_estadoalumno_motivo,
          gym_log_estadoalumno_fuente,
          gym_log_estadoalumno_modificado_por
        ) VALUES (
          :alumno_id,
          :anterior,
          :nuevo,
          :motivo,
          :fuente,
          :modificado_por
        );
        `,
        {
          type: QueryTypes.INSERT,
          replacements: {
            alumno_id: row.alumno_id,
            anterior,
            nuevo,
            motivo,
            fuente,
            modificado_por,
          },
          transaction: t,
        }
      );

      cambios.push({
        alumno_id: row.alumno_id,
        estado_anterior: anterior,
        estado_nuevo: nuevo,
        motivo,
      });
    }

    await t.commit();

    return {
      ok: true,
      total_analizados: alumnos.length,
      total_cambios: cambios.length,
      cambios,
    };
  } catch (e) {
    await t.rollback();
    throw e;
  }
}