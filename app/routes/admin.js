const express = require('express');
const router = express.Router();
const passport = require('passport');

const dashboardController = require('../controllers/dashboardController');
const projectController = require('../controllers/projectController');
const sceneController = require('../controllers/sceneController');
const authController = require('../controllers/authController');
const elementController = require('../controllers/elementController');

const bypassAuth = (req, res, next) => {
    req.user = { _id: 'fakeUserId123', username: 'testUser123' }; // getting past localServer auth needs
    console.log('Bypassing authentication, mocked user:', req.user);
    next();
};

// Dashboard
router.get('/dashboard', authController.ensureAuthenticated, dashboardController.renderDashboard);

// Project 
router.get('/project/:projectId', authController.ensureAuthenticated, projectController.renderProject);
router.post('/project', authController.ensureAuthenticated, projectController.createProject);
router.put('/project/:projectId', authController.ensureAuthenticated, projectController.updateProjectName);
router.delete('/project/:projectId', authController.ensureAuthenticated, projectController.deleteProject);

// Scene 
router.get('/project/:projectId/scene/:sceneId', authController.ensureAuthenticated, sceneController.renderScene);
router.post('/project/:projectId/scene', authController.ensureAuthenticated, sceneController.createScene);
router.put('/project/:projectId/scene/:sceneId', authController.ensureAuthenticated, sceneController.updateSceneName);
router.delete('/project/:projectId/scene/:sceneId', authController.ensureAuthenticated, sceneController.deleteScene);

// Scene output, preview, control room
router.get('/project/:projectId/scene/:sceneId/control', authController.ensureAuthenticated, sceneController.renderControlRoom);
router.get('/project/:projectId/scene/:sceneId/preview', authController.ensureAuthenticated, sceneController.renderPreview);
router.get('/project/:projectId/scene/:sceneId/output', authController.ensureAuthenticated, sceneController.renderOutput);

// Elements
router.get('/project/:projectId/scene/:sceneId/elements/:id', bypassAuth, elementController.getElement);
router.post('/project/:projectId/scene/:sceneId/elements', bypassAuth, elementController.createElement);
router.put('/project/:projectId/scene/:sceneId/elements/:id', bypassAuth, elementController.updateElement);
router.delete('/project/:projectId/scene/:sceneId/elements/:id', bypassAuth, elementController.deleteElement);

// Preview and State Management
router.post('/project/:projectId/scene/:sceneId/elements/:id/preview-cue', bypassAuth, elementController.cuePreviewState);
router.post('/project/:projectId/scene/:sceneId/elements/run-preview', bypassAuth, elementController.runPreview);
router.put('/project/:projectId/scene/:sceneId/elements/:id/reorder', bypassAuth, elementController.reorderElement);
router.put('/project/:projectId/scene/:sceneId/elements/:id/reorder/:direction', bypassAuth, elementController.reorderElement);





module.exports = router;