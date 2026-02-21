// config/oauthConfig.js
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { default: slugify } = require('slugify');
const User = require('@models/userModel');


// Serialize/Deserialize user
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});


// Google OAuth Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${process.env.APP_URL}/api/v1/oauth/google/callback`,
    passReqToCallback: true
  },
  async (req, accessToken, refreshToken, profile, done) => {
    try {
      // Find or create user
      let user = await User.findOne({ 
        $or: [
          { email: profile.emails[0].value },
          { oauthId: profile.id, oauthProvider: 'google' }
        ]
      });

      if (!user) {
        // Create new user
        user = await User.create({
          name: profile.displayName,
          email: profile.emails[0].value,
          oauthProvider: 'google',
          oauthId: profile.id,
          oauthAccessToken: accessToken,
          oauthRefreshToken: refreshToken,
          profileImage: profile.photos[0].value,
          emailVerified: true,
          slug: slugify( profile.displayName),
        });
      } else {
        // Update existing user
        user.oauthProvider = 'google';
        user.oauthId = profile.id;
        user.oauthAccessToken = accessToken;
        user.oauthRefreshToken = refreshToken;
        if (profile.photos[0]) user.profileImage = profile.photos[0].value;
        await user.save();
      }

      done(null, user);
    } catch (error) {
      done(error, null);
    }
  }
));


module.exports = passport;