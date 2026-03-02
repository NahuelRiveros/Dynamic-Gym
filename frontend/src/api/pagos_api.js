import { http } from "./http";

export async function registrarPago(payload) {
  const r = await http.post("/pagos/registrar", payload);
  return r.data;
}