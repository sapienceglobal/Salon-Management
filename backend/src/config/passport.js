import passport from 'passport';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import GoogleStrategy from 'passport-google-oauth20';
import { env } from './env.js';
import { db } from './database.js';
import { logger } from './logger.js';

/**
 * JWT Strategy — Extracts access token from Authorization: Bearer header.
 * Used by the authenticate middleware to verify logged-in users.
 */
const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: env.JWT_ACCESS_SECRET,
  algorithms: ['HS256'],
};

passport.use(
  'jwt',
  new JwtStrategy(jwtOptions, async (payload, done) => {
    try {
      const user = await db('users')
        .select('id', 'business_id', 'email', 'first_name', 'last_name', 'role', 'is_active')
        .where({ id: payload.sub, is_active: true })
        .first();

      if (!user) {
        return done(null, false, { message: 'User not found or inactive' });
      }

      // Check if password was changed after token was issued
      // if (user.password_changed_at) {
      //   const passwordChangedTimestamp = Math.floor(
      //     new Date(user.password_changed_at).getTime() / 1000
      //   );
      //   if (payload.iat < passwordChangedTimestamp) {
      //     return done(null, false, { message: 'Password changed. Please login again.' });
      //   }
      // }

      return done(null, user);
    } catch (error) {
      logger.error('JWT Strategy error:', error);
      return done(error, false);
    }
  })
);

/**
 * Google OAuth 2.0 Strategy.
 * Handles social login — creates or links user account on first login.
 */
passport.use(
  'google',
  new GoogleStrategy.Strategy(
    {
      clientID: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      callbackURL: env.GOOGLE_CALLBACK_URL,
      scope: ['profile', 'email'],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
        if (!email) {
          return done(null, false, { message: 'Google account has no email' });
        }

        // Check if user already exists by Google ID or email
        let user = await db('users')
          .select('*')
          .where({ google_id: profile.id })
          .orWhere({ email })
          .first();

        if (user) {
          // Update Google ID if not already set
          if (!user.google_id) {
            await db('users').where({ id: user.id }).update({
              google_id: profile.id,
              avatar_url: user.avatar_url || (profile.photos && profile.photos[0] ? profile.photos[0].value : null),
              updated_at: db.fn.now(),
            });
          }
          // Update last login
          await db('users').where({ id: user.id }).update({
            last_login_at: db.fn.now(),
          });
          return done(null, user);
        }

        // User doesn't exist — pass profile to controller for registration decision
        // We don't auto-create here; the controller decides business logic
        return done(null, false, {
          message: 'no_account',
          profile: {
            google_id: profile.id,
            email,
            first_name: profile.name ? profile.name.givenName : '',
            last_name: profile.name ? profile.name.familyName : '',
            avatar_url: profile.photos && profile.photos[0] ? profile.photos[0].value : null,
          },
        });
      } catch (error) {
        logger.error('Google Strategy error:', error);
        return done(error, false);
      }
    }
  )
);

export default passport;
