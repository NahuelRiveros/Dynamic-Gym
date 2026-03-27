import { sequelize } from "../database/sequelize.js";
import { QueryTypes } from "sequelize";
import {
  GymPersona,
  GymAlumno,
  GymFechaDisponible,
  GymCatTipoPlan,
} from "../models/index.js";

const ESTADO_HABILITADO = 1;
const TZ_BA = "America/Argentina/Buenos_Aires";

const normalizarDocumento = (doc) =>
  String(doc ?? "").replace(/[.\s]/g, "").trim();

/**
 * YYYY-MM-DD en zona Buenos Aires
 */
function fechaISOArgentina(d = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ_BA,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

/**
 * Suma N días a una fecha ISO (YYYY-MM-DD) y devuelve YYYY-MM-DD
 * Trabajamos sobre UTC para evitar depender del server
 */
function sumarDiasISO(fechaISO, dias) {
  const [y, m, d] = String(fechaISO).split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + Number(dias));
  return dt.toISOString().slice(0, 10);
}

/**
 * Registrar pago por DNI.
 * - Inserta en gym_plan_alumno
 * - Actualiza alumno y lo habilita
 * - Log de cambio de estado si correspondía
 *
 * REGLA NUEVA:
 * - El nuevo plan SIEMPRE arranca HOY
 * - NO espera al vencimiento del plan vigente
 */
export async function registrarPagoPorDni({
  documento,
  tipo_plan_id,
  monto_pagado,
  metodo_pago,
  usuario_id_cobro,
  modificado_por = "SYSTEM",
}) {
  const dni = normalizarDocumento(documento);
  const dniNum = Number(dni);

  if (!Number.isFinite(dniNum) || dniNum <= 0) {
    return {
      ok: false,
      codigo: "VALIDACION",
      mensaje: "Documento inválido",
    };
  }

  if (!Number.isFinite(Number(tipo_plan_id)) || Number(tipo_plan_id) <= 0) {
    return {
      ok: false,
      codigo: "VALIDACION",
      mensaje: "tipo_plan_id inválido",
    };
  }

  if (!Number.isFinite(Number(monto_pagado)) || Number(monto_pagado) <= 0) {
    return {
      ok: false,
      codigo: "VALIDACION",
      mensaje: "monto_pagado inválido",
    };
  }

  if (!String(metodo_pago ?? "").trim()) {
    return {
      ok: false,
      codigo: "VALIDACION",
      mensaje: "metodo_pago es obligatorio",
    };
  }

  if (!Number.isFinite(Number(usuario_id_cobro)) || Number(usuario_id_cobro) <= 0) {
    return {
      ok: false,
      codigo: "USUARIO_COBRO_INVALIDO",
      mensaje: "No se pudo identificar el usuario que registra el pago",
    };
  }

  const hoyISO = fechaISOArgentina(new Date());

  return sequelize.transaction(async (t) => {
    // 1) Persona por DNI
    const persona = await GymPersona.findOne({
      where: { gym_persona_documento: dniNum },
      transaction: t,
    });

    if (!persona) {
      return {
        ok: false,
        codigo: "NO_EXISTE",
        mensaje: "No existe una persona con ese documento",
      };
    }

    // 2) Alumno (lock)
    const alumno = await GymAlumno.findOne({
      where: { gym_alumno_rela_persona: persona.gym_persona_id },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    if (!alumno) {
      return {
        ok: false,
        codigo: "NO_ES_ALUMNO",
        mensaje: "La persona existe pero no es alumno",
      };
    }

    // 3) Tipo de plan
    const tipoPlan = await GymCatTipoPlan.findByPk(Number(tipo_plan_id), {
      transaction: t,
    });

    if (!tipoPlan) {
      return {
        ok: false,
        codigo: "PLAN_NO_EXISTE",
        mensaje: "No existe el tipo de plan indicado",
      };
    }

    const diasTotales = Number(tipoPlan.gym_cat_tipoplan_dias_totales);
    const ingresosTotales = Number(tipoPlan.gym_cat_tipoplan_ingresos);

    if (!Number.isFinite(diasTotales) || diasTotales <= 0) {
      return {
        ok: false,
        codigo: "VALIDACION",
        mensaje: "El plan tiene días inválidos (dias_totales)",
      };
    }

    if (!Number.isFinite(ingresosTotales) || ingresosTotales < 0) {
      return {
        ok: false,
        codigo: "VALIDACION",
        mensaje: "El plan tiene ingresos inválidos (ingresos)",
      };
    }

    // 4) Fechas del nuevo plan
    // REGLA NUEVA: siempre arranca hoy
    const inicio = hoyISO;
    const fin = sumarDiasISO(inicio, diasTotales - 1);

    // 5) Insertar pago / vigencia
    const [rowsFD] = await sequelize.query(
      `
      INSERT INTO gym_plan_alumno (
        gym_fecha_rela_alumno,
        gym_fecha_montopagado,
        gym_fecha_inicio,
        gym_fecha_fin,
        gym_fecha_diasingreso,
        gym_fecha_ingresosdisponibles,
        gym_fecha_metodopago,
        gym_fecha_fechacambio,
        gym_fecha_rela_tipoplan,
        gym_fecha_rela_usuario_cobro
      )
      VALUES (
        :alumno_id,
        :monto_pagado,
        :inicio::date,
        :fin::date,
        :dias_totales,
        :ingresos_totales,
        :metodo_pago,
        (now() AT TIME ZONE '${TZ_BA}'),
        :tipo_plan_id,
        :usuario_id_cobro
      )
      RETURNING
        gym_fecha_id,
        gym_fecha_fechacambio,
        gym_fecha_rela_usuario_cobro
      `,
      {
        type: QueryTypes.INSERT,
        transaction: t,
        replacements: {
          alumno_id: alumno.gym_alumno_id,
          monto_pagado: Number(monto_pagado),
          inicio,
          fin,
          dias_totales: diasTotales,
          ingresos_totales: ingresosTotales,
          metodo_pago: String(metodo_pago ?? "").trim(),
          tipo_plan_id: tipoPlan.gym_cat_tipoplan_id,
          usuario_id_cobro: Number(usuario_id_cobro),
        },
      }
    );

    const filaFD = Array.isArray(rowsFD) ? rowsFD[0] : rowsFD;
    const fechaId = filaFD?.gym_fecha_id ?? null;
    const fechaCambio = filaFD?.gym_fecha_fechacambio ?? null;
    const usuarioCobroId = filaFD?.gym_fecha_rela_usuario_cobro ?? Number(usuario_id_cobro);

    // 6) Actualizar alumno: plan actual + estado habilitado
    const estadoAnterior = Number(alumno.gym_alumno_rela_estadoalumno);

    await alumno.update(
      {
        gym_alumno_rela_tipoplan: tipoPlan.gym_cat_tipoplan_id,
        gym_alumno_rela_estadoalumno: ESTADO_HABILITADO,
      },
      { transaction: t }
    );

    // 7) Log si cambió el estado
    if (estadoAnterior !== ESTADO_HABILITADO) {
      await sequelize.query(
        `
        INSERT INTO gym_log_estado_alumno (
          gym_log_estadoalumno_rela_alumno,
          gym_log_estadoalumno_estado_anterior,
          gym_log_estadoalumno_estado_nuevo,
          gym_log_estadoalumno_fechacambio,
          gym_log_estadoalumno_motivo,
          gym_log_estadoalumno_fuente,
          gym_log_estadoalumno_modificado_por
        )
        VALUES (
          :alumno_id,
          :anterior,
          :nuevo,
          (now() AT TIME ZONE '${TZ_BA}'),
          :motivo,
          :fuente,
          :modificado_por
        )
        `,
        {
          type: QueryTypes.INSERT,
          transaction: t,
          replacements: {
            alumno_id: alumno.gym_alumno_id,
            anterior: estadoAnterior,
            nuevo: ESTADO_HABILITADO,
            motivo: "Habilitado por registro de pago",
            fuente: "PAGOS",
            modificado_por,
          },
        }
      );
    }

    // 8) Respuesta
    return {
      ok: true,
      codigo: "OK",
      mensaje: "Pago registrado y alumno habilitado",
      alumno: {
        alumno_id: alumno.gym_alumno_id,
        persona_id: persona.gym_persona_id,
        nombre: persona.gym_persona_nombre,
        apellido: persona.gym_persona_apellido,
        documento: persona.gym_persona_documento,
        estado_id: ESTADO_HABILITADO,
        tipo_plan_id: tipoPlan.gym_cat_tipoplan_id,
      },
      pago: {
        fecha_id: fechaId,
        monto_pagado: Number(monto_pagado),
        metodo_pago: String(metodo_pago ?? "").trim(),
        usuario_id_cobro: usuarioCobroId,
        fecha_cambio: fechaCambio,
      },
      plan: {
        tipo_plan_id: tipoPlan.gym_cat_tipoplan_id,
        tipo_plan_descripcion: tipoPlan.gym_cat_tipoplan_descripcion,
        inicio,
        fin,
        dias_totales: diasTotales,
        ingresos_disponibles: ingresosTotales,
      },
      info: {
        inicia_desde_hoy: true,
      },
    };
  });
}

/**
 * Preview pago por DNI:
 * Devuelve alumno + último pago (si existe) para confirmar antes de pagar.
 */
export async function previewPagoPorDni({ documento }) {
  const dni = normalizarDocumento(documento);
  const dniNum = Number(dni);

  if (!Number.isFinite(dniNum) || dniNum <= 0) {
    return {
      ok: false,
      codigo: "VALIDACION",
      mensaje: "Documento inválido",
    };
  }

  const sql = `
    SELECT
      a.gym_alumno_id,
      a.gym_alumno_rela_estadoalumno AS estado_id,
      ea.gym_cat_estadoalumno_descripcion AS estado_desc,

      p.gym_persona_id,
      p.gym_persona_nombre,
      p.gym_persona_apellido,
      p.gym_persona_documento,
      p.gym_persona_email,
      p.gym_persona_celular,

      flast.gym_fecha_id AS pago_id,
      flast.gym_fecha_inicio AS pago_inicio,
      flast.gym_fecha_fin AS pago_fin,
      flast.gym_fecha_ingresosdisponibles AS ingresos_disponibles,
      flast.gym_fecha_montopagado AS monto_pagado,
      flast.gym_fecha_metodopago AS metodo_pago,
      flast.gym_fecha_fechacambio AS fecha_pago,
      tp.gym_cat_tipoplan_descripcion AS plan_tipo_desc
    FROM gym_persona p
    LEFT JOIN gym_alumno a
      ON a.gym_alumno_rela_persona = p.gym_persona_id
    LEFT JOIN gym_cat_estado_alumno ea
      ON ea.gym_cat_estadoalumno_id = a.gym_alumno_rela_estadoalumno

    LEFT JOIN LATERAL (
      SELECT
        f.gym_fecha_id,
        f.gym_fecha_inicio,
        f.gym_fecha_fin,
        f.gym_fecha_ingresosdisponibles,
        f.gym_fecha_rela_tipoplan,
        f.gym_fecha_montopagado,
        f.gym_fecha_metodopago,
        f.gym_fecha_fechacambio
      FROM gym_plan_alumno f
      WHERE f.gym_fecha_rela_alumno = a.gym_alumno_id
      ORDER BY f.gym_fecha_id DESC
      LIMIT 1
    ) flast ON TRUE

    LEFT JOIN gym_cat_tipoplan tp
      ON tp.gym_cat_tipoplan_id = flast.gym_fecha_rela_tipoplan

    WHERE p.gym_persona_documento = :dniNum
    LIMIT 1
  `;

  const rows = await sequelize.query(sql, {
    type: QueryTypes.SELECT,
    replacements: { dniNum },
  });

  const it = rows?.[0];

  if (!it) {
    return {
      ok: false,
      codigo: "NO_EXISTE",
      mensaje: "No existe una persona con ese documento",
    };
  }

  if (!it.gym_alumno_id) {
    return {
      ok: false,
      codigo: "NO_ES_ALUMNO",
      mensaje: "La persona existe pero no es alumno",
    };
  }

  return {
    ok: true,
    alumno: {
      alumno_id: it.gym_alumno_id,
      persona_id: it.gym_persona_id,
      nombre: it.gym_persona_nombre,
      apellido: it.gym_persona_apellido,
      documento: it.gym_persona_documento,
      email: it.gym_persona_email,
      celular: it.gym_persona_celular,
      estado_id: it.estado_id,
      estado_desc: it.estado_desc,
    },
    ultimo_pago: it.pago_id
      ? {
          pago_id: it.pago_id,
          inicio: it.pago_inicio ? String(it.pago_inicio).slice(0, 10) : null,
          fin: it.pago_fin ? String(it.pago_fin).slice(0, 10) : null,
          ingresos_disponibles: it.ingresos_disponibles,
          tipo_desc: it.plan_tipo_desc,
          monto_pagado: it.monto_pagado,
          metodo_pago: it.metodo_pago,
          fecha_pago: it.fecha_pago,
        }
      : null,
  };
}