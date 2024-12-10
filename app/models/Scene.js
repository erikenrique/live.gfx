const mongoose = require('mongoose');

const sceneSchema = new mongoose.Schema({
    name: { type: String, required: true, default: 'New Scene' },
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    elements: [
        { type: mongoose.Schema.Types.ObjectId, ref: 'Element' } // References to Element documents
    ],
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Scene', sceneSchema);