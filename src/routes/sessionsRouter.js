import { Router } from "express";
import passport from "passport";

import { UserModel } from "../dao/models/user.model.js";
import { cartModel } from "../dao/models/cartModel.js";
import { createHash } from "../utils/password.js";
import { generateToken } from "../utils/jwt.js";

const router = Router();

// REGISTER
router.post("/register", async (req, res) => {
  try {
    const { first_name, last_name, email, age, password } = req.body;

    if (!first_name || !last_name || !email || !age || !password) {
      return res.status(400).json({ status: "error", error: "Missing fields" });
    }

    const exists = await UserModel.findOne({ email });
    if (exists) return res.status(409).json({ status: "error", error: "User already exists" });

    const newCart = await cartModel.create({ products: [] });

    const user = await UserModel.create({
      first_name,
      last_name,
      email,
      age,
      password: createHash(password),
      cart: newCart._id,
      role: "user",
    });

    return res.status(201).json({
      status: "success",
      payload: { id: user._id, email: user.email },
    });
  } catch (err) {
    return res.status(500).json({ status: "error", error: err.message });
  }
});

// LOGIN (passport local)
router.post("/login", passport.authenticate("login", { session: false }), (req, res) => {
  const token = generateToken(req.user);

  res.cookie("token", token, { httpOnly: true });

  return res.json({
    status: "success",
    message: "Logged in",
    token,
  });
});

// CURRENT (passport jwt)
router.get("/current", passport.authenticate("jwt", { session: false }), (req, res) => {
  const u = req.user;
  return res.json({
    status: "success",
    payload: {
      first_name: u.first_name,
      last_name: u.last_name,
      email: u.email,
      age: u.age,
      cart: u.cart,
      role: u.role,
    },
  });
});

export default router;
