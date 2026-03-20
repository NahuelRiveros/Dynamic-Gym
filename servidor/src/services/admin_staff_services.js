import bcrypt from "bcrypt";
import { Op } from "sequelize";
import { sequelize } from "../database/sequelize.js";
import {
  GymPersona,
  GymUsuario,
  GymUsuarioRol,
  GymRol,
} from "../models/index.js";

const normalizarEmail = (v) => String(v ?? "").trim().toLowerCase();
const normalizarDocumento = (v) => String(v ?? "").replace(/[.\s]/g, "").trim();

const ahoraArgentina = () =>
  sequelize.literal(`TIMEZONE('America/Argentina/Cordoba', CURRENT_TIMESTAMP)`);

export async function listarStaff() {
  const rolStaff = await GymRol.findOne({
    where: { gym_rol_codigo: "staff" },
  });

  if (!rolStaff) {
    return [];
  }

  const relaciones = await GymUsuarioRol.findAll({
    where: {
      gym_usuario_rol_rela_rol: rolStaff.gym_rol_id,
    },
    include: [
      {
        model: GymUsuario,
        as: "usuario",
        include: [
          {
            model: GymPersona,
            as: "persona",
            attributes: [
              "gym_persona_id",
              "gym_persona_nombre",
              "gym_persona_apellido",
              "gym_persona_email",
              "gym_persona_documento",
              "gym_persona_fechacambio",
            ],
          },
        ],
        attributes: [
          "gym_usuario_id",
          "gym_usuario_rela_persona",
          "gym_usuario_activo",
          "gym_usuario_fechacambio",
          "gym_usuario_ultimo_login",
        ],
      },
      {
        model: GymRol,
        as: "rol",
        attributes: ["gym_rol_id", "gym_rol_codigo", "gym_rol_descripcion"],
      },
    ],
    order: [["gym_usuario_rol_id", "DESC"]],
  });

  return relaciones.map((rel) => ({
    gym_usuario_rol_id: rel.gym_usuario_rol_id,
    gym_usuario_id: rel.usuario?.gym_usuario_id,
    gym_usuario_activo: rel.usuario?.gym_usuario_activo,
    gym_usuario_fechacambio: rel.usuario?.gym_usuario_fechacambio,
    gym_usuario_ultimo_login: rel.usuario?.gym_usuario_ultimo_login,

    gym_persona_id: rel.usuario?.persona?.gym_persona_id,
    gym_persona_nombre: rel.usuario?.persona?.gym_persona_nombre,
    gym_persona_apellido: rel.usuario?.persona?.gym_persona_apellido,
    gym_persona_email: rel.usuario?.persona?.gym_persona_email,
    gym_persona_documento: rel.usuario?.persona?.gym_persona_documento,
    gym_persona_fechacambio: rel.usuario?.persona?.gym_persona_fechacambio,

    gym_rol_id: rel.rol?.gym_rol_id,
    gym_rol_codigo: rel.rol?.gym_rol_codigo,
    gym_rol_descripcion: rel.rol?.gym_rol_descripcion,
  }));
}

export async function crearStaff({
  email,
  password,
  nombre,
  apellido,
  documento,
}) {
  const emailN = normalizarEmail(email);
  const pass = String(password ?? "").trim();
  const doc = normalizarDocumento(documento);
  const nombreN = String(nombre ?? "").trim();
  const apellidoN = String(apellido ?? "").trim();

  if (!emailN || !pass || !nombreN || !apellidoN || !doc) {
    return {
      ok: false,
      codigo: "FALTAN_DATOS",
      mensaje: "Requiere: email, password, nombre, apellido y documento",
    };
  }

  if (pass.length < 4) {
    return {
      ok: false,
      codigo: "PASSWORD_INVALIDA",
      mensaje: "La contraseña debe tener al menos 4 caracteres",
    };
  }

  if (!/^\d+$/.test(doc)) {
    return {
      ok: false,
      codigo: "DOCUMENTO_INVALIDO",
      mensaje: "El documento debe contener solo números",
    };
  }

  return await sequelize.transaction(async (t) => {
    const rolStaff = await GymRol.findOne({
      where: { gym_rol_codigo: "staff" },
      transaction: t,
    });

    if (!rolStaff) {
      return {
        ok: false,
        codigo: "SIN_ROL_STAFF",
        mensaje: "No existe el rol 'staff' en gym_rol",
      };
    }

    let persona = await GymPersona.findOne({
      where: {
        [Op.or]: [
          { gym_persona_email: emailN },
          { gym_persona_documento: Number(doc) },
        ],
      },
      transaction: t,
    });

    if (persona) {
      const usuarioExistente = await GymUsuario.findOne({
        where: { gym_usuario_rela_persona: persona.gym_persona_id },
        transaction: t,
      });

      if (usuarioExistente) {
        const yaTieneRol = await GymUsuarioRol.findOne({
          where: {
            gym_usuario_rol_rela_usuario: usuarioExistente.gym_usuario_id,
            gym_usuario_rol_rela_rol: rolStaff.gym_rol_id,
          },
          transaction: t,
        });

        if (yaTieneRol) {
          return {
            ok: false,
            codigo: "STAFF_YA_EXISTE",
            mensaje: "La persona ya tiene un usuario con rol staff",
          };
        }

        await GymUsuarioRol.create(
          {
            gym_usuario_rol_rela_usuario: usuarioExistente.gym_usuario_id,
            gym_usuario_rol_rela_rol: rolStaff.gym_rol_id,
            gym_usuario_rol_fechacambio: ahoraArgentina(),
          },
          { transaction: t }
        );

        return {
          ok: true,
          codigo: "ROL_STAFF_ASIGNADO",
          mensaje: "Se asignó el rol staff a un usuario existente",
          usuario_id: usuarioExistente.gym_usuario_id,
          persona_id: persona.gym_persona_id,
          email: persona.gym_persona_email,
          rol: "staff",
        };
      }

      const hash = await bcrypt.hash(pass, 10);

      const nuevoUsuario = await GymUsuario.create(
        {
          gym_usuario_rela_persona: persona.gym_persona_id,
          gym_usuario_contrasena: hash,
          gym_usuario_activo: true,
          gym_usuario_fechacambio: ahoraArgentina(),
        },
        { transaction: t }
      );

      await GymUsuarioRol.create(
        {
          gym_usuario_rol_rela_usuario: nuevoUsuario.gym_usuario_id,
          gym_usuario_rol_rela_rol: rolStaff.gym_rol_id,
          gym_usuario_rol_fechacambio: ahoraArgentina(),
        },
        { transaction: t }
      );

      return {
        ok: true,
        codigo: "USUARIO_STAFF_CREADO",
        mensaje: "Staff creado correctamente",
        usuario_id: nuevoUsuario.gym_usuario_id,
        persona_id: persona.gym_persona_id,
        email: persona.gym_persona_email,
        rol: "staff",
      };
    }

    persona = await GymPersona.create(
      {
        gym_persona_nombre: nombreN,
        gym_persona_apellido: apellidoN,
        gym_persona_email: emailN,
        gym_persona_documento: Number(doc),
        gym_persona_fechacambio: ahoraArgentina(),
      },
      { transaction: t }
    );

    const hash = await bcrypt.hash(pass, 10);

    const usuario = await GymUsuario.create(
      {
        gym_usuario_rela_persona: persona.gym_persona_id,
        gym_usuario_contrasena: hash,
        gym_usuario_activo: true,
        gym_usuario_fechacambio: ahoraArgentina(),
      },
      { transaction: t }
    );

    await GymUsuarioRol.create(
      {
        gym_usuario_rol_rela_usuario: usuario.gym_usuario_id,
        gym_usuario_rol_rela_rol: rolStaff.gym_rol_id,
        gym_usuario_rol_fechacambio: ahoraArgentina(),
      },
      { transaction: t }
    );

    return {
      ok: true,
      codigo: "USUARIO_STAFF_CREADO",
      mensaje: "Staff creado correctamente",
      usuario_id: usuario.gym_usuario_id,
      persona_id: persona.gym_persona_id,
      email: persona.gym_persona_email,
      rol: "staff",
    };
  });
}

export async function actualizarStaff(usuarioId, data) {
  const emailN = normalizarEmail(data.email);
  const doc = normalizarDocumento(data.documento);
  const nombreN = String(data.nombre ?? "").trim();
  const apellidoN = String(data.apellido ?? "").trim();

  if (!nombreN || !apellidoN || !emailN || !doc) {
    return {
      ok: false,
      codigo: "FALTAN_DATOS",
      mensaje: "Requiere: nombre, apellido, email y documento",
    };
  }

  if (!/^\d+$/.test(doc)) {
    return {
      ok: false,
      codigo: "DOCUMENTO_INVALIDO",
      mensaje: "El documento debe contener solo números",
    };
  }

  return await sequelize.transaction(async (t) => {
    const usuario = await GymUsuario.findByPk(usuarioId, {
      include: [
        {
          model: GymPersona,
          as: "persona",
        },
      ],
      transaction: t,
    });

    if (!usuario || !usuario.persona) {
      return {
        ok: false,
        codigo: "NO_ENCONTRADO",
        mensaje: "Staff no encontrado",
      };
    }

    const otraPersonaConEmail = await GymPersona.findOne({
      where: {
        gym_persona_email: emailN,
        gym_persona_id: { [Op.ne]: usuario.persona.gym_persona_id },
      },
      transaction: t,
    });

    if (otraPersonaConEmail) {
      return {
        ok: false,
        codigo: "EMAIL_DUPLICADO",
        mensaje: "Ya existe una persona con ese email",
      };
    }

    const otraPersonaConDocumento = await GymPersona.findOne({
      where: {
        gym_persona_documento: Number(doc),
        gym_persona_id: { [Op.ne]: usuario.persona.gym_persona_id },
      },
      transaction: t,
    });

    if (otraPersonaConDocumento) {
      return {
        ok: false,
        codigo: "DOCUMENTO_DUPLICADO",
        mensaje: "Ya existe una persona con ese documento",
      };
    }

    await usuario.persona.update(
      {
        gym_persona_nombre: nombreN,
        gym_persona_apellido: apellidoN,
        gym_persona_email: emailN,
        gym_persona_documento: Number(doc),
        gym_persona_fechacambio: ahoraArgentina(),
      },
      { transaction: t }
    );

    await usuario.update(
      {
        gym_usuario_fechacambio: ahoraArgentina(),
      },
      { transaction: t }
    );

    return {
      ok: true,
      codigo: "STAFF_ACTUALIZADO",
      mensaje: "Staff actualizado correctamente",
      usuario_id: usuario.gym_usuario_id,
      persona_id: usuario.persona.gym_persona_id,
    };
  });
}

export async function cambiarPasswordStaff(usuarioId, nuevaPassword) {
  const pass = String(nuevaPassword ?? "").trim();

  if (!pass || pass.length < 4) {
    return {
      ok: false,
      codigo: "PASSWORD_INVALIDA",
      mensaje: "La contraseña debe tener al menos 4 caracteres",
    };
  }

  const usuario = await GymUsuario.findByPk(usuarioId);

  if (!usuario) {
    return {
      ok: false,
      codigo: "NO_ENCONTRADO",
      mensaje: "Staff no encontrado",
    };
  }

  const hash = await bcrypt.hash(pass, 10);

  await usuario.update({
    gym_usuario_contrasena: hash,
    gym_usuario_fechacambio: ahoraArgentina(),
  });

  return {
    ok: true,
    codigo: "PASSWORD_ACTUALIZADA",
    mensaje: "Contraseña actualizada correctamente",
  };
}

export async function cambiarEstadoStaff(usuarioId, activo) {
  const usuario = await GymUsuario.findByPk(usuarioId);

  if (!usuario) {
    return {
      ok: false,
      codigo: "NO_ENCONTRADO",
      mensaje: "Staff no encontrado",
    };
  }

  await usuario.update({
    gym_usuario_activo: activo,
    gym_usuario_fechacambio: ahoraArgentina(),
  });

  return {
    ok: true,
    codigo: "ESTADO_ACTUALIZADO",
    mensaje: activo
      ? "Staff activado correctamente"
      : "Staff desactivado correctamente",
  };
}