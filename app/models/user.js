const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true, 
        trim: true, 
    },
    email: {
        type: String,
        required: true,
        unique: true, 
        lowercase: true,
        trim: true, 
    },
    password: {
        type: String,
        required: true, 
    },
});

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next(); // Only hash if password is modified
    try {
        this.password = await bcrypt.hash(this.password, 10); // Hash with salt rounds = 10
        next();
    } catch (error) {
        next(error);
    }
});

// Compare passwords
userSchema.methods.comparePassword = function (password) {
    return bcrypt.compare(password, this.password); // Returns a promise
};

module.exports = mongoose.model('User', userSchema);
