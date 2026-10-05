import { Router } from "express";
import {
  obtenerEmpresas,
  obtenerEmpresa,
  crearEmpresa,
  editarEmpresa,
  eliminarEmpresa
} from "../controllers/empresas.controller.js";

const router = Router();

router.get("/", obtenerEmpresas);
router.get("/:id", obtenerEmpresa);
router.post("/", crearEmpresa);
router.put("/:id", editarEmpresa);
router.delete("/:id", eliminarEmpresa);

export default router;
