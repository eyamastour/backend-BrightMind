const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
    firstname: String,
    lastname: String,
    username: String,
    email: String,
    password: String,
    company: String,
    Tel: Number,
    language: {
        type: String,
        enum: ['francais', 'anglais', 'italien'],  
    },
    role: {
        type: String,
        enum: ['user', 'admin'], 
        default: 'user'
    },
    // Array of installation IDs that the user has access to
    installationPermissions: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Installation'
    }],
    resetToken: {  
        type: String,
        default: null  
    },
    resetTokenExpiration: { 
        type: Date,
        default: null  
    },
    blocked: {
        type: Boolean,
        default: false
    },
    isVerified: { 
        type: Boolean,
        default: false  
    },
    verificationToken: { 
        type: String,
        default: null  
    },
    verificationTokenExpiration: { 
        type: Date,
        default: null  
    }
});
const User = mongoose.model('User', UserSchema)
module.exports = User;
