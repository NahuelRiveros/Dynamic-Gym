import { actualizarEstadosAlumnosAutomatico } from "../services/estado_alumno_auto_service.js";

export async function ActualizarEstadosAutomatico(req, res) {
  try {
    // si querés, del req.user sacás email del admin:
    const modificado_por = req.user?.email || "SYSTEM";
    console.log(modificado_por)
    const r = await actualizarEstadosAlumnosAutomatico({
      fuente: "ADMIN_PANEL",
      modificado_por,
      limit: 10000,
    });

    return res.json(r);
  } catch (e) {
    console.error("ActualizarEstadosAutomatico:", e);
    return res.status(500).json({
      ok: false,
      codigo: "ERROR_ACTUALIZAR_ESTADOS_AUTO",
      mensaje: "No se pudo actualizar estados automáticamente",
    });
  }
}