import jwt from "jsonwebtoken";

export const JWT_SECRET = process.env.JWT_SECRET || "supersecret";

export const generateToken = (user) => {
  const payload = {
    id: user._id,
    email: user.email,
    role: user.role,
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });
};
