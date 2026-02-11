import passport from "passport";
import GooleStratergy from "passport-google-oauth20";
import User from "../models/user.model.js";
import dotenv from "dotenv";
dotenv.config();

passport.use(
  new GooleStratergy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/auth/google/callback",
    },

    async (accessToken, refreshToken, profile, done) => {
      try {
        let existingUser = await User.findOne({ googleId: profile.id });
        if (existingUser) {
          return done(null, existingUser);
        }

        const email = profile.emails?.[0]?.value;

        existingUser = await User.findOne({ email });

        if (existingUser) {
          existingUser.googleId = profile.id;
          existingUser.isVerified = true;
          await existingUser.save();

          return done(null, existingUser);
        }

        const newUser = await User.create({
          name: profile.displayName,
          email,
          googleId: profile.id,
          isVerified: true,
        });
        return done(null, newUser);
      } catch (err) {
        return done(err, null);
      }
    },
  ),
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  const user = await User.findById(id);
  done(null, user);
});

export default passport;
