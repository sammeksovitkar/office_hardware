const User = require('../models/User');
// Require the Hardware model
const Hardware = require('../models/Hardware'); 
const bcrypt = require('bcryptjs');
const xlsx = require('xlsx');

// ---------------------------------------------------------------- //
// ---------------------------- USER LOGIC -------------------------- //
// ---------------------------------------------------------------- //

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ role: 'user' });
    res.json(users);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.createUser = async (req, res) => {
  const { fullName, dob, mobileNo, village, emailId } = req.body;
  try {
    let user = await User.findOne({ mobileNo });
    if (user) return res.status(400).json({ msg: 'User with this mobile number already exists' });

    const salt = await bcrypt.genSalt(10);
    // Use DOB as the default password for simplicity (hashed)
    const password = await bcrypt.hash(dob, salt);

    user = new User({ fullName, dob, mobileNo, village, emailId, password });
    await user.save();

    res.status(201).json({ msg: 'User created successfully' });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.updateUser = async (req, res) => {
  const { fullName, dob, mobileNo, village, emailId } = req.body;
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ msg: 'User not found' });

    user.fullName = fullName || user.fullName;
    user.dob = dob || user.dob;
    user.mobileNo = mobileNo || user.mobileNo;
    user.village = village || user.village;
    user.emailId = emailId || user.emailId;

    // Reset password if DOB is provided/changed
    if (dob && dob !== user.dob) { 
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(dob, salt);
    }

    await user.save();
    res.json({ msg: 'User updated successfully' });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ msg: 'User not found' });
    res.json({ msg: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.importUsersFromExcel = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ msg: 'No file uploaded' });

    const workbook = xlsx.read(req.file.buffer);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);

    let savedCount = 0;

    for (const row of data) {
      const { 'Full Name': fullName, 'DOB (YYYY-MM-DD)': dob, 'Mobile No': mobileNo, Village, 'Email ID': emailId } = row;

      if (!fullName || !dob || !mobileNo || !Village) continue;

      const userExists = await User.findOne({ mobileNo });
      if (userExists) continue;

      const salt = await bcrypt.genSalt(10);
      const password = await bcrypt.hash(dob, salt);

      const newUser = new User({
        fullName,
        dob,
        mobileNo,
        village: Village,
        emailId,
        password,
      });

      await newUser.save();
      savedCount++;
    }
    res.json({ msg: `Successfully imported ${savedCount} users.` });
  } catch (err) {
    console.error("User import error:", err);
    res.status(500).json({ msg: 'Server error during user import' });
  }
};

// ---------------------------------------------------------------- //
// ------------------------- HARDWARE LOGIC ------------------------- //
// ---------------------------------------------------------------- //

/**
 * @route GET /api/admin/hardware
 * @desc Get all Hardware records and FLATTEN the data for the Admin Dashboard table.
 * @access Private (Admin)
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

/**
 * @route POST /api/admin/hardware
 * @desc Create a new Hardware record using Admin form fields.
 * @access Private (Admin)
 */
exports.createHardware = async (req, res) => {
    // 1. Map Admin Dashboard form fields back to the schema structure
    const { 
        itemName, serialNo, courtCity, policeStation, assetTag, manufacturer, 
        model, allocatedTo, department, hardwareCount, deliveryDate
    } = req.body;

    try {
        // Find the user to be allocated (requires a separate lookup, using the Admin's ID as placeholder if not specified)
        const employee = await User.findOne({ fullName: allocatedTo }) || req.user.id;
        const employeeId = (typeof employee === 'object') ? employee._id : req.user.id;
        
        // 2. Create the items array (simplified to one item for the Admin form structure)
        const itemsArray = [{
            itemName: itemName,
            serialNo: serialNo,
        }];

        const newHardware = new Hardware({
            // Core fields for the parent document
            courtName: courtCity,
            companyName: manufacturer,
            deliveryDate: deliveryDate,
            source: policeStation,
            deadStockRegSrNo: assetTag, // Asset Tag mapped to Dead Stock Reg Sr No.
            
            // Nested array
            items: itemsArray,
            
            // Allocation and Entry
            user: req.user.id,
            employeeAllocated: employeeId,
        });

        const hardwareRecord = await newHardware.save();
        res.status(201).json({ msg: 'Hardware record created successfully' });

    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ msg: 'Conflict: A serial number already exists.' });
        }
        if (err.name === 'ValidationError') {
            const requiredFields = Object.keys(err.errors).join(', ');
            return res.status(400).json({ msg: 'Validation error', details: `Missing or invalid field(s): ${requiredFields}` });
        }
        console.error('Server Error (Admin Create Hardware):', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};

/**
 * @route PUT /api/admin/hardware/:id
 * @desc Update a single Hardware ITEM (subdocument) AND its parent metadata.
 * @access Private (Admin)
 * @param {string} id - The ID of the specific item/subdocument being updated.
 */
exports.updateHardware = async (req, res) => {
    const itemId = req.params.id; // Item ID passed from the Admin table row
    const { 
        itemName, serialNo, courtCity, policeStation, assetTag, manufacturer, 
        model, allocatedTo, department, hardwareCount, deliveryDate
    } = req.body;

    try {
        // Find the parent record containing the item
        const parentRecord = await Hardware.findOne({ 'items._id': itemId });
        if (!parentRecord) {
            return res.status(404).json({ msg: 'Hardware record not found.' });
        }
        const parentId = parentRecord._id;

        // Find the user to be allocated (requires a separate lookup)
        const employee = await User.findOne({ fullName: allocatedTo }) || parentRecord.employeeAllocated;
        const employeeId = (typeof employee === 'object') ? employee._id : parentRecord.employeeAllocated;

        // 1. Update the parent document's metadata fields
        await Hardware.findByIdAndUpdate(
            parentId,
            { 
                $set: { 
                    courtName: courtCity,
                    companyName: manufacturer,
                    deliveryDate: deliveryDate,
                    source: policeStation,
                    deadStockRegSrNo: assetTag,
                    employeeAllocated: employeeId,
                } 
            },
            { new: true, runValidators: true }
        );

        // 2. Update the specific subdocument (item)
        const updatedItem = await Hardware.findOneAndUpdate(
            { "_id": parentId, "items._id": itemId },
            { 
                $set: {
                    "items.$.itemName": itemName,
                    "items.$.serialNo": serialNo
                } 
            },
            { new: true, runValidators: true }
        );

        if (!updatedItem) {
            return res.status(404).json({ msg: 'Hardware item update failed.' });
        }

        res.json({ msg: 'Hardware record updated successfully' });

    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ msg: 'Conflict: The serial number provided already exists.' });
        }
        if (err.name === 'ValidationError') {
            return res.status(400).json({ msg: 'Validation error', details: err.message });
        }
        console.error('Server Error (Admin Update Hardware):', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};

/**
 * @route DELETE /api/admin/hardware/:id
 * @desc Delete a single Hardware ITEM (subdocument) OR the entire parent record if it's the last item.
 * @access Private (Admin)
 * @param {string} id - The ID of the specific item/subdocument to be removed.
 */
exports.deleteHardware = async (req, res) => {
    const itemId = req.params.id; // Item ID passed from the Admin table row

    try {
        // Find the parent record
        const parentRecord = await Hardware.findOne({ 'items._id': itemId });
        if (!parentRecord) {
            return res.status(404).json({ msg: 'Hardware record not found.' });
        }
        const parentId = parentRecord._id;

        // Remove the subdocument using $pull
        const updatedRecord = await Hardware.findByIdAndUpdate(
            parentId, 
            { $pull: { items: { _id: itemId } } },
            { new: true }
        );

        // OPTIONAL: If the items array is now empty, delete the parent record
        if (updatedRecord && updatedRecord.items.length === 0) {
            await Hardware.findByIdAndDelete(parentId);
            return res.json({ msg: 'Last hardware item and parent record deleted successfully.' });
        }

        res.json({ msg: 'Hardware item deleted successfully.' });

    } catch (err) {
        console.error('Server Error (Admin Delete Hardware):', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};

/**
 * @route POST /api/admin/hardware/import
 * @desc Import hardware records from Excel.
 * @access Private (Admin)
 */
exports.importHardwareFromExcel = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ msg: "No file uploaded" });
        }

        // Find a default user (Admin) to assign as the entry user
        let userToAssign = await User.findOne({ role: 'admin' });
        if (!userToAssign) {
            return res.status(500).json({ msg: "No Admin user found to assign the import entry." });
        }

        // Read Excel
        const workbook = xlsx.read(req.file.buffer);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(sheet);

        let duplicates = [];
        let savedCount = 0;

        for (const row of data) {
            // Map Excel columns to Mongoose fields (Adjust these names based on your expected Excel header)
            const itemName = row["Item Name"] || row.itemName;
            const serialNo = row["Serial No."] || row.serialNo;
            const courtCity = row["Court City"] || row.courtCity;
            const policeStation = row["Police Station"] || row.policeStation;
            const assetTag = row["Asset Tag"] || row.assetTag;
            const manufacturer = row.Manufacturer || row.manufacturer;
            const allocatedToName = row["Allocated To"] || row.allocatedTo;
            const deliveryDate = row["Delivery Date"] || row.deliveryDate;
            
            // Find the allocated employee by name
            const allocatedEmployee = await User.findOne({ fullName: allocatedToName }) || userToAssign; 
            const allocatedEmployeeId = (typeof allocatedEmployee === 'object') ? allocatedEmployee._id : userToAssign._id;

            // Check for required fields
            if (!itemName || !serialNo || !courtCity || !assetTag || !deliveryDate) {
                continue; // skip incomplete rows
            }

            // Check for existing item by serial number (requires index on items.serialNo)
            const exists = await Hardware.findOne({ "items.serialNo": serialNo });
            if (exists) {
                duplicates.push({ serialNo, itemName });
                continue; // skip duplicates
            }

            // 1. Prepare the nested item structure
            const itemsArray = [{
                itemName: itemName,
                serialNo: serialNo,
            }];

            // 2. Create the new parent hardware record
            const newHardware = new Hardware({
                courtName: courtCity,
                companyName: manufacturer,
                deliveryDate: deliveryDate,
                source: policeStation,
                deadStockRegSrNo: assetTag, // Asset Tag
                
                items: itemsArray,
                
                user: userToAssign._id,
                employeeAllocated: allocatedEmployeeId,
            });

            await newHardware.save();
            savedCount++;
        }

        // Response messages
        if (duplicates.length > 0 && savedCount > 0) {
            return res.json({
                msg: `Successfully imported ${savedCount} records. ${duplicates.length} duplicates were skipped.`,
                saved: savedCount,
                skipped: duplicates.length,
            });
        } else if (duplicates.length > 0 && savedCount === 0) {
            return res.json({
                msg: "All records are duplicates. No new records were imported",
                saved: 0,
                skipped: duplicates.length,
            });
        } else {
            return res.json({
                msg: "Hardware import completed successfully",
                saved: savedCount,
                skipped: 0,
            });
        }
    } catch (err) {
        console.error("❌ Hardware import error:", err);
        res.status(500).json({ msg: "Server error during hardware import" });
    }
};