import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt";

import { UserModel } from "../dao/models/user.model.js";
import { isValidPassword } from "../utils/password.js";
import { JWT_SECRET } from "../utils/jwt.js";

export const initializePassport = () => {
  passport.use(
    "login",
    new LocalStrategy(
      { usernameField: "email" },
      async (email, password, done) => {
        try {
          const user = await UserModel.findOne({ email });
          if (!user) return done(null, false);

          const ok = isValidPassword(user, password);
          if (!ok) return done(null, false);

          return done(null, user);
        } catch (err) {
          return done(err);
        }
      }
    )
  );

  passport.use(
    "jwt",
    new JwtStrategy(
      {
        jwtFromRequest: ExtractJwt.fromExtractors([
          ExtractJwt.fromAuthHeaderAsBearerToken(),
          (req) => req?.cookies?.token,
        ]),
        secretOrKey: JWT_SECRET,
      },
      async (payload, done) => {
        try {
          const user = await UserModel.findById(payload.id);
          if (!user) return done(null, false);
          return done(null, user);
        } catch (err) {
          return done(err, false);
        }
      }
    )
  );
};
