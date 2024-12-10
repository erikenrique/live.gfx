const Project = require('../models/Project');
const Scene = require('../models/Scene');

exports.renderProject = async (req, res) => {
    try {
        const project = await Project.findById(req.params.projectId);
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        const scenes = await Scene.find({ projectId: project._id });
        res.render('project', { project, scenes });
    } catch (error) {
        res.status(500).json({ error: 'Failed to load project' });
    }
};

exports.createProject = async (req, res) => {
    try {
        const project = new Project({
            name: 'New Project',
            userId: req.user._id,
        });
        await project.save();

        // default scene made on project create
        const scene = new Scene({
            name: 'Scene 1',
            projectId: project._id,
        });
        await scene.save();

        res.redirect(`/admin/project/${project._id}`);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.deleteProject = async (req, res) => {
};

exports.updateProjectName = async (req, res) => {
    try {
        const project = await Project.findById(req.params.projectId);

        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        if (!req.user || !project.userId || project.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        project.name = req.body.name;
        await project.save();

        res.status(200).json({ message: 'Project name updated' });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};
