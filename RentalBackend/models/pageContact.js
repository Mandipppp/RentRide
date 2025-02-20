const mongoose = require('mongoose');

const pagecontactSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address']
    },
    address: {
        type: String,
        required: true,
        trim: true
    },
    phone: {
        type: String,
        required: true,
        match: [/^\+?[0-9]{7,15}$/, 'Please enter a valid phone number']
    },
    socials: {
        instagram: { type: String, trim: true },
        facebook: { type: String, trim: true },
        youtube: { type: String, trim: true },
        twitter: { type: String, trim: true }
    }
}, { timestamps: true });

const PageContact = mongoose.model('PageContact', pagecontactSchema);

module.exports = PageContact;
