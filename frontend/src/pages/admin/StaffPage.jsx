import { useEffect, useState } from "react";
import StaffFormModal from "../../components/modal/staff_form_modal";
import StaffPasswordModal from "../../components/modal/staff_password_modal";
import {
  obtenerStaff,
  crearStaff,
  actualizarStaff,
  cambiarPasswordStaff,
  cambiarEstadoStaff,
} from "../../api/staff_api";

function formatearFecha(fecha) {
  if (!fecha) return "-";

  return new Date(fecha).toLocaleString("es-AR", {
    timeZone: "America/Argentina/Cordoba",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

export default function StaffPage() {
  const [staff, setStaff] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const [modalFormAbierto, setModalFormAbierto] = useState(false);
  const [modalPasswordAbierto, setModalPasswordAbierto] = useState(false);

  const [staffSeleccionado, setStaffSeleccionado] = useState(null);
  const [guardando, setGuardando] = useState(false);

  async function cargarStaff() {
    try {
      setCargando(true);
      setError("");

      const resp = await obtenerStaff();
      setStaff(resp.data || []);
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.mensaje || "No se pudo cargar el staff");
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargarStaff();
  }, []);

  function abrirNuevo() {
    setStaffSeleccionado(null);
    setModalFormAbierto(true);
  }

  function abrirEditar(usuario) {
    setStaffSeleccionado(usuario);
    setModalFormAbierto(true);
  }

  function abrirPassword(usuario) {
    setStaffSeleccionado(usuario);
    setModalPasswordAbierto(true);
  }

  function cerrarFormModal() {
    setModalFormAbierto(false);
    setStaffSeleccionado(null);
  }

  function cerrarPasswordModal() {
    setModalPasswordAbierto(false);
    setStaffSeleccionado(null);
  }

  async function guardarStaff(payload) {
    try {
      setGuardando(true);

      if (staffSeleccionado?.gym_usuario_id) {
        await actualizarStaff(staffSeleccionado.gym_usuario_id, payload);
      } else {
        await crearStaff(payload);
      }

      cerrarFormModal();
      await cargarStaff();
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.mensaje || "No se pudo guardar el staff");
    } finally {
      setGuardando(false);
    }
  }

  async function guardarPassword(payload) {
    try {
      setGuardando(true);

      await cambiarPasswordStaff(staffSeleccionado.gym_usuario_id, payload.password);

      cerrarPasswordModal();
      await cargarStaff();
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.mensaje || "No se pudo cambiar la contraseña");
    } finally {
      setGuardando(false);
    }
  }

  async function toggleEstado(usuario) {
    const nuevoEstado = !usuario.gym_usuario_activo;
    const accion = nuevoEstado ? "activar" : "desactivar";

    const confirmar = window.confirm(
      `¿Seguro que querés ${accion} a ${usuario.gym_persona_nombre} ${usuario.gym_persona_apellido}?`
    );

    if (!confirmar) return;

    try {
      await cambiarEstadoStaff(usuario.gym_usuario_id, nuevoEstado);
      await cargarStaff();
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.mensaje || `No se pudo ${accion} el staff`);
    }
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-3 rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 to-white p-5 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Staff</h1>
          <p className="mt-1 text-sm text-gray-600">
            Administrá usuarios con rol staff, sus datos, contraseña y estado.
          </p>
        </div>

        <button
          onClick={abrirNuevo}
          className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
        >
          Nuevo staff
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        {cargando ? (
          <div className="p-6 text-sm text-gray-600">Cargando staff...</div>
        ) : error ? (
          <div className="p-6 text-sm text-red-600">{error}</div>
        ) : staff.length === 0 ? (
          <div className="p-6 text-sm text-gray-600">No hay staff cargado.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-blue-600 text-left text-white">
                <tr>
                  <th className="px-4 py-3 font-semibold">Nombre</th>
                  <th className="px-4 py-3 font-semibold">Email</th>
                  <th className="px-4 py-3 font-semibold">Documento</th>
                  <th className="px-4 py-3 font-semibold">Estado</th>
                  <th className="px-4 py-3 font-semibold">Último login</th>
                  <th className="px-4 py-3 text-right font-semibold">Acciones</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {staff.map((usuario) => (
                  <tr
                    key={usuario.gym_usuario_id}
                    className="transition hover:bg-blue-50"
                  >
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {usuario.gym_persona_nombre} {usuario.gym_persona_apellido}
                    </td>

                    <td className="px-4 py-3 text-gray-700">
                      {usuario.gym_persona_email}
                    </td>

                    <td className="px-4 py-3 text-gray-700">
                      {usuario.gym_persona_documento}
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                          usuario.gym_usuario_activo
                            ? "bg-blue-100 text-blue-700"
                            : "bg-gray-200 text-gray-700"
                        }`}
                      >
                        {usuario.gym_usuario_activo ? "Activo" : "Inactivo"}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-gray-600">
                      {formatearFecha(usuario.gym_usuario_ultimo_login)}
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex flex-wrap justify-end gap-2">
                        <button
                          onClick={() => abrirEditar(usuario)}
                          className="rounded-lg border border-blue-200 px-3 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
                        >
                          Editar
                        </button>

                        <button
                          onClick={() => abrirPassword(usuario)}
                          className="rounded-lg border border-blue-200 px-3 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
                        >
                          Contraseña
                        </button>

                        <button
                          onClick={() => toggleEstado(usuario)}
                          className={`rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition ${
                            usuario.gym_usuario_activo
                              ? "bg-blue-500 hover:bg-blue-700"
                              : "bg-blue-600 hover:bg-blue-700"
                          }`}
                        >
                          {usuario.gym_usuario_activo ? "Desactivar" : "Activar"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <StaffFormModal
        abierto={modalFormAbierto}
        onClose={cerrarFormModal}
        onGuardar={guardarStaff}
        staffEditar={staffSeleccionado}
        cargando={guardando}
      />

      <StaffPasswordModal
        abierto={modalPasswordAbierto}
        onClose={cerrarPasswordModal}
        onGuardar={guardarPassword}
        staffSeleccionado={staffSeleccionado}
        cargando={guardando}
      />
    </div>
  );
}