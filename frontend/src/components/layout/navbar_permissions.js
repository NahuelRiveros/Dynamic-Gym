function normalizarRol(valor) {
  return String(valor || "").trim().toLowerCase();
}

function getRolUsuario(usuario) {
  return normalizarRol(
    usuario?.rol_nombre || usuario?.rol || usuario?.role || usuario?.tipoDesc || usuario?.tipo || ""
  );
}

function puedeVerItem(item, usuario) {
  const estaAutenticado = Boolean(usuario);
  if (item.ocultarSiAuth && estaAutenticado) return false;
  if (item.requiereAuth && !estaAutenticado) return false;
  if (!item.roles || item.roles.length === 0) return true;
  const rol = getRolUsuario(usuario);
  return item.roles.map((r) => r.toLowerCase()).includes(rol);
}

export function filtrarNavbarPorRol(config, usuario) {
  const links = (config.links ?? []).filter((link) => puedeVerItem(link, usuario));

  const dropdowns = (config.dropdowns ?? [])
    .map((dropdown) => {
      const label = usuario
        ? (dropdown.labelAuth ?? dropdown.label ?? dropdown.labelNoAuth ?? "")
        : (dropdown.labelNoAuth ?? dropdown.label ?? dropdown.labelAuth ?? "");
      return {
        ...dropdown,
        label,
        items: (dropdown.items ?? []).filter((item) => puedeVerItem(item, usuario)),
      };
    })
    .filter((dropdown) => dropdown.items.length > 0);

  return { ...config, links, dropdowns };
}
