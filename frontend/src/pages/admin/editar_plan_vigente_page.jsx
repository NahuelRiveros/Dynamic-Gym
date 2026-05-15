import { useEffect, useMemo, useState } from "react";
import {
  buscarPlanVigente,
  actualizarPlanVigente,
} from "../../api/admin_alumnos_api";
import { getCatalogos } from "../../api/catalogos_api";
import ConfirmarActualizacionPlanModal from "../../components/modal/confirmar_plan_modal.jsx";
import {
  hoyISO,
  fechaAR,
  money,
  estadoBadge,
  validarFormularioPlan,
  mapearPlanAForm,
} from "../../components/utils/editar_plan_helpers.js";
import {
  ClipboardEdit, Search, BadgeCheck, Ban,
  CreditCard, CalendarDays, Zap, Banknote, Save,
} from "lucide-react";

function Label({ children }) {
  return <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">{children}</label>;
}

function Field({ label, children }) {
  return (
    <div>
      <Label>{label}</Label>
      {children}
    </div>
  );
}

export default function EditarPlanVigentePage() {
  const [documento, setDocumento]   = useState("");
  const [buscando, setBuscando]     = useState(false);
  const [guardando, setGuardando]   = useState(false);
  const [error, setError]           = useState("");
  const [mensaje, setMensaje]       = useState("");
  const [tiposPlan, setTiposPlan]   = useState([]);
  const [alumno, setAlumno]         = useState(null);
  const [planOriginal, setPlanOriginal]     = useState(null);
  const [mostrarModal, setMostrarModal]     = useState(false);

  const [form, setForm] = useState({
    tipo_plan_id: "",
    fecha_inicio: hoyISO(),
    fecha_fin: hoyISO(),
    ingresos_disponibles: "",
  });

  useEffect(() => {
    getCatalogos()
      .then((data) => setTiposPlan(data?.tiposPlan || []))
      .catch(() => {});
  }, []);

  function limpiarMensajes() { setError(""); setMensaje(""); }

  function limpiarResultado() {
    setAlumno(null);
    setPlanOriginal(null);
    setForm({ tipo_plan_id: "", fecha_inicio: hoyISO(), fecha_fin: hoyISO(), ingresos_disponibles: "" });
  }

  async function handleBuscar(e) {
    e.preventDefault();
    limpiarMensajes();
    limpiarResultado();
    const doc = String(documento).replace(/[.\s]/g, "").trim();
    if (!doc) { setError("Ingresá un DNI"); return; }
    try {
      setBuscando(true);
      const r = await buscarPlanVigente(doc);
      setAlumno(r.alumno || null);
      setPlanOriginal(r.plan || null);
      setForm(mapearPlanAForm(r.plan));
    } catch (e) {
      setError(e?.response?.data?.mensaje || "No se pudo buscar el plan vigente");
    } finally {
      setBuscando(false);
    }
  }

  async function refrescarBusqueda() {
    const doc = String(documento).replace(/[.\s]/g, "").trim();
    if (!doc) return;
    const r = await buscarPlanVigente(doc);
    setAlumno(r.alumno || null);
    setPlanOriginal(r.plan || null);
    setForm(mapearPlanAForm(r.plan));
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleGuardar(e) {
    e.preventDefault();
    limpiarMensajes();
    const err = validarFormularioPlan({ documento, form });
    if (err) { setError(err); return; }
    setMostrarModal(true);
  }

  async function confirmarGuardado() {
    try {
      setGuardando(true);
      limpiarMensajes();
      const doc = String(documento).replace(/[.\s]/g, "").trim();
      const payload = {
        documento: doc,
        tipo_plan_id: Number(form.tipo_plan_id),
        fecha_inicio: form.fecha_inicio,
        fecha_fin: form.fecha_fin,
        ingresos_disponibles: form.ingresos_disponibles === "" ? null : Number(form.ingresos_disponibles),
      };
      const r = await actualizarPlanVigente(payload);
      setMensaje(r?.mensaje || "Plan actualizado correctamente");
      setMostrarModal(false);
      await refrescarBusqueda();
    } catch (e) {
      setError(e?.response?.data?.mensaje || "No se pudo actualizar el plan");
      setMostrarModal(false);
    } finally {
      setGuardando(false);
    }
  }

  const tipoPlanSeleccionado = useMemo(
    () => tiposPlan.find((x) => Number(x.value) === Number(form.tipo_plan_id)),
    [tiposPlan, form.tipo_plan_id]
  );

  const badgeEstado = estadoBadge(alumno?.estado_desc);
  const activo = !String(alumno?.estado_desc || "").toLowerCase().match(/restring|bloq|inactiv/);

  const inputCls = "w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition";

  return (
    <div className="min-h-screen bg-slate-50 p-3 sm:p-6">
      <div className="mx-auto w-full max-w-4xl space-y-4">

        {/* ── ENCABEZADO ── */}
        <div className="overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-sm shadow-blue-500/10">
          <div className="h-1 w-full bg-linear-to-r from-blue-600 via-blue-500 to-cyan-400" />
          <div className="px-5 py-4">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-600 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white shadow-sm shadow-blue-500/30">
              <ClipboardEdit size={11} />
              Admin
            </span>
            <h1 className="mt-2 text-2xl font-extrabold text-slate-900">Editar plan vigente</h1>
            <p className="mt-0.5 text-sm text-slate-500">
              Buscá al alumno por DNI, revisá su estado actual y actualizá su plan.
            </p>
          </div>
        </div>

        {/* ── BÚSQUEDA ── */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-4 py-3">
            <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Buscar alumno por DNI</span>
          </div>
          <form onSubmit={handleBuscar} className="flex gap-3 p-4">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={documento}
                onChange={(e) => setDocumento(e.target.value)}
                placeholder="Ej: 40123456"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-4 text-sm text-slate-800 outline-none focus:border-blue-400 focus:bg-white focus:ring-1 focus:ring-blue-400 transition"
              />
            </div>
            <button
              type="submit" disabled={buscando}
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm shadow-blue-500/20 hover:bg-blue-500 transition disabled:opacity-50"
            >
              <Search size={13} />
              {buscando ? "Buscando…" : "Buscar"}
            </button>
          </form>
        </div>

        {/* ── MENSAJES ── */}
        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}
        {mensaje && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{mensaje}</div>
        )}

        {/* ── ALUMNO ENCONTRADO ── */}
        {alumno && (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-4 py-3">
              <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Alumno encontrado</span>
            </div>
            <div className="flex items-center gap-4 p-4">
              <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl text-lg font-extrabold text-white shadow-sm ${activo ? "bg-blue-600 shadow-blue-500/30" : "bg-slate-400"}`}>
                {((String(alumno.apellido || "")[0] || "") + (String(alumno.nombre || "")[0] || "")).toUpperCase() || "?"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-extrabold text-slate-900">{alumno.apellido} {alumno.nombre}</h2>
                  <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${badgeEstado.className}`}>
                    {activo ? <BadgeCheck size={10} /> : <Ban size={10} />}
                    {badgeEstado.texto}
                  </span>
                </div>
                <p className="mt-0.5 text-sm text-slate-500">
                  DNI: <span className="font-semibold text-slate-700">{alumno.documento}</span>
                  <span className="mx-2 text-slate-300">·</span>
                  ID: <span className="font-semibold text-slate-700">{alumno.alumno_id}</span>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── PLAN ACTUAL ── */}
        {planOriginal && (
          <>
            <div className="overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-sm">
              <div className="border-b border-slate-100 bg-blue-50/50 px-4 py-3">
                <span className="text-xs font-bold uppercase tracking-wide text-blue-600">Plan vigente actual</span>
              </div>
              <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 lg:grid-cols-6">
                <InfoTile icon={<CreditCard size={13} />}   label="Tipo de plan"    value={planOriginal.tipo_plan || "—"} />
                <InfoTile icon={<CalendarDays size={13} />} label="Inicio"          value={fechaAR(planOriginal.inicio)} />
                <InfoTile icon={<CalendarDays size={13} />} label="Fin"             value={fechaAR(planOriginal.fin)} />
                <InfoTile icon={<Zap size={13} />}          label="Ingresos disp."  value={planOriginal.ingresos_disponibles ?? "—"} />
                <InfoTile icon={<Banknote size={13} />}     label="Monto pagado"    value={money(planOriginal.monto_pagado)} />
                <InfoTile icon={<CreditCard size={13} />}   label="Método pago"     value={planOriginal.metodo_pago || "—"} />
              </div>
            </div>

            {/* ── FORMULARIO EDICIÓN ── */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-4 py-3">
                <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Modificar plan</span>
              </div>
              <form onSubmit={handleGuardar} className="p-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Tipo de plan">
                    <select
                      name="tipo_plan_id"
                      value={form.tipo_plan_id}
                      onChange={handleChange}
                      className={inputCls}
                    >
                      <option value="">Seleccionar tipo…</option>
                      {tiposPlan.map((plan) => (
                        <option key={plan.value} value={plan.value}>{plan.label}</option>
                      ))}
                    </select>
                    {tipoPlanSeleccionado && (
                      <p className="mt-1.5 text-[11px] text-blue-600 font-semibold">✓ {tipoPlanSeleccionado.label}</p>
                    )}
                  </Field>

                  <Field label="Ingresos disponibles">
                    <input
                      type="number" min="0"
                      name="ingresos_disponibles"
                      value={form.ingresos_disponibles}
                      onChange={handleChange}
                      className={inputCls}
                    />
                  </Field>

                  <Field label="Fecha inicio">
                    <input
                      type="date"
                      name="fecha_inicio"
                      value={form.fecha_inicio}
                      onChange={handleChange}
                      className={inputCls}
                    />
                  </Field>

                  <Field label="Fecha fin">
                    <input
                      type="date"
                      name="fecha_fin"
                      value={form.fecha_fin}
                      onChange={handleChange}
                      className={inputCls}
                    />
                  </Field>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    type="submit"
                    disabled={guardando || !alumno || !planOriginal}
                    className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-bold text-white shadow-sm shadow-blue-500/20 hover:bg-blue-500 transition disabled:opacity-50"
                  >
                    <Save size={14} />
                    {guardando ? "Guardando…" : "Guardar cambios"}
                  </button>
                </div>
              </form>
            </div>
          </>
        )}

      </div>

      <ConfirmarActualizacionPlanModal
        abierto={mostrarModal}
        alumno={alumno}
        form={form}
        tipoPlanSeleccionado={tipoPlanSeleccionado}
        guardando={guardando}
        onCancelar={() => setMostrarModal(false)}
        onConfirmar={confirmarGuardado}
      />
    </div>
  );
}

function InfoTile({ icon, label, value }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5">
      <div className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-slate-400">
        {icon}{label}
      </div>
      <p className="mt-1 text-sm font-semibold text-slate-800 leading-tight">{value}</p>
    </div>
  );
}
