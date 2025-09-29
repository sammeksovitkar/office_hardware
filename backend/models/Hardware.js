const mongoose = require('mongoose');

const HardwareSchema = new mongoose.Schema({
    // --- Deployment/Location Details ---
    
    // 1) Court Name (Location) - The location of this deployment
    courtName: {
        type: String,
        required: [true, 'Court Name is required'],
        trim: true
    },
    // 2) Company Name (Manufacturer) - If this whole kit came from one company
    companyName: {
        type: String,
        required: [true, 'Company Name is required'],
        trim: true
    },
    // 3) From whom did it come? (Source/Vendor)
    source: {
        type: String,
        required: [true, 'Source/Vendor is required'],
        trim: true
    },

    // --- Array of Hardware Items ---
    
    // This array holds all the individual pieces of hardware (Monitor, CPU, etc.)
    items: [
        {
            itemName: { // Type of item, e.g., "Monitor"
                type: String,
                required: [true, 'Item Name is required in the array'],
                trim: true
            },
            serialNo: { // The unique serial number for that item
                type: String,
                // unique: true // This is complex for arrays, better handled with a separate index creation
                required: [true, 'Serial Number is required in the array'],
                trim: true
            }
            // You can add item-specific details here if needed
        }
    ],

    // --- Date and Stock Details ---
    
    // 4) Delivery Date
    deliveryDate: {
        type: Date,
        required: [true, 'Delivery Date is required']
    },
    // 5) Installation Date
    installationDate: {
        type: Date,
        required: [true, 'Installation Date is required']
    },
    // 6) Dead Stock Reg. Sr.No
    deadStockRegSrNo: {
        type: String,
        default: 'N/A',
        trim: true
    },
    // 7) Dead Stock Book Page No
    deadStockBookPageNo: {
        type: String,
        default: 'N/A',
        trim: true
    },
    
    // --- Allocation and Tracking ---

    // 8) Employee Allocated (Links to a User or Employee model)
    employeeAllocated: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    // 9) Tracking the Admin/User who created this record
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', 
        required: [true, 'User ID is required for tracking'] 
    }
}, {
    timestamps: true 
});

// IMPORTANT: If you use OPTION B, you should manually define a unique index on the array field 
// to ensure serial numbers are unique across all documents.
HardwareSchema.index({ 'items.serialNo': 1 }, { unique: true, sparse: true });


module.exports = mongoose.model('Hardware', HardwareSchema);