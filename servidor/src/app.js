import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";
import routes from "./routes/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rutaFrontend = path.resolve(__dirname, "../../frontend/dist");

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(morgan("dev"));
  app.use(express.json());
  app.use(cookieParser());
  app.use(cors({ origin: true, credentials: true }));

  app.use("/api", routes);

  app.use(express.static(rutaFrontend));

  app.get("/*splat", (_req, res) => {
    res.sendFile(path.join(rutaFrontend, "index.html"));
  });

  app.use((err, _req, res, _next) => {
    if (err?.type === "entity.parse.failed") {
      return res.status(400).json({
        ok: false,
        codigo: "JSON_INVALIDO",
        mensaje: "Body JSON inválido",
      });
    }

    console.error(err);
    return res.status(500).json({
      ok: false,
      codigo: "ERROR",
      mensaje: "Error interno",
    });
  });

  return app;
}