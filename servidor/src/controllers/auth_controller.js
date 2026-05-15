//auth_controller.js
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { login } from "../services/auth_service.js";
import { GymPersona, GymUsuario } from "../models/index.js";

export async function loginController(req, res) {
  try {
    const { email, password } = req.body ?? {};
    const result = await login({ email, password });

    if (!result.ok) {
      return res.status(401).json(result);
    }

    // ✅ Opción simple (para empezar): devolver token en JSON
    return res.json(result);

    // ✅ Opción más segura (cookie httpOnly) - si querés la activamos luego:
    // res.cookie("access_token", result.token, {
    //   httpOnly: true,
    //   sameSite: "lax",
    //   secure: false, // true en https
    //   maxAge: 60 * 60 * 1000,
    // });
    // return res.json({ ok: true, usuario: result.usuario });

  } catch (error) {
    console.error("loginController:", error);
    return res.status(500).json({
      ok: false,
      codigo: "ERROR_LOGIN",
      mensaje: "No se pudo hacer login",
    });
  }
}

export async function meController(req, res) {
  try {
    const persona = await GymPersona.findByPk(req.user.persona_id, {
      attributes: ["gym_persona_nombre", "gym_persona_apellido", "gym_persona_email"],
    });

    return res.json({
      ok: true,
      user: {
        ...req.user,
        nombre:   persona?.gym_persona_nombre   ?? null,
        apellido: persona?.gym_persona_apellido ?? null,
        email:    persona?.gym_persona_email    ?? null,
      },
    });
  } catch (error) {
    console.error("meController:", error);
    return res.status(500).json({ ok: false, codigo: "ERROR_ME", mensaje: "No se pudo obtener sesión" });
  }
}

export async function logoutController(req, res) {
  try {
    // Si usás cookie:
    // res.clearCookie("access_token");
    return res.json({ ok: true, mensaje: "Logout OK" });
  } catch (error) {
    console.error("logoutController:", error);
    return res.status(500).json({ ok: false, codigo: "ERROR_LOGOUT", mensaje: "No se pudo cerrar sesión" });
  }
}

export async function resetPasswordController(req, res) {
  try {
    const { email, newPassword } = req.body ?? {};
    if (!email || !newPassword) {
      return res.status(400).json({ ok: false, mensaje: "Requerido: email y newPassword" });
    }

    const persona = await GymPersona.findOne({
      where: { gym_persona_email: String(email).trim().toLowerCase() },
    });
    if (!persona) {
      return res.status(404).json({ ok: false, mensaje: "Email no encontrado" });
    }

    const usuario = await GymUsuario.findOne({
      where: { gym_usuario_rela_persona: persona.gym_persona_id },
    });
    if (!usuario) {
      return res.status(404).json({ ok: false, mensaje: "Usuario no encontrado" });
    }

    const hash = await bcrypt.hash(String(newPassword).trim(), 10);
    await usuario.update({ gym_usuario_contrasena: hash });

    console.log("🔄 Password reseteado para:", email);
    return res.json({ ok: true, mensaje: "Contraseña actualizada correctamente" });
  } catch (error) {
    console.error("resetPasswordController:", error);
    return res.status(500).json({ ok: false, mensaje: "No se pudo resetear la contraseña" });
  }
}
