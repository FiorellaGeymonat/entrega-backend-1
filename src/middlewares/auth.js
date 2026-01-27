import passport from "passport";

export const authJWT = passport.authenticate("jwt", { session: false });

export const authorizeRoles = (...roles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ status: "error", error: "Unauthorized" });

  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ status: "error", error: "Forbidden" });
  }

  next();
};
