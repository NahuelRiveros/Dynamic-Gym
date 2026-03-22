import { useEffect, useState } from "react";
import PlanFormModal from "../../components/modal/plan_form_modal";
import {
  obtenerPlanes,
  crearPlan,
  actualizarPlan,
  cambiarEstadoPlan,
} from "../../api/planes_api.js";

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

function formatearPrecio(precio) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
  }).format(Number(precio || 0));
}

export default function PlanesPage() {
  const [planes, setPlanes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const [modalAbierto, setModalAbierto] = useState(false);
  const [planSeleccionado, setPlanSeleccionado] = useState(null);
  const [guardando, setGuardando] = useState(false);

  async function cargarPlanes() {
    try {
      setCargando(true);
      setError("");
      const resp = await obtenerPlanes();
      console.log(resp)
      setPlanes(resp.data || []);
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.mensaje || "No se pudieron cargar los planes");
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargarPlanes();
  }, []);

  function abrirNuevo() {
    setPlanSeleccionado(null);
    setModalAbierto(true);
  }

  function abrirEditar(plan) {
    setPlanSeleccionado(plan);
    setModalAbierto(true);
  }

  function cerrarModal() {
    setModalAbierto(false);
    setPlanSeleccionado(null);
  }

  async function guardarPlan(payload) {
    try {
      setGuardando(true);

      if (planSeleccionado) {
        await actualizarPlan(planSeleccionado.gym_cat_tipoplan_id, payload);
      } else {
        await crearPlan(payload);
      }

      cerrarModal();
      await cargarPlanes();
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.mensaje || "No se pudo guardar el plan");
    } finally {
      setGuardando(false);
    }
  }

  async function toggleEstado(plan) {
    const nuevoEstado = !plan.gym_cat_tipoplan_activo;
    const accion = nuevoEstado ? "activar" : "desactivar";

    const confirmar = window.confirm(
      `¿Seguro que querés ${accion} el plan "${plan.gym_cat_tipoplan_descripcion}"?`
    );

    if (!confirmar) return;

    try {
      await cambiarEstadoPlan(plan.gym_cat_tipoplan_id, nuevoEstado);
      await cargarPlanes();
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.mensaje || `No se pudo ${accion} el plan`);
    }
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-3 rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 to-white p-5 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Catálogo de planes</h1>
          <p className="mt-1 text-sm text-gray-600">
            Administrá descripción, duración, ingresos, precio y estado de cada plan.
          </p>
        </div>

        <button
          onClick={abrirNuevo}
          className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
        >
          Nuevo plan
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        {cargando ? (
          <div className="p-6 text-sm text-gray-600">Cargando planes...</div>
        ) : error ? (
          <div className="p-6 text-sm text-red-600">{error}</div>
        ) : planes.length === 0 ? (
          <div className="p-6 text-sm text-gray-600">No hay planes cargados.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-blue-600 text-left text-white">
                <tr>
                  <th className="px-4 py-3 font-semibold">Descripción</th>
                  <th className="px-4 py-3 font-semibold">Días</th>
                  <th className="px-4 py-3 font-semibold">Ingresos</th>
                  <th className="px-4 py-3 font-semibold">Precio</th>
                  <th className="px-4 py-3 font-semibold">Estado</th>
                  <th className="px-4 py-3 font-semibold">Fecha cambio</th>
                  <th className="px-4 py-3 text-right font-semibold">Acciones</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {planes.map((plan) => (
                  <tr
                    key={plan.gym_cat_tipoplan_id}
                    className="transition hover:bg-blue-50"
                  >
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {plan.gym_cat_tipoplan_descripcion}
                    </td>

                    <td className="px-4 py-3 text-gray-700">
                      {plan.gym_cat_tipoplan_dias_totales}
                    </td>

                    <td className="px-4 py-3 text-gray-700">
                      {plan.gym_cat_tipoplan_ingresos}
                    </td>

                    <td className="px-4 py-3 font-medium text-gray-900">
                      {formatearPrecio(plan.gym_cat_tipoplan_precio)}
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                          plan.gym_cat_tipoplan_activo
                            ? "bg-blue-100 text-blue-700"
                            : "bg-gray-200 text-gray-700"
                        }`}
                      >
                        {plan.gym_cat_tipoplan_activo ? "Activo" : "Inactivo"}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-gray-600">
                      {formatearFecha(plan.gym_cat_tipoplan_fechacambio)}
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => abrirEditar(plan)}
                          className="rounded-lg border border-blue-200 px-3 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
                        >
                          Editar
                        </button>

                        <button
                          onClick={() => toggleEstado(plan)}
                          className={`rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition ${
                            plan.gym_cat_tipoplan_activo
                              ? "bg-blue-500 hover:bg-blue-700"
                              : "bg-blue-600 hover:bg-blue-700"
                          }`}
                        >
                          {plan.gym_cat_tipoplan_activo ? "Desactivar" : "Activar"}
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

      <PlanFormModal
        abierto={modalAbierto}
        onClose={cerrarModal}
        onGuardar={guardarPlan}
        planEditar={planSeleccionado}
        cargando={guardando}
      />
    </div>
  );
}