import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Menu,
  X,
  ChevronDown,
  Home,
  LogIn,
  UserPlus,
  CreditCard,
  BarChart3,
  Settings,
  LogOut,
} from "lucide-react";
import { navbar_config } from "./navbar_config.js";

function normalizarRol(valor) {
  return String(valor || "").trim().toLowerCase();
}

function tieneRol(usuario, rolesPermitidos) {
  if (!rolesPermitidos || rolesPermitidos.length === 0) return true;
  if (!usuario) return false;

  const rolesNormalizados = rolesPermitidos.map(normalizarRol);

  const candidatos = [
    usuario?.tipoDesc,
    usuario?.rol,
    usuario?.role,
    usuario?.tipo,
    ...(Array.isArray(usuario?.roles) ? usuario.roles : []),
  ]
    .filter(Boolean)
    .map(normalizarRol);

  return candidatos.some((rol) => rolesNormalizados.includes(rol));
}

function iconoPorLink(label, to) {
  const texto = `${label} ${to}`.toLowerCase();

  if (texto.includes("home")) return <Home className="h-4 w-4" />;
  if (texto.includes("login")) return <LogIn className="h-4 w-4" />;
  if (texto.includes("registro")) return <UserPlus className="h-4 w-4" />;
  if (texto.includes("pago")) return <CreditCard className="h-4 w-4" />;
  if (texto.includes("estad")) return <BarChart3 className="h-4 w-4" />;
  if (texto.includes("plan") || texto.includes("personal")) {
    return <Settings className="h-4 w-4" />;
  }

  return null;
}

export default function Navbar({ usuario = null, onLogout }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const cfg = navbar_config;
  const t = cfg.theme;
  const l = cfg.layout;
  const labels = cfg.labels;

  const [menuAbierto, setMenuAbierto] = useState(false);
  const [dropdownAbierto, setDropdownAbierto] = useState({});

  function cerrarTodo() {
    setMenuAbierto(false);
    setDropdownAbierto({});
  }

  function toggleDropdown(id) {
    setDropdownAbierto((prev) => {
      const estabaAbierto = !!prev[id];
      return estabaAbierto ? {} : { [id]: true };
    });
  }

  function cerrarDropdown(id) {
    setDropdownAbierto((prev) => ({ ...prev, [id]: false }));
  }

  async function handleLogout() {
    cerrarTodo();
    await onLogout?.();
    navigate("/login", { replace: true });
  }

  function linkClass(to) {
    const activo = pathname === to;
    const base =
      "inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap";

    if (activo) {
      return `${base} ${t.linkActive.bg} ${t.linkActive.text} shadow-sm`;
    }

    return `${base} ${t.link.text} ${t.link.hoverBg} ${t.link.hoverText || ""}`;
  }

  const linksVisibles = useMemo(() => {
    return (cfg.links || []).filter((x) => {
      if (x.requiereAuth && !usuario) return false;
      if (x.ocultarSiAuth && usuario) return false;
      if (!tieneRol(usuario, x.roles)) return false;
      return true;
    });
  }, [cfg.links, usuario]);

  const dropdownsVisibles = useMemo(() => {
    return (cfg.dropdowns || [])
      .map((dd) => {
        const itemsVisibles = (dd.items || []).filter((it) => {
          if (it.requiereAuth && !usuario) return false;
          if (it.ocultarSiAuth && usuario) return false;
          if (!tieneRol(usuario, it.roles)) return false;
          return true;
        });
        return { ...dd, itemsVisibles };
      })
      .filter((dd) => dd.itemsVisibles.length > 0);
  }, [cfg.dropdowns, usuario]);

  return (
    <header
      className={`sticky top-0 relative z-[1000] backdrop-blur supports-[backdrop-filter]:bg-[#0B0F1A]/95 ${t.navbar.bg} ${t.navbar.border}`}
    >
      <div className={`${l.container} ${cfg.layout.altoBarra}`}>
        <div className="flex items-center justify-between gap-3">
          <Link
            to={cfg.brand.linkTo || "/"}
            className="flex items-center gap-3 shrink-0 min-w-0"
            onClick={cerrarTodo}
          >
            {cfg.brand.logoUrl ? (
              <img
                src={cfg.brand.logoUrl}
                alt="Logo Dynamic"
                className="h-10 w-10 rounded-full object-cover ring-1 ring-cyan-400/20 shadow-md shadow-cyan-500/10 shrink-0"
              />
            ) : (
              <div
                className={`h-10 w-10 rounded-full flex items-center justify-center font-bold ring-1 ring-cyan-400/20 shrink-0 ${t.brand.fallbackBg} ${t.brand.fallbackText}`}
              >
                {cfg.brand.fallbackLetter || cfg.brand.titulo?.[0] || "D"}
              </div>
            )}

            <div className="leading-tight min-w-0">
              {cfg.brand.mostrarTitulo !== false && (
                <div
                  className={`font-semibold text-lg tracking-tight truncate ${t.brand.titleText}`}
                >
                  {cfg.brand.titulo || "Dynamic"}
                </div>
              )}

              {cfg.brand.mostrarSubtitulo && cfg.brand.subtitulo && (
                <div
                  className={`text-[11px] uppercase tracking-[0.18em] truncate ${t.brand.subtitleText}`}
                >
                  {cfg.brand.subtitulo}
                </div>
              )}
            </div>
          </Link>

          {/* Desktop / Tablet grande */}
          <nav className={`hidden xl:flex items-center ${l.gapLinks} relative z-[1001]`}>
            {linksVisibles.map((x) => (
              <Link
                key={x.to}
                to={x.to}
                className={linkClass(x.to)}
                onClick={cerrarTodo}
              >
                {iconoPorLink(x.label, x.to)}
                <span>{x.label}</span>
              </Link>
            ))}

            {dropdownsVisibles.map((dd) => {
              const labelDropdown = usuario
                ? dd.labelAuth || dd.label
                : dd.labelNoAuth || dd.label;

              return (
                <div key={dd.id} className="relative">
                  <button
                    type="button"
                    onClick={() => toggleDropdown(dd.id)}
                    aria-label={labels?.dropdownAbrir || "Abrir menú"}
                    className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap ${t.dropdownButton.text} ${t.dropdownButton.bg || ""} ${t.dropdownButton.border || ""} ${t.dropdownButton.hoverBg}`}
                  >
                    {dd.id === "admin" ? (
                      <BarChart3 className="h-4 w-4" />
                    ) : (
                      <Settings className="h-4 w-4" />
                    )}
                    <span>{labelDropdown}</span>
                    <ChevronDown
                      className={`h-4 w-4 transition-transform duration-200 ${
                        dropdownAbierto[dd.id] ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {dropdownAbierto[dd.id] && (
                    <div className="absolute right-0 mt-3 z-[1100] pointer-events-auto w-60 overflow-hidden rounded-2xl border border-cyan-400/20 bg-[#0f172a]/98 shadow-2xl shadow-black/30 backdrop-blur-xl">
                      <div className="p-2">
                        {dd.itemsVisibles.map((it) => (
                          <Link
                            key={it.to}
                            to={it.to}
                            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-100 transition-colors duration-150 hover:bg-cyan-400/10 hover:text-cyan-300"
                            onClick={() => {
                              cerrarDropdown(dd.id);
                              setMenuAbierto(false);
                            }}
                          >
                            {iconoPorLink(it.label, it.to)}
                            <span>{it.label}</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {usuario && (
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-red-400 transition-colors duration-200 hover:bg-red-500/10 whitespace-nowrap"
              >
                <LogOut className="h-4 w-4" />
                <span>{labels?.botonSalir || "Logout"}</span>
              </button>
            )}
          </nav>

          {/* Mobile / Tablet */}
          <button
            type="button"
            className={`xl:hidden inline-flex items-center justify-center p-2.5 rounded-xl ${t.hamburger.border} ${t.hamburger.bg} ${t.hamburger.text} ${t.hamburger.hoverBg} transition-colors shrink-0`}
            onClick={() => setMenuAbierto((v) => !v)}
            aria-label={labels?.menuAbrir || "Abrir menú"}
          >
            {menuAbierto ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {menuAbierto && (
          <div className="xl:hidden mt-3 rounded-2xl border border-cyan-400/20 bg-[#111827]/95 backdrop-blur-xl shadow-xl shadow-black/20 overflow-hidden">
            <div className="p-2">
              {linksVisibles.map((x) => (
                <Link
                  key={x.to}
                  to={x.to}
                  className={`flex items-center gap-3 ${linkClass(x.to)}`}
                  onClick={cerrarTodo}
                >
                  {iconoPorLink(x.label, x.to)}
                  <span>{x.label}</span>
                </Link>
              ))}

              {dropdownsVisibles.map((dd) => {
                const labelDropdown = usuario
                  ? dd.labelAuth || dd.label
                  : dd.labelNoAuth || dd.label;

                return (
                  <div key={dd.id} className="mt-2 border-t border-cyan-400/15 pt-2">
                    <div className="flex items-center gap-2 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-300/80">
                      {dd.id === "admin" ? (
                        <BarChart3 className="h-4 w-4" />
                      ) : (
                        <Settings className="h-4 w-4" />
                      )}
                      <span>{labelDropdown}</span>
                    </div>

                    {dd.itemsVisibles.map((it) => (
                      <Link
                        key={it.to}
                        to={it.to}
                        className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-100 transition-colors hover:bg-cyan-400/10 hover:text-cyan-300"
                        onClick={cerrarTodo}
                      >
                        {iconoPorLink(it.label, it.to)}
                        <span>{it.label}</span>
                      </Link>
                    ))}
                  </div>
                );
              })}

              {usuario && (
                <div className="mt-2 border-t border-cyan-400/15 pt-2">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/10"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>{labels?.botonSalir || "Logout"}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}