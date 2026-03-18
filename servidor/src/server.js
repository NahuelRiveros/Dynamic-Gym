import { createApp } from "./app.js";
import { sequelize } from "./database/sequelize.js";
import { iniciarCronEstadoAlumnos } from "./cron/estado_alumno_cron.js";
import "./models/index.js";
import { env } from "./configuracion_servidor/env.js";

console.log("JWT_SECRET:", env.JWT_SECRET);

async function main() {
  await sequelize.authenticate();
  console.log("✅ DB conectada");

  iniciarCronEstadoAlumnos();

  const app = createApp();

  app.listen(env.PORT, "0.0.0.0", () => {
    console.log(`✅ API local: http://localhost:${env.PORT}`);
    console.log(`✅ API red:   http://TU-IP-LOCAL:${env.PORT}`);
  });
}

main().catch((e) => {
  console.error("❌ Error al iniciar:", e);
  process.exit(1);
});