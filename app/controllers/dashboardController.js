const Project = require('../models/Project');

exports.renderDashboard = async (req, res) => {
    try {
        const projects = await Project.find({ userId: req.user.id });
        res.render('dashboard', { title: 'Dashboard', projects });
    } catch (error) {
        res.json({ error: 'Failed to load dashboard' });
    }
};
