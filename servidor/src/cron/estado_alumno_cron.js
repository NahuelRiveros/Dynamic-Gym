import cron from "node-cron";
import { actualizarEstadosAlumnosAutomatico } from "../services/estado_alumno_auto_service.js";

export function iniciarCronEstadoAlumnos() {
  // Todos los días a las 03:00 AM
  cron.schedule("0 3 * * *", async () => {
    try {
      console.log("⏰ Ejecutando actualización automática de estados...");

      const r = await actualizarEstadosAlumnosAutomatico({
        fuente: "AUTO_CRON",
        modificado_por: "SYSTEM",
      });

      console.log(
        `✔ Estados actualizados. Cambios: ${r.total_cambios}`
      );
    } catch (err) {
      console.error("❌ Error en cron estado alumnos:", err);
    }
  });

  console.log("🟢 Cron de estados de alumnos iniciado (03:00 AM)");
}