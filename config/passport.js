// config/passport.js

// Load all the strategies we need
const LocalStrategy = require('passport-local').Strategy;
const { Strategy: JwtStrategy, ExtractJwt } = require('passport-jwt');

// Load the user model
const User = require('../app/models/User');

// Load environment variables
require('dotenv').config();

// Expose this function to our app using module.exports
module.exports = function (passport) {
    // =========================================================================
    // Passport session setup ==================================================
    // =========================================================================
    // Required for persistent login sessions
    // Passport needs the ability to serialize and deserialize users out of session

    // Used to serialize the user for the session
    passport.serializeUser((user, done) => {
        done(null, user.id);
    });

    // Used to deserialize the user
    passport.deserializeUser(async (id, done) => {
        try {
            const user = await User.findById(id);
            done(null, user);
        } catch (err) {
            done(err, null);
        }
    });

    // =========================================================================
    // LOCAL SIGNUP ============================================================
    // =========================================================================
    // Using a named strategy for signup
    passport.use(
        'local-signup',
        new LocalStrategy(
            {
                usernameField: 'email', // Override with email instead of username
                passwordField: 'password',
                passReqToCallback: true, // Pass the entire request back to the callback
            },
            async (req, email, password, done) => {
                try {
                    // Check if a user already exists with the same email
                    const existingUser = await User.findOne({ email });
                    if (existingUser) {
                        return done(
                            null,
                            false,
                            req.flash('signupMessage', 'That email is already taken.')
                        );
                    }

                    // Create a new user
                    const newUser = new User({
                        username: req.body.username || email.split('@')[0], // Use username from form or default to email prefix
                        email,
                        password, // Password will be hashed by the model's pre-save middleware
                    });

                    await newUser.save();
                    return done(null, newUser);
                } catch (err) {
                    return done(err);
                }
            }
        )
    );

    // =========================================================================
    // LOCAL LOGIN =============================================================
    // =========================================================================
    // Using a named strategy for login
    passport.use(
        'local-login',
        new LocalStrategy(
            {
                usernameField: 'email', // Override with email instead of username
                passwordField: 'password',
                passReqToCallback: true, // Pass the entire request back to the callback
            },
            async (req, email, password, done) => {
                try {
                    // Find the user by email
                    const user = await User.findOne({ email });
                    if (!user) {
                        return done(
                            null,
                            false,
                            req.flash('loginMessage', 'No user found.')
                        );
                    }

                    // Validate the password
                    const isValidPassword = await user.comparePassword(password);
                    if (!isValidPassword) {
                        return done(
                            null,
                            false,
                            req.flash('loginMessage', 'Oops! Wrong password.')
                        );
                    }

                    // All is well, return the user
                    return done(null, user);
                } catch (err) {
                    return done(err);
                }
            }
        )
    );

    // =========================================================================
    // JWT STRATEGY ============================================================
    // =========================================================================
    // Using the JWT strategy for API authentication
    passport.use(
        new JwtStrategy(
            {
                jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), // Extract token from Authorization header
                secretOrKey: process.env.JWT_SECRET, // JWT secret from .env
            },
            async (jwtPayload, done) => {
                try {
                    // Find the user specified in the token
                    const user = await User.findById(jwtPayload.id);
                    if (user) {
                        return done(null, user);
                    } else {
                        return done(null, false); // No user found
                    }
                } catch (err) {
                    return done(err, false);
                }
            }
        )
    );
};
