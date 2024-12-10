const passport = require('passport');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.renderLogin = (req, res) => {
    res.render('login', { message: req.flash('loginMessage') || '' });
};

exports.login = (req, res, next) => {
    passport.authenticate('local-login', (err, user, info) => {
        if (err) return next(err);
        if (!user) {
            req.flash('loginMessage', 'Invalid email or password.');
            return res.redirect('/login');
        }
        req.logIn(user, (err) => {
            if (err) return next(err);

            // // if JWT is ideal... for websocket use
            // const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
            // res.cookie('jwt', token, { httpOnly: true });

            res.redirect('/admin/dashboard');
        });
    })(req, res, next);
};

exports.ensureAuthenticated = (req, res, next) => {
    console.log('User in ensureAuthenticated:', req.user);
    console.log('Session data:', req.session)
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/login'); 
};

exports.renderSignup = (req, res) => {
    res.render('signup', { message: req.flash('signupMessage') || '' });
};

exports.signup = (req, res, next) => {
    passport.authenticate('local-signup', (err, user, info) => {
        if (err) return next(err);
        if (!user) {
            req.flash('signupMessage', 'Signup failed. Try again.');
            return res.redirect('/signup');
        }
        req.login(user, (err) => {
            if (err) return next(err);

            // if JWT is ideal... for websocket use
            const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
            res.cookie('jwt', token, { httpOnly: true });

            res.redirect('/admin/dashboard');
        });
    })(req, res, next);
};

