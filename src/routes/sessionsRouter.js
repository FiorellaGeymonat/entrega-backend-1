import { Router } from "express";
import passport from "passport";
import { UserModel } from "../dao/models/user.model.js";
import { cartModel } from "../dao/models/cartModel.js";
import { generateToken } from "../utils/jwt.js";
import { authJWT } from "../middlewares/auth.js";
import { UserCurrentDTO } from "../dtos/UserCurrentDTO.js";
import crypto from "crypto";
import { transporter } from "../utils/mailer.js";
import { isValidPassword, createHash } from "../utils/password.js";

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

// CURRENT (passport jwt + DTO)
router.get("/current", authJWT, (req, res) => {
  const safeUser = new UserCurrentDTO(req.user);
  return res.json({ status: "success", payload: safeUser });
});

// FORGOT PASSWORD -> manda mail con link (expira 1h)
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ status: "error", error: "Email required" });

    const user = await UserModel.findOne({ email });
    // por seguridad, no revelamos si existe o no
    if (!user) return res.json({ status: "success", message: "If the email exists, a reset link was sent" });

    const token = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = token;
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hora
    await user.save();

    const resetLink = `${process.env.BASE_URL}/reset-password?token=${token}`;

    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: user.email,
      subject: "Restablecer contraseña",
      html: `
        <div style="font-family: Arial, sans-serif;">
          <h2>Restablecer contraseña</h2>
          <p>Hacé click en el botón para restablecer tu contraseña. Este enlace expira en 1 hora.</p>
          <a href="${resetLink}"
             style="display:inline-block;padding:12px 18px;background:#111;color:#fff;text-decoration:none;border-radius:8px;">
             Restablecer contraseña
          </a>
          <p style="margin-top:12px;font-size:12px;color:#666;">Si no fuiste vos, ignorá este mail.</p>
        </div>
      `,
    });

    return res.json({ status: "success", message: "If the email exists, a reset link was sent" });
  } catch (error) {
    return res.status(500).json({ status: "error", error: error.message });
  }
});

// RESET PASSWORD
router.post("/reset-password", async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ status: "error", error: "Token and newPassword are required" });
    }

    const user = await UserModel.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() }, // no expirado
    });

    if (!user) {
      return res.status(400).json({ status: "error", error: "Invalid or expired token" });
    }

    // no permitir misma password
    const samePassword = isValidPassword(user, newPassword);
    if (samePassword) {
      return res.status(400).json({ status: "error", error: "New password must be different from the previous one" });
    }

    user.password = createHash(newPassword);
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    return res.json({ status: "success", message: "Password updated" });
  } catch (error) {
    return res.status(500).json({ status: "error", error: error.message });
  }
});

export default router;
