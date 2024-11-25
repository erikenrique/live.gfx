module.exports = function (app, passport, db) {


  // normal routes ===============================================================

  // show the home page (will also have our login links)
  app.get('/', function (req, res) {
    res.render('index.ejs');
  });

  // LOGIN ===============================
  // show the login form
  app.get('/login', function (req, res) {
    res.render('login.ejs', { message: req.flash('loginMessage') });
  });

  // process the login form
  app.post('/login', passport.authenticate('local-login', {
    successRedirect: '/profile', // redirect to the secure profile section
    failureRedirect: '/login', // redirect back to the login page if there is an error
    failureFlash: true, // allow flash messages
  }));

  // SIGNUP ===============================
  // show the signup form
  app.get('/signup', function (req, res) {
    res.render('signup.ejs', { message: req.flash('signupMessage') });
  });

  // process the signup form
  app.post('/signup', passport.authenticate('local-signup', {
    successRedirect: '/profile', // redirect to the secure profile section
    failureRedirect: '/signup', // redirect back to the signup page if there is an error
    failureFlash: true, // allow flash messages
  }));

  // PROFILE SECTION =========================

  app.get('/profile', isLoggedIn, async (req, res) => {
    try {
      res.render('profile.ejs', {
        user: req.user
      });
    } catch (err) {
      console.error(err);
      res.status(500).send('Error fetching your profile page');
    }
  });


  // LOGOUT ==============================
  app.get('/logout', function (req, res) {
    req.logout(() => {
      console.log('User has logged out!');
    });
    res.redirect('/');
  });

  // middleware to ensure user is logged in
  function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) return next();
    res.redirect('/');
  }
};
