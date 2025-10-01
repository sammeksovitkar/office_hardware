const Hardware = require('../models/Hardware'); 
const User = require('../models/User');
const mongoose = require('mongoose'); 

// =========================================================
// 🔥 HELPER FUNCTION: DATE PARSING (MUST BE DEFINED)
// This fixes the DD/MM/YYYY and other string formats.
// =========================================================
const safeDate = (dateString) => {
    if (!dateString || typeof dateString !== 'string') return null;

    // Check for YYYY-MM-DD format (often sent from frontend after parsing Excel)
    if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const date = new Date(dateString);
        return isNaN(date.getTime()) ? null : date;
    }

    // Regex to match DD/MM/YYYY or DD-MM-YYYY
    const dateParts = dateString.match(/^(\d{1,2})[/\-](\d{1,2})[/\-](\d{4})$/);

    if (dateParts) {
        // Note: JavaScript Date constructor is year, month-1, day
        const day = parseInt(dateParts[1], 10);
        const month = parseInt(dateParts[2], 10) - 1; // Month is 0-indexed
        const year = parseInt(dateParts[3], 10);
        
        const date = new Date(year, month, day);

        // Final check to see if the date is valid
        if (date.getFullYear() === year && date.getMonth() === month && date.getDate() === day) {
            return date;
        }
    }
    
    // Fallback attempt for other formats if custom parsing fails
    const genericDate = new Date(dateString);
    return isNaN(genericDate.getTime()) ? null : genericDate;
};


// =========================================================
// 🔥 CREATE HARDWARE (FIXED FOR employeeAllocated)
// =========================================================
exports.createHardware = async (req, res) => {
    const { 
        employeeAllocated, // The name (string) sent from the frontend
        hardwareItems,
        ...restOfBody
    } = req.body;

    // Use req.user.id for the user who is logged in (admin/creator)
    const userId = req.user.id; 
    
    // 1. Define the ID variable first (Crucial to avoid "employeeId is not defined" error)
    let employeeId = null;

    // 2. Perform the Name-to-ID Lookup (Robust, case-insensitive fix)
    if (employeeAllocated && typeof employeeAllocated === 'string' && employeeAllocated.length > 0) {
        try {
            // Using the robust case-insensitive lookup
            const allocatedUser = await User.findOne({ 
                // Uses regex for flexible search, ignoring case ('i')
                fullName: { $regex: new RegExp(`^${employeeAllocated}$`, 'i') } 
            }).select('_id');
            
            // Assign the ID if the user was found
            employeeId = allocatedUser ? allocatedUser._id : null;
        } catch (lookupErr) {
            console.error('User lookup failed during manual create:', lookupErr.message);
            // employeeId remains null, which is safe for the DB save
        }
    }
    
    // 3. Map Hardware Items
    const mappedItems = hardwareItems.map(item => ({
        itemName: item.hardwareName,
        serialNo: item.serialNumber,
        company: item.company 
        // Ensure all required item fields are mapped here
    }));
    
    // 4. Prepare the final document for save
    const newHardware = new Hardware({
        ...restOfBody,             // Spread other simple fields
        items: mappedItems,        // The items array
        user: userId,              // The creator ID
        
        // This is the variable that must be defined (employeeId is now defined as an ID or null)
        employeeAllocated: employeeId, 

        // CRITICAL: Apply safeDate to all string date fields
        deliveryDate: safeDate(restOfBody.deliveryDate),
        installationDate: safeDate(restOfBody.installationDate),
    });

    try {
        const hardware = await newHardware.save();
        res.status(201).json(hardware);
    } catch (err) {
        console.error('Server Error on Create:', err.message); 
        res.status(500).json({ msg: `Server Error on Create: ${err.message}` });
    }
};


// =========================================================
// 🔥 BATCH IMPORT HARDWARE (FIXED AND COMPLETE)
// =========================================================
exports.batchImportHardware = async (req, res) => {
    const recordsToImport = req.body;
    const userId = req.user.id;

    if (!Array.isArray(recordsToImport) || recordsToImport.length === 0) {
        return res.status(400).json({ msg: 'Import payload must be a non-empty array of hardware records.' });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const user = await User.findById(userId).session(session);
        if (!user) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({ msg: 'User not found' });
        }

        const documentsToInsert = [];
        let successCount = 0;
        
        // Diagnostic Log
        if (recordsToImport.length > 0) {
            console.log('--- RAW RECORD SAMPLE ---', JSON.stringify(recordsToImport[0], null, 2));
        }

        for (const record of recordsToImport) {
            
            const { 
                hardwareItems,              
                employeeAllocated: AllocatedName, // Renaming the name to avoid conflict
                deliveryDate,               
                installationDate,           
                ...otherBodyFields          // Contains courtName, deadStockRegSrNo, source, etc.
            } = record;
            
            // 2. Validate Items
            if (!Array.isArray(hardwareItems) || hardwareItems.length === 0) {
                console.warn(`Skipping record due to empty or missing hardwareItems: ${JSON.stringify(record)}`);
                continue; 
            }

            // 3. Resolve Employee ID (Robust, case-insensitive fix for the batch)
            let employeeId = null;
           if (AllocatedName && typeof AllocatedName === 'string' && AllocatedName.length > 0) {
    
    // FIX IS HERE (you already have this): Robust Case-Insensitive Regex Lookup
    const allocatedUser = await User.findOne({ 
        fullName: { $regex: new RegExp(`^${AllocatedName}$`, 'i') } 
    }).select('_id').session(session);
    
    employeeId = allocatedUser ? allocatedUser._id : null;
    
    // 🔥 NEW DIAGNOSTIC LOG (ADD THIS LINE):
    console.log(`Lookup attempt for "${AllocatedName}": Found ID? ${employeeId ? 'YES: ' + employeeId : 'NO'}`);
}
            // 4. Map Hardware Items
            const mappedItems = hardwareItems.map(item => ({
                itemName: item.hardwareName,
                serialNo: item.serialNumber,
                company: item.company 
            }));

            // 5. Prepare Final Document Structure
            const newHardwareDoc = {
                ...otherBodyFields, 
                
                deliveryDate: safeDate(deliveryDate),
                installationDate: safeDate(installationDate),
                
                employeeAllocated: employeeId, // Resolved ID (or null if lookup failed)
                
                items: mappedItems, 
                user: userId,
            };

            documentsToInsert.push(newHardwareDoc);
            successCount++;
        }
        
        // 6. Handle Case: No valid documents to insert
        if (documentsToInsert.length === 0) {
            await session.commitTransaction(); 
            session.endSession();
            return res.status(200).json({ 
                msg: 'File processed, but no valid records were inserted after filtering.', 
                count: 0 
            });
        }

        // 7. Insert documents
        await Hardware.insertMany(documentsToInsert, { session, ordered: false });
        
        await session.commitTransaction();
        session.endSession();
        
        // 8. Send final success response
        res.status(201).json({ 
            msg: `Successfully imported ${successCount} hardware records.`, 
            count: successCount 
        });

    } catch (err) {
        await session.abortTransaction();
        session.endSession();
        
        console.error('Batch Import Server Error:', err);
        
        res.status(500).json({ 
            msg: `Server failed to process the batch. A data error may exist in the file. Error: ${err.message}`,
            error: err.message, 
            count: 0
        });
    }
};

// =========================================================
// --- UPDATE HARDWARE ITEM (EXISTING LOGIC) ---
// =========================================================
exports.updateHardwareItem = async (req, res) => {
    const parentId = req.params.id;
    const { hardwareItems, employeeAllocated, ...otherBodyFields } = req.body;
    
    const itemToUpdate = hardwareItems?.[0]; 
    if (!itemToUpdate || !itemToUpdate._id) {
        return res.status(400).json({ msg: 'Item ID (_id) and update data are required.' });
    }
    
    // Lookup employee ID for update (needed if the name changes)
    let employeeId = null;
    if (employeeAllocated && employeeAllocated.length > 0) {
         try {
            const allocatedUser = await User.findOne({ 
                fullName: { $regex: new RegExp(`^${employeeAllocated}$`, 'i') } 
            }).select('_id');
            employeeId = allocatedUser ? allocatedUser._id : null;
        } catch (lookupErr) {
            console.error('User lookup failed during update:', lookupErr.message);
            employeeId = null;
        }
    }


    try {
        // 1. Update the parent document's fields (courtName, dates, employeeAllocated ID, etc.)
        await Hardware.findByIdAndUpdate(
            parentId,
            { 
                $set: { 
                    ...otherBodyFields,
                    employeeAllocated: employeeId, // Use the resolved ID here
                    deliveryDate: safeDate(otherBodyFields.deliveryDate),
                    installationDate: safeDate(otherBodyFields.installationDate),
                } 
            },
            { new: true, runValidators: true }
        );

        // 2. Update the specific subdocument (item details)
        const subDocUpdate = await Hardware.findOneAndUpdate(
            { "_id": parentId, "items._id": itemToUpdate._id },
            { 
                $set: { 
                    "items.$.itemName": itemToUpdate.hardwareName,
                    "items.$.serialNo": itemToUpdate.serialNumber,
                    "items.$.company": itemToUpdate.company
                } 
            },
            { new: true, runValidators: true }
        ).populate('employeeAllocated', 'fullName mobileNo');

        if (!subDocUpdate) {
            return res.status(404).json({ msg: 'Hardware item (subdocument) not found within the record.' });
        }

        res.json({ msg: 'Hardware item and metadata updated successfully', hardware: subDocUpdate });

    } catch (err) {
        console.error('Server Error on Update:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};

// =========================================================
// --- DELETE HARDWARE ITEM (EXISTING LOGIC) ---
// =========================================================
exports.deleteHardwareItem = async (req, res) => {
    const parentId = req.params.parentId; 
    const itemId = req.params.itemId;

    try {
        const updatedRecord = await Hardware.findByIdAndUpdate(
            parentId, 
            { $pull: { items: { _id: itemId } } },
            { new: true }
        );

        if (!updatedRecord) {
            return res.status(404).json({ msg: 'Parent hardware record not found.' });
        }
        res.json({ msg: 'Hardware item deleted successfully', hardware: updatedRecord });
    } catch (err) {
        console.error('Server Error on Delete:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};

// =========================================================
// --- FETCH FUNCTIONS (EXISTING LOGIC) ---
// =========================================================
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

exports.getAllHardware = async (req, res) => {
    try {
        const hardwareRecords = await Hardware.find();

        // FLATTEN THE DATA FOR FRONTEND CONSUMPTION
        const flatHardwareList = hardwareRecords.flatMap(record => {
            return record.items.map(item => ({
                _id: item._id, 
                parentId: record._id, 
                hardwareName: item.itemName, 
                serialNumber: item.serialNo, 
                courtName: record.courtName,
                companyName: record.companyName,
                deliveryDate: record.deliveryDate,
                installationDate: record.installationDate,
                deadStockRegSrNo: record.deadStockRegSrNo,
                deadStockBookPageNo: record.deadStockBookPageNo,
                source: record.source,
                company:item.company,
                employeeAllocated: record.employeeAllocated,
                user: record.user 
            }));
        });

        res.json(flatHardwareList);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};
