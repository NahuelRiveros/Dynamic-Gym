import { useEffect, useMemo, useState } from "react";
import { getHeatmapAsistencias } from "../../api/estadisticas_api";
import { Calendar, Flame, RefreshCw } from "lucide-react";

function isoMesActual() {
  const hoy = new Date();
  const desde = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
    .toISOString()
    .slice(0, 10);
  const hasta = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0)
    .toISOString()
    .slice(0, 10);
  return { desde, hasta };
}

export default function HeatmapAsistenciasPage() {
  const def = useMemo(() => isoMesActual(), []);
  const [desde, setDesde] = useState(def.desde);
  const [hasta, setHasta] = useState(def.hasta);

  const [data, setData] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  async function cargar() {
    setCargando(true);
    setError(null);
    try {
      const r = await getHeatmapAsistencias({ desde, hasta });
      if (!r?.ok) {
        setError(r?.mensaje || "No se pudo cargar el heatmap");
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
  }, []);

  // matriz 7 x 24
  const { dias, matriz, max } = useMemo(() => {
    const dias = data?.dias || ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
    const matriz = Array.from({ length: 7 }, () => Array.from({ length: 24 }, () => 0));

    for (const it of data?.items || []) {
      const d = Number(it.dow);
      const h = Number(it.hora);
      const c = Number(it.cantidad || 0);
      if (d >= 0 && d <= 6 && h >= 0 && h <= 23) {
        matriz[d][h] = c;
      }
    }

    let max = 0;
    for (let d = 0; d < 7; d++) for (let h = 0; h < 24; h++) max = Math.max(max, matriz[d][h]);
    return { dias, matriz, max };
  }, [data]);

  const picoTexto = useMemo(() => {
    const p = data?.pico;
    if (!p) return "—";
    const dia = (data?.dias || [])[p.dow] ?? `DOW ${p.dow}`;
    return `${dia} ${String(p.hora).padStart(2, "0")}:00 → ${p.cantidad}`;
  }, [data]);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto w-full max-w-6xl">
        <div className="rounded-3xl border bg-white shadow-sm p-5 md:p-6">
          {/* Header */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-orange-600/10 px-4 py-1 text-sm font-semibold text-orange-700">
                <Flame size={16} />
                Frecuencia de ingresos por hora
              </div>
              <h1 className="mt-3 text-2xl md:text-3xl font-extrabold">
                
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Intensidad = cantidad de ingresos. Rango: {desde} → {hasta}.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="flex items-center gap-2 rounded-2xl border px-3 py-2">
                <Calendar size={18} className="text-gray-600" />
                <input
                  type="date"
                  value={desde}
                  onChange={(e) => setDesde(e.target.value)}
                  className="outline-none"
                />
                <span className="text-gray-400">—</span>
                <input
                  type="date"
                  value={hasta}
                  onChange={(e) => setHasta(e.target.value)}
                  className="outline-none"
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
            <StatCard label="Máximo (celda)" value={String(max)} />
            <StatCard label="Hora pico (global)" value={picoTexto} />
            <StatCard label="Total celdas con datos" value={String((data?.items || []).length)} />
          </div>

          {/* Heatmap */}
          <div className="mt-6 overflow-x-auto">
            <div className="min-w-[980px]">
              {/* header horas */}
              <div className="grid" style={{ gridTemplateColumns: "140px repeat(24, 1fr)" }}>
                <div className="text-xs text-gray-500 px-2 py-2">Día / Hora</div>
                {Array.from({ length: 24 }, (_, h) => (
                  <div key={h} className="text-[10px] text-gray-500 text-center py-2">
                    {String(h).padStart(2, "0")}
                  </div>
                ))}
              </div>

              {/* filas días */}
              <div className="space-y-2">
                {Array.from({ length: 7 }, (_, d) => (
                  <div
                    key={d}
                    className="grid items-center gap-1"
                    style={{ gridTemplateColumns: "140px repeat(24, 1fr)" }}
                  >
                    <div className="text-sm font-semibold text-gray-700 px-2">
                      {dias[d]}
                    </div>

                    {Array.from({ length: 24 }, (_, h) => {
                      const val = matriz[d]?.[h] ?? 0;
                      const alpha = max > 0 ? (val / max) : 0; // 0..1
                      // Verde con alpha (sin depender de clases dinámicas de Tailwind)
                      const bg = `rgba(34, 197, 94, ${Math.max(0.08, alpha)})`; // mínimo visible
                      const borde = val > 0 ? "rgba(34,197,94,0.35)" : "rgba(0,0,0,0.08)";

                      return (
                        <div
                          key={h}
                          title={`${dias[d]} ${String(h).padStart(2, "0")}:00 → ${val}`}
                          className="h-9 rounded-lg border flex items-center justify-center text-xs font-semibold"
                          style={{
                            background: val > 0 ? bg : "rgba(0,0,0,0.03)",
                            borderColor: borde,
                            color: val > 0 ? "rgba(0,0,0,0.75)" : "rgba(0,0,0,0.35)",
                          }}
                        >
                          {val > 0 ? val : ""}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>

              {/* leyenda */}
              <div className="mt-5 flex items-center gap-3 text-xs text-gray-600">
                <span>Leyenda:</span>
                <Swatch label="Bajo" alpha={0.15} />
                <Swatch label="Medio" alpha={0.45} />
                <Swatch label="Alto" alpha={0.85} />
                <span className="ml-auto text-gray-500">
                  Tip: pasá el mouse por una celda para ver el detalle.
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

/* UI */
function StatCard({ label, value }) {
  return (
    <div className="rounded-2xl border bg-white p-4">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="mt-1 text-lg font-extrabold">{value}</div>
    </div>
  );
}

function Swatch({ label, alpha }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="h-4 w-8 rounded border"
        style={{
          background: `rgba(34,197,94,${alpha})`,
          borderColor: "rgba(34,197,94,0.35)",
        }}
      />
      <span>{label}</span>
    </div>
  );
}