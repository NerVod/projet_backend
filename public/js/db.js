const Mongoose = require('mongoose');
require('dotenv').config()
const url = process.env.DB;

Mongoose.connect(url, { useNewUrlParser: true});

const UserSchema = new Mongoose.Schema({
    email: {
        type: String,
        unique: true,
        required: true,
        lowercase: true,
        trim: true
    },
    gamertag: {
        type: String,
        unique: true,
        required: true,
        lowercase: true,
        
    },
    password: {
        type: String,
        required: true,
    }
}, { collection: 'players'})

exports.User = Mongoose.model('User', UserSchema)