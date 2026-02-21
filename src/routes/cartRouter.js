import { Router } from "express";
import mongoose from "mongoose";
import { productDBManager } from "../dao/productDBManager.js";
import { cartDBManager } from "../dao/cartDBManager.js";
import { authJWT, authorizeRoles } from "../middlewares/auth.js";
import { cartModel } from "../dao/models/cartModel.js";

const router = Router();
const ProductService = new productDBManager();
const CartService = new cartDBManager(ProductService);

//  middleware ownership
const canAccessCart = async (req, res, next) => {
  try {
    const { cid } = req.params;

    if (!mongoose.Types.ObjectId.isValid(cid)) {
      return res.status(400).json({ status: "error", error: "Invalid cart id" });
    }

    const cart = await cartModel.findById(cid);
    if (!cart) {
      return res.status(404).json({ status: "error", error: "Cart not found" });
    }

    // admin bypass
    if (req.user?.role === "admin") return next();

    // user must be owner
    if (String(cart.owner) !== String(req.user._id)) {
      return res.status(403).json({ status: "error", error: "Forbidden" });
    }

    next();
  } catch (error) {
    return res.status(500).json({ status: "error", error: "Internal server error" });
  }
};

//  VER CARRITO
router.get("/:cid", authJWT, authorizeRoles("user", "admin"), canAccessCart, async (req, res) => {
  try {
    const result = await CartService.getProductsFromCartByID(req.params.cid);
    return res.json({ status: "success", payload: result });
  } catch (error) {
    return res.status(500).json({ status: "error", message: error.message });
  }
});

//  CREAR CARRITO (guardar owner)
router.post("/", authJWT, authorizeRoles("user"), async (req, res) => {
  try {
    const result = await CartService.createCart(req.user._id);
    return res.json({ status: "success", payload: result });
  } catch (error) {
    return res.status(500).json({ status: "error", message: error.message });
  }
});

//  AGREGAR PRODUCTO (protegido por ownership)
router.post("/:cid/product/:pid", authJWT, authorizeRoles("user"), canAccessCart, async (req, res) => {
  try {
    const result = await CartService.addProductByID(req.params.cid, req.params.pid);
    return res.json({ status: "success", payload: result });
  } catch (error) {
    return res.status(500).json({ status: "error", message: error.message });
  }
});

//  BORRAR PRODUCTO (protegido)
router.delete("/:cid/product/:pid", authJWT, authorizeRoles("user"), canAccessCart, async (req, res) => {
  try {
    const result = await CartService.deleteProductByID(req.params.cid, req.params.pid);
    return res.json({ status: "success", payload: result });
  } catch (error) {
    return res.status(500).json({ status: "error", message: error.message });
  }
});

//  ACTUALIZAR TODOS LOS PRODUCTOS (protegido)
router.put("/:cid", authJWT, authorizeRoles("user"), canAccessCart, async (req, res) => {
  try {
    const result = await CartService.updateAllProducts(req.params.cid, req.body.products);
    return res.json({ status: "success", payload: result });
  } catch (error) {
    return res.status(500).json({ status: "error", message: error.message });
  }
});

// ACTUALIZAR CANTIDAD (protegido)
router.put("/:cid/product/:pid", authJWT, authorizeRoles("user"), canAccessCart, async (req, res) => {
  try {
    const result = await CartService.updateProductByID(req.params.cid, req.params.pid, req.body.quantity);
    return res.json({ status: "success", payload: result });
  } catch (error) {
    return res.status(500).json({ status: "error", message: error.message });
  }
});

//  VACIAR CARRITO (protegido)
router.delete("/:cid", authJWT, authorizeRoles("user"), canAccessCart, async (req, res) => {
  try {
    const result = await CartService.deleteAllProducts(req.params.cid);
    return res.json({ status: "success", payload: result });
  } catch (error) {
    return res.status(500).json({ status: "error", message: error.message });
  }
});

//  PURCHASE (protegido)
router.post("/:cid/purchase", authJWT, authorizeRoles("user"), canAccessCart, async (req, res) => {
  try {
    const { cid } = req.params;

    const result = await CartService.purchaseCart(cid, req.user.email);

    return res.json({
      status: "success",
      payload: result,
    });
  } catch (error) {
    // mapeo de errores controlados del manager
    if (error?.code === "CART_NOT_FOUND") {
      return res.status(404).json({ status: "error", error: "Cart not found" });
    }

    if (error?.code === "INSUFFICIENT_STOCK") {
      return res.status(409).json({
        status: "error",
        error: error.message,
        payload: error.payload ?? [],
      });
    }

    return res.status(500).json({ status: "error", error: error.message });
  }
});

export default router;