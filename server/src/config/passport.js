import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as GitHubStrategy } from 'passport-github2';
import User from '../models/User.js';

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL || `${FRONTEND_URL}/auth/google/callback`,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const filter = { provider: 'google', providerId: profile.id };
          const update = {
            provider: 'google',
            providerId: profile.id,
            name: profile.displayName,
            email: profile.emails && profile.emails[0] && profile.emails[0].value,
            avatar: profile.photos && profile.photos[0] && profile.photos[0].value,
            raw: profile._json,
          };
          const user = await User.findOneAndUpdate(filter, update, { new: true, upsert: true });
          done(null, user);
        } catch (err) {
          done(err);
        }
      }
    )
  );
}

if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  passport.use(
    new GitHubStrategy(
      {
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL: process.env.GITHUB_CALLBACK_URL || `${FRONTEND_URL}/auth/github/callback`,
        scope: ['user:email'],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email =
            (profile.emails && profile.emails[0] && profile.emails[0].value) ||
            (profile._json && profile._json.email) ||
            null;
          const filter = { provider: 'github', providerId: profile.id };
          const update = {
            provider: 'github',
            providerId: profile.id,
            name: profile.displayName || profile.username,
            email,
            avatar: profile.photos && profile.photos[0] && profile.photos[0].value,
            raw: profile._json,
          };
          const user = await User.findOneAndUpdate(filter, update, { new: true, upsert: true });
          done(null, user);
        } catch (err) {
          done(err);
        }
      }
    )
  );
}

export default passport;
