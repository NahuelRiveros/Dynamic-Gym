import { useEffect, useMemo, useState } from "react";
import { getVencimientos } from "../../api/estadisticas_api";
import { CalendarClock, RefreshCw, AlertTriangle } from "lucide-react";

function fmtFecha(iso) {
  if (!iso) return "—";
  // iso puede venir con hora; recortamos YYYY-MM-DD
  const s = String(iso).slice(0, 10);
  const [y, m, d] = s.split("-");
  return `${d}/${m}/${y}`;
}

function diasEntre(hoyISO, finISO) {
  if (!finISO) return null;
  const h = new Date(hoyISO);
  const f = new Date(String(finISO).slice(0, 10));
  const diff = Math.ceil((f - h) / (1000 * 60 * 60 * 24));
  return Number.isFinite(diff) ? diff : null;
}

export default function VencimientosPage() {
  const [dias, setDias] = useState(7);
  const [data, setData] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  const hoyISO = useMemo(() => new Date().toISOString().slice(0, 10), []);

  async function cargar() {
    setCargando(true);
    setError(null);
    try {
      const r = await getVencimientos({ dias });
      if (!r?.ok) {
        setError(r?.mensaje || "No se pudo cargar vencimientos");
        setData(null);
        return;
      }
      setData(r);
    } catch (e) {
      setError(e?.response?.data?.mensaje || e?.message || "Error inesperado");
      setData(null);
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dias]);

  const items = data?.items || [];
  const total = Number(data?.total || 0);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto w-full max-w-6xl">
        <div className="rounded-3xl border bg-white shadow-sm p-5 md:p-6">
          {/* Header */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 px-4 py-1 text-sm font-semibold text-amber-700">
                <CalendarClock size={16} />
                Estadísticas
              </div>
              <h1 className="mt-3 text-2xl md:text-3xl font-extrabold">
                Vencimientos próximos
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Planes que vencen entre hoy y los próximos {dias} días.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="flex items-center gap-2 rounded-2xl border px-3 py-2">
                <span className="text-sm text-gray-600">Días</span>
                <input
                  type="number"
                  value={dias}
                  min={1}
                  max={60}
                  onChange={(e) => setDias(Number(e.target.value || 7))}
                  className="w-20 outline-none"
                />
              </div>

              <button
                type="button"
                onClick={cargar}
                disabled={cargando}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-black text-white px-4 py-2 font-semibold disabled:opacity-50"
              >
                <RefreshCw size={16} className={cargando ? "animate-spin" : ""} />
                {cargando ? "Cargando..." : "Actualizar"}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Resumen */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-3">
            <StatCard label="Rango" value={`Hoy → +${dias} días`} />
            <StatCard label="Total vencimientos" value={String(total)} />
            <StatCard label="Fecha de hoy" value={fmtFecha(hoyISO)} />
          </div>

          {/* Lista */}
          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500">
                  <th className="py-2 pr-3">Alumno</th>
                  <th className="py-2 pr-3">DNI</th>
                  <th className="py-2 pr-3">Plan</th>
                  <th className="py-2 pr-3">Inicio</th>
                  <th className="py-2 pr-3">Fin</th>
                  <th className="py-2 pr-3">Ingresos</th>
                  <th className="py-2 pr-3">Días</th>
                </tr>
              </thead>
              <tbody>
                {cargando ? (
                  <tr>
                    <td className="py-4 text-gray-600" colSpan={7}>
                      Cargando…
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td className="py-4 text-gray-600" colSpan={7}>
                      No hay vencimientos en este rango.
                    </td>
                  </tr>
                ) : (
                  items.map((it, idx) => {
                    const diasRest = diasEntre(hoyISO, it.fin);
                    const urgente = diasRest != null && diasRest <= 4;

                    return (
                      <tr key={`${it.alumno_id}-${it.fecha_id}-${idx}`} className="border-t">
                        <td className="py-3 pr-3 font-semibold">
                          {it.nombre} {it.apellido}
                        </td>
                        <td className="py-3 pr-3">{it.documento}</td>
                        <td className="py-3 pr-3">{it.plan ?? "—"}</td>
                        <td className="py-3 pr-3">{fmtFecha(it.inicio)}</td>
                        <td className="py-3 pr-3">
                          <span className={urgente ? "text-red-700 font-bold" : ""}>
                            {fmtFecha(it.fin)}
                          </span>
                        </td>
                        <td className="py-3 pr-3">{it.ingresos_disponibles ?? "—"}</td>
                        <td className="py-3 pr-3">
                          {urgente ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-red-50 text-red-700 px-2 py-1 text-xs font-bold">
                              <AlertTriangle size={14} />
                              {diasRest} días
                            </span>
                          ) : (
                            <span className="text-gray-700">{diasRest ?? "—"}</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <p className="mt-4 text-xs text-gray-500">
            * “Días” = diferencia entre hoy y la fecha fin. Marcamos urgente si ≤ 2 días.
          </p>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-2xl border bg-white p-4">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="mt-1 text-lg font-extrabold">{value}</div>
    </div>
  );
}