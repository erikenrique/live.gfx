const mongoose = require('mongoose');

const elementSchema = new mongoose.Schema({
    type: { 
        type: String, 
        required: true, // text, image, ticker, etc
    },
    content: { 
        type: String, 
        default: '',
    },
    theme: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Theme',
    },
    position: {
        x: { type: Number, default: 0 }, // x-coordinate
        y: { type: Number, default: 0 }, // y-coordinate
        rotate: { type: Number, default: 0 }, // in degrees
        location: { // grid style
            type: String,
            enum: [
                'top-left', 'top-center', 'top-right',
                'middle-left', 'middle-center', 'middle-right',
                'bottom-left', 'bottom-center', 'bottom-right',
            ],
            default: 'middle-center',
        },
        scale: { type: Number, default: 100 }, // percentage
    },
    state: { 
        type: String, 
        enum: ['off', 'on', 'preview on', 'preview off'], 
        default: 'off', 
    },
    order: { // z-index order
        type: Number, 
        default: 0, 
    },
    sceneId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Scene', 
        required: true,
    },
    createdAt: { 
        type: Date, 
        default: Date.now, 
    },
});

module.exports = mongoose.model('Element', elementSchema);
