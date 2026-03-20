import { DataTypes } from "sequelize";
import { sequelize } from "../database/sequelize.js";

export const GymCatTipoPlan = sequelize.define(
  "gym_cat_tipoplan",
  {
    gym_cat_tipoplan_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    gym_cat_tipoplan_descripcion: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    gym_cat_tipoplan_fechacambio: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: sequelize.literal("CURRENT_TIMESTAMP"),
    },
    gym_cat_tipoplan_dias_totales: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    gym_cat_tipoplan_ingresos: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    gym_cat_tipoplan_precio: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },
    gym_cat_tipoplan_activo: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    tableName: "gym_cat_tipoplan",
    timestamps: false,
  }
);