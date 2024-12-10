const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const indexController = require('../controllers/indexController');

router.get('/', indexController.renderHome);

router.get('/signup', authController.renderSignup);
router.post('/signup', authController.signup);

router.get('/login', authController.renderLogin);
router.post('/login', authController.login);

module.exports = router;
