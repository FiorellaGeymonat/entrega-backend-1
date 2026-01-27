import { Router } from "express";
import { UserModel } from "../dao/models/user.model.js";
import { authJWT, authorizeRoles } from "../middlewares/auth.js";

const router = Router();

router.get("/", authJWT, authorizeRoles("admin"), async (req, res) => {
  const users = await UserModel.find().select("-password");
  res.json({ status: "success", payload: users });
});

router.get("/:uid", authJWT, authorizeRoles("admin"), async (req, res) => {
  const user = await UserModel.findById(req.params.uid).select("-password");
  if (!user) return res.status(404).json({ status: "error", error: "Not found" });
  res.json({ status: "success", payload: user });
});

router.put("/:uid", authJWT, authorizeRoles("admin"), async (req, res) => {
  if (req.body.password) delete req.body.password;
  const updated = await UserModel.findByIdAndUpdate(req.params.uid, req.body, { new: true }).select("-password");
  if (!updated) return res.status(404).json({ status: "error", error: "Not found" });
  res.json({ status: "success", payload: updated });
});

router.delete("/:uid", authJWT, authorizeRoles("admin"), async (req, res) => {
  const deleted = await UserModel.findByIdAndDelete(req.params.uid);
  if (!deleted) return res.status(404).json({ status: "error", error: "Not found" });
  res.json({ status: "success", message: "User deleted" });
});

export default router;
