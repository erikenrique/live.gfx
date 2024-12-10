const Scene = require('../models/Scene');
const Project = require('../models/Project');
const Element = require('../models/Element');

exports.renderScene = async (req, res) => {
    try {
        const scene = await Scene.findById(req.params.sceneId);
        if (!scene) {
            return res.status(404).json({ error: 'Scene not found' });
        }

        const project = await Project.findById(req.params.projectId);
        if (!project || project.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        res.render('scene', { scene, project });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to load scene' });
    }
};

exports.createScene = async (req, res) => {
    try {
        const project = await Project.findById(req.params.projectId);
        if (!project || project.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        const scene = new Scene({
            projectId: req.params.projectId,
            name: req.body.name || 'New Scene',
        });

        await scene.save();
        res.status(201).json({ message: 'Scene created successfully', scene });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create scene' });
    }
};

exports.deleteScene = async (req, res) => {
    try {
        const scene = await Scene.findByIdAndDelete(req.params.sceneId);
        if (!scene) {
            return res.status(404).json({ error: 'Scene not found' });
        }
        res.status(200).json({ message: 'Scene deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete scene' });
    }
};

exports.updateSceneName = async (req, res) => {
    try {
        const scene = await Scene.findById(req.params.sceneId);

        if (!scene) {
            return res.status(404).json({ error: 'Scene not found' });
        }

        const project = await Project.findById(scene.projectId);
        if (!project || project.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        scene.name = req.body.name;
        await scene.save();

        res.status(200).json({ message: 'Scene name updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update scene name' });
    }
};

exports.renderControlRoom = async (req, res) => {
    try {
        const scene = await Scene.findById(req.params.sceneId).populate('elements');
        if (!scene) {
            return res.status(404).json({ error: 'Scene not found' });
        }
        res.render('controlRoom', { title: 'Control Room', scene });
    } catch (error) {
        res.status(500).json({ error: 'Failed to load Control Room' });
    }
};

exports.renderPreview = async (req, res) => {
    try {
        const elements = await Element.find({
            sceneId: req.params.sceneId,
            state: { $in: ['preview on', 'on'] },
        });
        res.render('preview', { title: 'Preview', elements });
    } catch (error) {
        res.status(500).json({ error: 'Failed to load Preview' });
    }
};

exports.renderOutput = async (req, res) => {
    try {
        const elements = await Element.find({
            sceneId: req.params.sceneId,
            state: 'on',
        });
        res.render('output', { title: 'Output', elements });
    } catch (error) {
        res.status(500).json({ error: 'Failed to load Output' });
    }
};
