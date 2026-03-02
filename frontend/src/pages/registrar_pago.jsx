import { useEffect, useState } from "react";
import { registrarPago } from "../../api/pagos_api";
import { Search, CreditCard, RefreshCw, CheckCircle2, XCircle } from "lucide-react";
import { getCatalogoTipoPlanes } from "../../api/catalogos_api"; // si no existe, abajo te dejo fallback

export default function RegistrarPagoPage() {
  const [documento, setDocumento] = useState("");
  const [tipoPlanId, setTipoPlanId] = useState("");
  const [montoPagado, setMontoPagado] = useState("");
  const [metodoPago, setMetodoPago] = useState("efectivo");

  const [planes, setPlanes] = useState([]);
  const [cargandoPlanes, setCargandoPlanes] = useState(false);

  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);
  const [okMsg, setOkMsg] = useState(null);
  const [resultado, setResultado] = useState(null);

  async function cargarPlanes() {
    setCargandoPlanes(true);
    try {
      // ✅ Ideal: endpoint de catálogo
      const r = await getCatalogoTipoPlanes();
      if (r?.ok) setPlanes(r.items || []);
      else setPlanes([]);
    } catch {
      setPlanes([]);
    } finally {
      setCargandoPlanes(false);
    }
  }

  useEffect(() => {
    cargarPlanes();
  }, []);

  function limpiarMensajes() {
    setError(null);
    setOkMsg(null);
  }

  async function onSubmit(e) {
    e.preventDefault();
    limpiarMensajes();
    setResultado(null);

    const doc = documento.replace(/[.\s]/g, "").trim();
    if (!doc || !/^\d+$/.test(doc)) {
      setError("DNI inválido (solo números)");
      return;
    }
    if (!tipoPlanId) {
      setError("Seleccioná un plan");
      return;
    }
    const monto = Number(montoPagado);
    if (!Number.isFinite(monto) || monto <= 0) {
      setError("Monto inválido");
      return;
    }
    if (!metodoPago?.trim()) {
      setError("Método de pago obligatorio");
      return;
    }

    setCargando(true);
    try {
      const r = await registrarPago({
        documento: doc,
        tipo_plan_id: Number(tipoPlanId),
        monto_pagado: monto,
        metodo_pago: metodoPago.trim(),
      });

      if (!r?.ok) {
        setError(r?.mensaje || "No se pudo registrar el pago");
        return;
      }

      setOkMsg(r.mensaje || "Pago registrado");
      setResultado(r);

      // opcional: limpiar monto para siguiente
      // setMontoPagado("");
    } catch (e2) {
      setError(e2?.response?.data?.mensaje || e2?.message || "Error inesperado");
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto w-full max-w-4xl">
        <div className="rounded-3xl border bg-white shadow-sm p-5 md:p-6">
          {/* Header */}
          <div className="flex flex-col gap-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-green-600/10 px-4 py-1 text-sm font-semibold text-green-700 w-fit">
              <CreditCard size={16} />
              Pagos
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold">Registrar pago</h1>
            <p className="text-sm text-gray-600">
              Registrá un pago y generá el plan en <code className="px-1 rounded bg-gray-100">gym_fecha_disponible</code>.
            </p>
          </div>

          {/* Mensajes */}
          {error && (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 flex items-start gap-2">
              <XCircle size={18} className="mt-0.5" />
              <div>{error}</div>
            </div>
          )}
          {okMsg && (
            <div className="mt-4 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-700 flex items-start gap-2">
              <CheckCircle2 size={18} className="mt-0.5" />
              <div>{okMsg}</div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={onSubmit} className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="DNI">
              <div className="flex items-center gap-2 rounded-2xl border px-3 py-2">
                <Search size={18} className="text-gray-500" />
                <input
                  value={documento}
                  onChange={(e) => setDocumento(e.target.value)}
                  placeholder="Ej: 35123456"
                  className="w-full outline-none"
                  inputMode="numeric"
                />
              </div>
            </Field>

            <Field label="Plan">
              <div className="flex gap-2">
                <select
                  value={tipoPlanId}
                  onChange={(e) => setTipoPlanId(e.target.value)}
                  className="w-full rounded-2xl border px-3 py-2"
                >
                  <option value="">Seleccionar plan...</option>
                  {planes.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.descripcion}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={cargarPlanes}
                  disabled={cargandoPlanes}
                  className="rounded-2xl border px-4 py-2 font-semibold disabled:opacity-50"
                  title="Recargar planes"
                >
                  <RefreshCw size={16} className={cargandoPlanes ? "animate-spin" : ""} />
                </button>
              </div>

              {!planes.length && (
                <p className="mt-2 text-xs text-gray-500">
                  No hay planes cargados (revisar endpoint de catálogo).
                </p>
              )}
            </Field>

            <Field label="Monto pagado (ARS)">
              <input
                value={montoPagado}
                onChange={(e) => setMontoPagado(e.target.value)}
                placeholder="Ej: 15000"
                className="w-full rounded-2xl border px-3 py-2 outline-none"
                inputMode="decimal"
              />
            </Field>

            <Field label="Método de pago">
              <select
                value={metodoPago}
                onChange={(e) => setMetodoPago(e.target.value)}
                className="w-full rounded-2xl border px-3 py-2"
              >
                <option value="efectivo">Efectivo</option>
                <option value="transferencia">Transferencia</option>
                <option value="debito">Débito</option>
                <option value="credito">Crédito</option>
                <option value="mercadopago">MercadoPago</option>
              </select>
            </Field>

            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={cargando}
                className="w-full rounded-2xl bg-black text-white px-4 py-3 font-extrabold disabled:opacity-50"
              >
                {cargando ? "Registrando..." : "Registrar pago"}
              </button>
            </div>
          </form>

          {/* Resultado */}
          {resultado?.ok && (
            <div className="mt-6 rounded-3xl border bg-white p-5">
              <h2 className="text-lg font-extrabold">Detalle</h2>

              <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
                <MiniStat label="Alumno" value={`${resultado.alumno.apellido} ${resultado.alumno.nombre}`} />
                <MiniStat label="DNI" value={String(resultado.alumno.documento)} />
                <MiniStat label="Estado" value="Habilitado" />
              </div>

              <div className="mt-4 rounded-2xl border p-4">
                <div className="text-sm font-semibold">Plan generado</div>
                <div className="mt-2 text-sm text-gray-700">
                  <div><b>Plan:</b> {resultado.plan.tipo_plan_descripcion}</div>
                  <div><b>Inicio:</b> {resultado.plan.inicio}</div>
                  <div><b>Fin:</b> {resultado.plan.fin}</div>
                  <div><b>Ingresos disponibles:</b> {resultado.plan.ingresos_disponibles}</div>
                  <div><b>Monto:</b> {money(resultado.pago.monto_pagado)}</div>
                  <div><b>Método:</b> {resultado.pago.metodo_pago}</div>
                </div>
              </div>

              {resultado.info?.tenia_plan_vigente && (
                <p className="mt-3 text-xs text-gray-500">
                  Nota: el alumno ya tenía un plan vigente. Este pago se programó desde el día siguiente al fin del plan vigente.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      {children}
    </div>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="rounded-2xl border bg-white p-4">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="mt-1 text-lg font-extrabold">{value}</div>
    </div>
  );
}

function money(v) {
  const n = Number(v || 0);
  return n.toLocaleString("es-AR", { style: "currency", currency: "ARS" });
}