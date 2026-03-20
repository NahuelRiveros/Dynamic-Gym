//index.js
import { Router } from "express";
import { personasRouter } from "./personas_router.js";
import { ingresoRouter} from "./ingreso_router.js";
import { pagosRouter} from "./pagos_router.js";
import { listaAlumnosRouter} from "./lista_alumnos_router.js";
import { estadisticasRouter} from "./estadisticas_router.js";
import { authRouter } from "./auth_routes.js";
import { adminUsuariosRouter } from "./admin_usuarios_router.js";
import { catalogosRouter } from "./catalogos_routers.js";
import { adminAlumnosRouter } from "./admin_alumnos_router.js";
import { planesRouter } from "./planes_router.js";
import { staffRouter } from "./staffs_router.js";

const router = Router();

router.use("/catalogos", catalogosRouter);
router.use("/admin/usuarios", adminUsuariosRouter);
router.use("/alumnos", listaAlumnosRouter);
router.use("/personas", personasRouter);
router.use("/ingresos",ingresoRouter);
router.use("/pagos",pagosRouter);
router.use("/estadisticas",estadisticasRouter);
router.use("/auth", authRouter);
router.use("/admin/alumnos", adminAlumnosRouter);
router.use("/planes", planesRouter);
router.use("/staff", staffRouter);



export default router;
