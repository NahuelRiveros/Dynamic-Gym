import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { getRecaudacionDiasDeMes } from "../../api/recaudacion_api"; 

export default function RecaudacionCalendarioDia() {
  const { anio, mes } = useParams();
  const nav = useNavigate();

  const year = Number(anio);
  const month = Number(mes);

  const [data, setData] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function cargar() {
      setCargando(true);
      setError(null);

      try {
        const r = await getRecaudacionDiasDeMes(year, month);

        if (!r?.ok) {
          setError(r?.mensaje || "No se pudo cargar recaudación diaria");
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

    if (Number.isFinite(year) && Number.isFinite(month)) {
      cargar();
    }
  }, [year, month]);

  const diasDelMes = useMemo(() => new Date(year, month, 0).getDate(), [year, month]);

  const mapaDias = useMemo(() => {
    const map = new Map();

    for (const it of data?.items || []) {
      const dia = Number(String(it.dia).slice(8, 10));
      map.set(dia, Number(it.total || 0));
    }

    return map;
  }, [data]);

  const totalMes = useMemo(() => {
    return Array.from(mapaDias.values()).reduce((acc, v) => acc + v, 0);
  }, [mapaDias]);

  const dias = useMemo(() => {
    return Array.from({ length: diasDelMes }, (_, i) => i + 1);
  }, [diasDelMes]);

  function mesLabel(m) {
    const meses = [
      "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
      "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
    ];
    return meses[m - 1] ?? "";
  }

  function nombreDiaSemana(dia) {
    const nombres = [
      "Domingo",
      "Lunes",
      "Martes",
      "Miércoles",
      "Jueves",
      "Viernes",
      "Sábado",
    ];

    const fecha = new Date(year, month - 1, dia);
    return nombres[fecha.getDay()];
  }

  function money(v) {
    return Number(v || 0).toLocaleString("es-AR", {
      style: "currency",
      currency: "ARS",
      maximumFractionDigits: 0,
    });
  }

  function moneyCompact(v) {
    return Number(v || 0).toLocaleString("es-AR", {
      notation: "compact",
      maximumFractionDigits: 1,
    });
  }

  function irMesAnterior() {
    const nuevaFecha = new Date(year, month - 2);
    nav(`/estadisticas/recaudaciones/${nuevaFecha.getFullYear()}/${nuevaFecha.getMonth() + 1}`);
  }

  function irMesSiguiente() {
    const nuevaFecha = new Date(year, month);
    nav(`/estadisticas/recaudaciones/${nuevaFecha.getFullYear()}/${nuevaFecha.getMonth() + 1}`);
  }

  function irDetalleDia(dia) {
    nav(`/estadisticas/recaudaciones/${year}/${month}/${dia}/detalle`);
  }

  return (
    <div className="min-h-screen bg-gray-50 px-3 py-4 sm:px-4 sm:py-6">
      <div className="mx-auto w-full max-w-6xl rounded-2xl border bg-white shadow-sm p-4 sm:p-6">
        <div className="mb-5 flex items-center justify-between gap-2 sm:gap-4">
          <button
            onClick={irMesAnterior}
            className="shrink-0 rounded-xl bg-gray-100 px-3 py-2 text-xs sm:text-sm font-semibold hover:bg-gray-200"
          >
            ← Anterior
          </button>

          <div className="min-w-0 text-center">
            <h1 className="text-lg sm:text-2xl font-extrabold leading-tight truncate">
              {mesLabel(month)} {year}
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-gray-500 truncate">
              Total: {money(totalMes)}
            </p>
          </div>

          <button
            onClick={irMesSiguiente}
            className="shrink-0 rounded-xl bg-gray-100 px-3 py-2 text-xs sm:text-sm font-semibold hover:bg-gray-200"
          >
            Siguiente →
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {cargando ? (
          <div className="text-sm text-gray-600">Cargando…</div>
        ) : (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {dias.map((dia) => {
              const total = mapaDias.get(dia) ?? 0;
              const tiene = total > 0;

              return (
                <button
                  type="button"
                  key={dia}
                  onClick={() => irDetalleDia(dia)}
                  className={[
                    "rounded-2xl border p-3 sm:p-4 min-h-[110px] sm:min-h-[130px] flex flex-col justify-between transition text-left cursor-pointer hover:shadow-md hover:-translate-y-[1px]",
                    tiene
                      ? "border-blue-300 bg-blue-50 shadow-sm"
                      : "border-gray-200 bg-white hover:bg-gray-50",
                  ].join(" ")}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs sm:text-sm font-semibold text-gray-500">
                      <span className="sm:hidden">
                        {nombreDiaSemana(dia).slice(0, 3)}
                      </span>
                      <span className="hidden sm:inline">
                        {nombreDiaSemana(dia)}
                      </span>
                    </span>

                    <span className="text-lg sm:text-2xl font-extrabold text-gray-900">
                      {dia}
                    </span>
                  </div>

                  <div className="mt-3">
                    {tiene ? (
                      <>
                        <p className="text-[11px] sm:text-xs font-medium text-blue-700">
                          Recaudado
                        </p>
                        <p className="mt-1 text-sm sm:text-base font-extrabold text-blue-800 leading-tight">
                          <span className="sm:hidden">{moneyCompact(total)}</span>
                          <span className="hidden sm:inline">{money(total)}</span>
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-[11px] sm:text-xs font-medium text-gray-400">
                          Sin movimiento
                        </p>
                        <p className="mt-1 text-sm sm:text-base font-bold text-gray-300">
                          —
                        </p>
                      </>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button
            onClick={() => nav("/estadisticas/recaudaciones-mensual")}
            className="rounded-2xl bg-black px-4 py-2.5 text-sm font-semibold text-white"
          >
            Volver a meses
          </button>
        </div>
      </div>
    </div>
  );
}