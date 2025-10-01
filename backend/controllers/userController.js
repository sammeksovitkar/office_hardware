const Hardware = require('../models/Hardware'); // Assuming the Hardware model is here
const User = require('../models/User');

/**
 * @route POST /api/hardware
 * @desc Create a new Hardware record
 * @access Private (Requires authentication/user ID)
 */
/**
 * @route POST /api/hardware
 * @desc Create a new Hardware record
 * @access Private (Requires authentication/user ID)
 */
exports.createHardware = async (req, res) => {
    // 1. Destructure the payload: Get the 'hardwareItems' array and other fields
    const { hardwareItems, ...otherBodyFields } = req.body;
    const userId = req.user.id;

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        // --- 2. Map Payload Structure to Schema Structure (CORRECTED) ---
        // employeeAllocated is NOT included in the item mapping.
        const mappedItems = hardwareItems.map(item => ({
            itemName: item.hardwareName === 'Other' ? item.manualHardwareName : item.hardwareName, // Ensure manual input is used if 'Other' is selected
            serialNo: item.serialNumber,
            company: item.company 
        }));
        

        // --- 3. Create the New Hardware Record (CLEANED) ---
        const newHardware = new Hardware({
            ...otherBodyFields, // This correctly brings in employeeAllocated
            items: mappedItems, 
            user: userId,
        });
      
        const hardwareRecord = await newHardware.save();
        res.status(201).json({ msg: 'Hardware record created successfully', hardware: hardwareRecord });

    } catch (err) {
        // ... (Error handling remains the same) ...
        // ...
    }
};

// ---------------------------------------------------
// --- NEW EDIT/UPDATE FUNCTIONALITY ---
// ---------------------------------------------------

/**
 * @route PUT /api/hardware/:id
 * @desc Update ALL details of a single Hardware ITEM within the parent record
 * @access Private
 * @param {string} id - The ID of the parent Hardware document (The one with the items array).
 * @param {string} item_id - The ID of the specific item/subdocument being updated.
 * * NOTE: The client side is designed to send a single item update via a modal, 
 * so the logic targets one item by its subdocument ID.
 */
exports.updateHardwareItem = async (req, res) => {
    const parentId = req.params.id;
    const { hardwareItems, employeeAllocated, ...otherBodyFields } = req.body; // Destructure employeeAllocated for validation
    
    const itemToUpdate = hardwareItems?.[0]; 
    if (!itemToUpdate || !itemToUpdate._id) {
        return res.status(400).json({ msg: 'Item ID (_id) and update data are required.' });
    }

    // --- 🚨 CRITICAL VALIDATION FIX ---
    // If the field is an empty string (""), set it to null to prevent the Cast Error.
    // If it's a simple string like "adf", it will still throw an error unless you handle it more strictly.
    const safeEmployeeAllocated = (employeeAllocated && employeeAllocated.length > 0) 
        ? employeeAllocated 
        : null;

    try {
        // 1. Update the parent document's fields (courtName, dates, etc.)
        const parentUpdate = await Hardware.findByIdAndUpdate(
            parentId,
            { 
                $set: { 
                    ...otherBodyFields,
                    // Use the safely validated/nullified value
                    employeeAllocated: safeEmployeeAllocated, 
                } 
            },
            { new: true, runValidators: true }
        );

        if (!parentUpdate) {
            return res.status(404).json({ msg: 'Parent hardware record not found.' });
        }

        // 2. Update the specific subdocument (Adding 'company' field update for completeness)
        const subDocUpdate = await Hardware.findOneAndUpdate(
            { "_id": parentId, "items._id": itemToUpdate._id },
            { 
                $set: {
                    "items.$.itemName": itemToUpdate.hardwareName,
                    "items.$.serialNo": itemToUpdate.serialNumber,
                    "items.$.company": itemToUpdate.company // Assuming 'company' is also updated
                } 
            },
            { new: true, runValidators: true }
        ).populate('employeeAllocated', 'fullName mobileNo');

        if (!subDocUpdate) {
            return res.status(404).json({ msg: 'Hardware item (subdocument) not found within the record.' });
        }

        res.json({ msg: 'Hardware item and metadata updated successfully', hardware: subDocUpdate });

    } catch (err) {
        // ... (Error handling remains the same) ...
        console.error('Server Error on Update:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};

// ---------------------------------------------------
// --- NEW DELETE FUNCTIONALITY ---
// ---------------------------------------------------

/**
 * @route DELETE /api/hardware/:id/:item_id
 * @desc Delete a single Hardware ITEM (subdocument) from the parent record
 * @access Private
 * @param {string} id - The ID of the parent Hardware document.
 * @param {string} item_id - The ID of the specific item/subdocument to be removed.
 */
// In hardwareController.js (simplified logic)
exports.deleteHardwareItem = async (req, res) => {
    const parentId = req.params.parentId; // <--- This is the ID Mongoose can't find
    const itemId = req.params.itemId;

    const updatedRecord = await Hardware.findByIdAndUpdate(
        parentId, // <--- Fails here if parentId is wrong
        { $pull: { items: { _id: itemId } } },
        { new: true }
    );

    if (!updatedRecord) {
        // This is where your error comes from!
        return res.status(404).json({ msg: 'Parent hardware record not found.' });
    }
    // ... rest of the code
};


// ---------------------------------------------------
// --- EXISTING FETCH FUNCTIONS ---
// ---------------------------------------------------

/**
 * @route GET /api/hardware/user
 * @desc Get all Hardware records allocated to the authenticated user
 * @access Private
 */
exports.getUserHardware = async (req, res) => {
    try {
        const hardware = await Hardware.find({ employeeAllocated: req.user.id })
            .populate('employeeAllocated', 'fullName mobileNo'); 
        res.json(hardware);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};

/**
 * @route GET /api/user/me
 * @desc Get authenticated user data
 * @access Private
 */
exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};

/**
 * @route GET /api/hardware
 * @desc Get all Hardware records, populating employee details
 * @access Private (e.g., for Admin/Manager roles)
 * * NOTE: For the frontend table to work, this endpoint needs to map the nested array 
 * structure (one parent record with multiple items) into a flat array structure 
 * (one object per hardware item) before sending the response.
 */
exports.getAllHardware = async (req, res) => {
    try {
        const hardwareRecords = await Hardware.find()
            // .populate('employeeAllocated', 'fullName mobileNo')
            .populate('user', 'fullName'); 

        // --- FLATTEN THE DATA FOR FRONTEND CONSUMPTION (IMPORTANT!) ---
        // The frontend list expects a flat array where each object is a single hardware item.
        const flatHardwareList = hardwareRecords.flatMap(record => {
            return record.items.map(item => ({
                _id: item._id, // ID of the specific item/subdocument (used for Edit/Delete)
                parentId: record._id, // ID of the parent record (used for Edit/Delete)
                hardwareName: item.itemName, // Mapped name
                serialNumber: item.serialNo, // Mapped serial
                courtName: record.courtName,
                companyName: record.companyName,
                deliveryDate: record.deliveryDate,
                installationDate: record.installationDate,
                deadStockRegSrNo: record.deadStockRegSrNo,
                deadStockBookPageNo: record.deadStockBookPageNo,
                source: record.source,
                company:item.company,
                employeeAllocated: record.employeeAllocated,
                user: record.user // Creator/Entry user
            }));
        });

        res.json(flatHardwareList);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};