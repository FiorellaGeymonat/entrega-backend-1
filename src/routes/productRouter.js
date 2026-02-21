import { Router } from "express";
import { uploader } from "../utils/multerUtil.js";
import { authJWT, authorizeRoles } from "../middlewares/auth.js";

import { productDBManager } from "../dao/productDBManager.js";
import { ProductRepository } from "../repositories/ProductRepository.js";

const router = Router();

const productDAO = new productDBManager();
const ProductRepo = new ProductRepository(productDAO);

// GET ALL (público)
router.get("/", async (req, res) => {
  const result = await ProductRepo.getAll(req.query);

  res.send({
    status: "success",
    payload: result,
  });
});

// GET BY ID (público)
router.get("/:pid", async (req, res) => {
  try {
    const result = await ProductRepo.getById(req.params.pid);
    res.send({
      status: "success",
      payload: result,
    });
  } catch (error) {
    res.status(400).send({
      status: "error",
      message: error.message,
    });
  }
});

// CREATE (solo admin)
router.post(
  "/",
  authJWT,
  authorizeRoles("admin"),
  uploader.array("thumbnails", 3),
  async (req, res) => {
    if (req.files) {
      req.body.thumbnails = [];
      req.files.forEach((file) => {
        req.body.thumbnails.push(file.path);
      });
    }

    try {
      const result = await ProductRepo.create(req.body);
      res.send({
        status: "success",
        payload: result,
      });
    } catch (error) {
      res.status(400).send({
        status: "error",
        message: error.message,
      });
    }
  }
);

// UPDATE (solo admin)
router.put(
  "/:pid",
  authJWT,
  authorizeRoles("admin"),
  uploader.array("thumbnails", 3),
  async (req, res) => {
    if (req.files) {
      req.body.thumbnails = [];
      req.files.forEach((file) => {
        req.body.thumbnails.push(file.filename);
      });
    }

    try {
      const result = await ProductRepo.update(req.params.pid, req.body);
      res.send({
        status: "success",
        payload: result,
      });
    } catch (error) {
      res.status(400).send({
        status: "error",
        message: error.message,
      });
    }
  }
);

// DELETE (solo admin)
router.delete("/:pid", authJWT, authorizeRoles("admin"), async (req, res) => {
  try {
    const result = await ProductRepo.delete(req.params.pid);
    res.send({
      status: "success",
      payload: result,
    });
  } catch (error) {
    res.status(400).send({
      status: "error",
      message: error.message,
    });
  }
});

export default router;