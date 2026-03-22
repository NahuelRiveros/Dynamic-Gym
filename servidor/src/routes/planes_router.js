import { Router } from "express";
import {
  listarPlanesController,
  obtenerPlanPorIdController,
  crearPlanController,
  actualizarPlanController,
  cambiarEstadoPlanController,
} from "../controllers/planes_controllers.js";
import { requireAuth , requireRole } from "../middleware/auth_middleware.js";

export const planesRouter = Router();

planesRouter.use(requireAuth,requireRole("admin"));
planesRouter.get("/", listarPlanesController);
planesRouter.get("/:id", obtenerPlanPorIdController);
planesRouter.post("/", crearPlanController);
planesRouter.put("/:id", actualizarPlanController);
planesRouter.patch("/:id/estado", cambiarEstadoPlanController);