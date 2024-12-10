const Element = require('../models/Element');
const Scene = require('../models/Scene');
const mongoose = require('mongoose');


exports.createElement = async (req, res) => {
    try {
        const { sceneId } = req.params;
        const { type, content } = req.body;

        const scene = await Scene.findById(sceneId).populate('elements');
        if (!scene) {
            return res.status(404).json({ error: 'Scene not found' });
        }

        // calculate the next order number (number of elements + 1)
        const nextOrder = scene.elements.length + 1;

        const newElement = new Element({
            sceneId, // Explicitly set the sceneId
            type,
            content,
            order: nextOrder,
        });
        console.log(newElement);

        await newElement.save();

        // Add the new element to the scene's elements array
        scene.elements.push(newElement._id);
        await scene.save();

        // Emit a socket event for the new element
        req.io.emit('elementAdded', newElement);

        res.json({ message: 'Element created', element: newElement });
    } catch (error) {
        console.error('Error creating element:', error);
        res.status(500).json({ error: 'Error creating element' });
    }
};

exports.getElement = async (req, res) => {
    try {
        const { id } = req.params;

        const element = await Element.findById(id);
        if (!element) {
            return res.status(404).json({ error: 'Element not found' });
        }

        res.json({ message: 'Element fetched successfully', element });
    } catch (error) {
        console.error('Error fetching element:', error);
        res.json({ error: 'Error fetching element' });
    }
};


exports.updateElement = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        const element = await Element.findById(id);

        if (!element) {
            return res.status(404).json({ error: 'Element not found' });
        }

        Object.assign(element, updates);
        const updatedElement = await element.save();

        res.json({ message: 'Element updated successfully', element: updatedElement });
        req.io.emit('elementUpdated', updatedElement);
    } catch (error) {
        console.error('Error updating element:', error);
        res.json({ error: 'Error updating element' });
    }
};


exports.deleteElement = async (req, res) => {
    try {
        const { id } = req.params;

        const deletedElement = await Element.findByIdAndDelete(id);
        if (!deletedElement) {
            return res.status(404).json({ error: 'Element not found' });
        }

        await Scene.findByIdAndUpdate(deletedElement.sceneId, {
            $pull: { elements: deletedElement._id },
        });

        res.json({ message: 'Element deleted successfully' });
        req.io.emit('elementDeleted', { id });
    } catch (error) {
        console.error('Error deleting element:', error);
        res.json({ error: 'error deleting element' });
    }
};

exports.cuePreviewState = async (req, res) => {
    try {
        const { id } = req.params;

        const element = await Element.findById(id);
        if (!element) {
            return res.status(404).json({ error: 'Element not found' });
        }
        console.log("before: ", element)

        // Toggle the preview state
        if (element.state === 'off') {
            element.state = 'preview on'
        } else if (element.state === 'on') {
            element.state = 'preview off'
        } else if (element.state === 'preview on') {
            element.state = 'off'
        } else if (element.state === 'preview off') {
            element.state = 'on'
        }
        await element.save();

        console.log("after: ", element)

        // Emit socket event to update clients
        req.io.emit('elementPreviewStateChanged', { id, state: element.state });
        console.log('Emitting elementPreviewStateChanged:', { id, state: element.state });

        res.json({ message: 'Preview state toggled', element });
    } catch (error) {
        console.error('Error toggling preview state:', error);
        res.json({ error: 'Error toggling preview state' });
    }
};

exports.runPreview = async (req, res) => {
    try {
        const { sceneId } = req.params;

        const scene = await Scene.findById(sceneId).populate('elements');
        if (!scene) {
            return res.status(404).json({ error: 'Scene not found' });
        }

        // Update elements with preview states
        const updates = scene.elements.map(async (element) => {
            if (element.state === 'preview-on') {
                element.state = 'on';
            } else if (element.state === 'on') {
                element.state = 'off';
            }
            return element.save();
        });

        await Promise.all(updates);

        // Emit socket event to refresh all clients
        req.io.emit('previewRunExecuted', { sceneId });

        res.json({ message: 'Preview states applied' });
    } catch (error) {
        console.error('Error running preview:', error);
        res.json({ error: 'Error running preview' });
    }
};


exports.reorderElement = async (req, res) => {
    const session = await mongoose.startSession();

    try {
        session.startTransaction();

        const { id } = req.params; // Element ID
        const { newOrder } = req.body; // Target order
        const element = await Element.findById(id).session(session);

        if (!element) {
            return res.status(404).json({ error: 'Element not found' });
        }

        const sceneId = element.scene; // Scene ID
        const elements = await Element.find({ scene: sceneId }).session(session);

        if (!elements || elements.length === 0) {
            return res.status(404).json({ error: 'No elements found for this scene' });
        }

        const currentOrder = element.order;

        // Adjust orders for other elements
        if (newOrder > currentOrder) {
            // Moving element down
            await Element.updateMany(
                { scene: sceneId, order: { $gt: currentOrder, $lte: newOrder } },
                { $inc: { order: -1 } },
                { session }
            );
        } else if (newOrder < currentOrder) {
            // Moving element up
            await Element.updateMany(
                { scene: sceneId, order: { $gte: newOrder, $lt: currentOrder } },
                { $inc: { order: 1 } },
                { session }
            );
        }

        // Update the order of the current element
        element.order = newOrder;
        await element.save({ session });

        // Commit the transaction
        await session.commitTransaction();
        session.endSession();

        // Emit updated elements
        const updatedElements = await Element.find({ scene: sceneId }).sort('order');
        req.io.emit('elementsReordered', { elements: updatedElements });

        res.json({ message: 'Element reordered successfully', elements: updatedElements });
    } catch (error) {
        console.error('Error reordering element:', error);

        // Rollback the transaction
        await session.abortTransaction();
        session.endSession();

        res.status(500).json({ error: 'Error reordering element' });
    }
};





