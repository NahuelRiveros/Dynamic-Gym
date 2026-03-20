import { Sequelize } from "sequelize";
import { env } from "../configuracion_servidor/env.js";

const sslOptions = env.DB_SSL
  ? { ssl: { require: true, rejectUnauthorized: false } }
  : {};

export const sequelize = env.DATABASE_URL
  ? new Sequelize(env.DATABASE_URL, {
      dialect: "postgres",
      logging: false,
      dialectOptions: sslOptions,
    })
  : new Sequelize(env.DB_NAME, env.DB_USER, env.DB_PASS, {
      host: env.DB_HOST,
      port: env.DB_PORT,
      dialect: "postgres",
      logging: false,
      dialectOptions: sslOptions,
    });

export async function conectarDB() {
  try {
    await sequelize.authenticate();
    await sequelize.query(`SET TIME ZONE 'America/Argentina/Cordoba'`);
    console.log("✅ Base de datos conectada");
  } catch (error) {
    console.error("❌ Error al conectar la base de datos:", error);
    throw error;
  }
}