import { GymCatTipoPlan, GymFechaDisponible } from "../models/index.js";
import { Op } from "sequelize";
import { sequelize } from "../database/sequelize.js";

export async function listarPlanes({ incluirInactivos = true } = {}) {
  const where = {};

  if (!incluirInactivos) {
    where.gym_cat_tipoplan_activo = true;
  }

  const planes = await GymCatTipoPlan.findAll({
    where,
    attributes: [
      "gym_cat_tipoplan_id",
      "gym_cat_tipoplan_descripcion",
      "gym_cat_tipoplan_dias_totales",
      "gym_cat_tipoplan_ingresos",
      "gym_cat_tipoplan_precio",
      "gym_cat_tipoplan_activo",
    ],
    order: [["gym_cat_tipoplan_descripcion", "ASC"]],
  });

  return planes;
}

export async function obtenerPlanPorId(id) {
  return await GymCatTipoPlan.findByPk(id, {
    attributes: [
      "gym_cat_tipoplan_id",
      "gym_cat_tipoplan_descripcion",
      "gym_cat_tipoplan_dias_totales",
      "gym_cat_tipoplan_ingresos",
      "gym_cat_tipoplan_precio",
      "gym_cat_tipoplan_activo",
    ],
  });
}

export async function existePlanConDescripcion(descripcion, excluirId = null) {
  const where = {
    gym_cat_tipoplan_descripcion: descripcion,
  };

  if (excluirId) {
    where.gym_cat_tipoplan_id = {
      [Op.ne]: excluirId,
    };
  }

  const plan = await GymCatTipoPlan.findOne({ where });
  return !!plan;
}

export async function crearPlan(data) {
  const nuevoPlan = await GymCatTipoPlan.create({
    gym_cat_tipoplan_descripcion: data.descripcion,
    gym_cat_tipoplan_dias_totales: data.dias_totales,
    gym_cat_tipoplan_ingresos: data.ingresos,
    gym_cat_tipoplan_precio: data.precio,
    gym_cat_tipoplan_activo: true,
  });

  return nuevoPlan;
}

export async function actualizarPlan(id, data) {
  const plan = await GymCatTipoPlan.findByPk(id);

  if (!plan) return null;

  await plan.update({
    gym_cat_tipoplan_descripcion: data.descripcion,
    gym_cat_tipoplan_dias_totales: data.dias_totales,
    gym_cat_tipoplan_ingresos: data.ingresos,
    gym_cat_tipoplan_precio: data.precio,
    gym_cat_tipoplan_fechacambio: sequelize.literal("CURRENT_TIMESTAMP"),
  });

  return plan;
}

export async function planEstaUsado(id) {
  const uso = await GymFechaDisponible.findOne({
    where: {
      gym_fecha_rela_tipoplan: id,
    },
    attributes: ["gym_fecha_id"],
  });

  return !!uso;
}

export async function cambiarEstadoPlan(id, activo) {
  const plan = await GymCatTipoPlan.findByPk(id);

  if (!plan) return null;

  await plan.update({
    gym_cat_tipoplan_activo: activo,
  });

  return plan;
}