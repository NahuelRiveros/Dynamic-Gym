import cron from "node-cron";
import { actualizarEstadosAlumnosAutomatico } from "../services/estado_alumno_auto_service.js";

export function iniciarCronEstadoAlumnos() {
  // Cada 1 hora
  cron.schedule("0 * * * *", async () => {
    try {
      console.log("⏰ Ejecutando actualización automática de estados...");

      const r = await actualizarEstadosAlumnosAutomatico({
        fuente: "AUTO_CRON",
        modificado_por: "SYSTEM",
      });

      console.log(`✔ Estados actualizados. Cambios: ${r.total_cambios}`);
    } catch (err) {
      console.error("❌ Error en cron estado alumnos:", err);
    }
  });

  console.log("🟢 Cron de estados de alumnos iniciado (cada 1 hora)");
}