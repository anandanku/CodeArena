import express from "express";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import dotenv from "dotenv";
import { User } from "./userschema.js";

dotenv.config();

const router = express.Router();

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id).lean();
    done(null, user || null);
  } catch (error) {
    done(error, null);
  }
});

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL:
        process.env.GOOGLE_CALLBACK_URL ||
        "http://localhost:3000/auth/google/callback",
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const userData = {
          GoogleId: profile.id,
          displayname: profile.displayName,
          email: profile.emails?.[0]?.value || null,
          avatar: profile.photos?.[0]?.value || null,
          lastLoginAt: new Date(),
        };

        const user = await User.findOneAndUpdate(
          { GoogleId: profile.id },
          { $set: userData },
          {
            new: true,
            upsert: true,
            setDefaultsOnInsert: true,
          }
        );

        done(null, user);
      } catch (error) {
        done(error, null);
      }
    }
  )
);
router.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    failureRedirect: process.env.LOGIN_FAIL_REDIRECT || "/login",
    session: true,
  }),
  (req, res) => {
    res.redirect(process.env.LOGIN_SUCCESS_REDIRECT || "/dashboard");
  }
);

router.post("/auth/logout", (req, res, next) => {
  req.logout((error) => {
    if (error) return next(error);
    req.session.destroy(() => {
      res.clearCookie("connect.sid");
      res.status(200).json({ ok: true });
    });
  });
});

router.get("/auth/me", (req, res) => {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(401).json({ authenticated: false, user: null });
  }
  return res.status(200).json({ authenticated: true, user: req.user });
});

export default router;




