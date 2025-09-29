const mongoose = require('mongoose');

const SuretySchema = new mongoose.Schema({
    shurityName: { type: String, required: true },
    address: { type: String },
    aadharNo: { type: String, unique: true },
    policeStation: { type: String },
    caseFirNo: { type: String, unique: true },
    actName: { type: String },
    section: { type: String },
    accusedName: { type: String },
    accusedAddress: { type: String },

    // --- NEW FIELDS ADDED HERE ---
    shurityAmount: { 
        type: Number, 
        required: true // Store the amount as a number
    },
    dateOfSurety: { 
        type: Date, 
        default: Date.now // Store the date, defaults to current date if not provided
    },
    // -----------------------------
    
    assignedToUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    courtCity: { type: String },
});

module.exports = mongoose.model('Surety', SuretySchema);