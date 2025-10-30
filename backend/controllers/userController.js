const Hardware = require('../models/Hardware'); 
const User = require('../models/User');
const mongoose = require('mongoose'); 

// =========================================================
// 🔥 HELPER FUNCTION: DATE PARSING (MUST BE DEFINED)
// =========================================================
// const safeDate = (dateString) => {
//     if (!dateString || typeof dateString !== 'string') return null;

//     // Check for YYYY-MM-DD format (often sent from frontend after parsing Excel)
//     if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
//         const date = new Date(dateString);
//         return isNaN(date.getTime()) ? null : date;
//     }

//     // Regex to match DD/MM/YYYY or DD-MM-YYYY
//     const dateParts = dateString.match(/^(\d{1,2})[/\-](\d{1,2})[/\-](\d{4})$/);

//     if (dateParts) {
//         // Note: JavaScript Date constructor is year, month-1, day
//         const day = parseInt(dateParts[1], 10);
//         const month = parseInt(dateParts[2], 10) - 1; // Month is 0-indexed
//         const year = parseInt(dateParts[3], 10);
        
//         const date = new Date(year, month, day);

//         // Final check to see if the date is valid
//         if (date.getFullYear() === year && date.getMonth() === month && date.getDate() === day) {
//             return date;
//         }
//     }
    
//     // Fallback attempt for other formats if custom parsing fails
//     const genericDate = new Date(dateString);
//     return isNaN(genericDate.getTime()) ? null : genericDate;
// };
const safeDate = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  return isNaN(parsed.getTime()) ? null : parsed;
};

// =========================================================
// 🔥 CREATE HARDWARE (FIXED: Saves Name String directly)
// =========================================================
exports.createHardware = async (req, res) => {
    // employeeAllocated captures the name string from the payload
    const { 
        employeeAllocated, 
        hardwareItems,
        ...restOfBody
    } = req.body;

    const userId = req.user.id; 
    
    // 1. Employee ID lookup is REMOVED. employeeAllocated (the name string) 
    //    will be saved directly.
    
    // 2. Map Hardware Items
    const mappedItems = hardwareItems.map(item => ({
        itemName: item.hardwareName,
        serialNo: item.serialNumber,
        company: item.company 
    }));
    
    // 3. Prepare the final document for save
    const newHardware = new Hardware({
        ...restOfBody,             
        items: mappedItems,        
        user: userId,              
        
        // 🔥 FIX: employeeAllocated field saves the name string from the request body.
        employeeAllocated: employeeAllocated, 

        deliveryDate: safeDate(restOfBody.deliveryDate),
        installationDate: safeDate(restOfBody.installationDate),
    });

    try {
        const hardware = await newHardware.save();
        res.status(201).json(hardware);
    } catch (err) {
        // NOTE: If your schema strictly requires an ObjectId for employeeAllocated, 
        // this will fail with a CastError.
        console.error('Server Error on Create:', err.message); 
        res.status(500).json({ msg: `Server Error on Create: ${err.message}` });
    }
};


// =========================================================
// 🔥 BATCH IMPORT HARDWARE (FIXED: Saves Name String and removes lookup)
// =========================================================
// exports.batchImportHardware = async (req, res) => {
//     const recordsToImport = req.body;
//     console.log(recordsToImport)
//     const userId = req.user.id;

//     if (!Array.isArray(recordsToImport) || recordsToImport.length === 0) {
//         return res.status(400).json({ msg: 'Import payload must be a non-empty array of hardware records.' });
//     }

//     const session = await mongoose.startSession();
//     session.startTransaction();

//     try {
//         const user = await User.findById(userId).session(session);
//         if (!user) {
//             await session.abortTransaction();
//             session.endSession();
//             return res.status(404).json({ msg: 'User not found' });
//         }

//         const documentsToInsert = [];
//         let successCount = 0
        
//        // Diagnostic Log (userController.js: Line 115 now)
//         if (recordsToImport.length > 0) {
//             // console.log('--- RAW RECORD SAMPLE ---', JSON.stringify(recordsToImport[0], null, 2));
//         }

//         for (const record of recordsToImport) {
            
//             // 1. Destructure employeeAllocated (the name) separately, and everything else
//             const { 
//                 hardwareItems,              
//                 employeeAllocated, // Captures the name string from the record
//                 deliveryDate,               
//                 installationDate,           
//                 ...otherBodyFields          
//             } = record;
            
//             // 2. Validate Items
//             if (!Array.isArray(hardwareItems) || hardwareItems.length === 0) {
//                 console.warn(`Skipping record due to empty or missing hardwareItems: ${JSON.stringify(record)}`);
//                 continue; 
//             }

//             // 3. Employee ID Resolution logic is REMOVED.
            
//             // 4. Map Hardware Items
//             const mappedItems = hardwareItems.map(item => ({
//                 itemName: item.hardwareName,
//                 serialNo: item.serialNumber,
//                 company: item.company 
//             }));

//             // 5. Prepare Final Document Structure
//             const newHardwareDoc = {
//                 ...otherBodyFields, 
                
//                 deliveryDate: safeDate(deliveryDate),
//                 installationDate: safeDate(installationDate),
                
//                 // 🔥 FIX: Saves the name string from the input record
//                 employeeAllocated: employeeAllocated, 
                
//                 items: mappedItems, 
//                 user: userId,
//             };

//             documentsToInsert.push(newHardwareDoc);
//             successCount++;
//         }
        
//         // 6. Handle Case: No valid documents to insert
//         if (documentsToInsert.length === 0) {
//             await session.commitTransaction(); 
//             session.endSession();
//             return res.status(200).json({ 
//                 msg: 'File processed, but no valid records were inserted after filtering.', 
//                 count: 0 
//             });
//         }

//         // 7. Insert documents
//         await Hardware.insertMany(documentsToInsert, { session, ordered: false });
        
//         await session.commitTransaction();
//         session.endSession();
        
//         // 8. Send final success response
//         res.status(201).json({ 
//             msg: `Successfully imported ${successCount} hardware records.`, 
//             count: successCount 
//         });

//     } catch (err) {
//         await session.abortTransaction();
//         session.endSession();
        
//         console.error('Batch Import Server Error:', err);
        
//         res.status(500).json({ 
//             msg: `Server failed to process the batch. A data error may exist in the file. Error: ${err.message}`,
//             error: err.message, 
//             count: 0
//         });
//     }
// };
exports.importExcel = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ msg: "No file uploaded" });

    // 1️⃣ Read Excel file
    const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

    // 2️⃣ Convert rows into hardware documents
    const documentsToInsert = sheet.map((row) => ({
      courtName: row["Court Name"]?.trim() || "",
      companyName: row["Company"]?.trim() || "",
      deadStockRegSrNo: row["Dead Stock Sr. No."]?.trim() || "",
      deadStockBookPageNo: row["Dead Stock Page No."]?.trim() || "",
      source: row["Source"]?.trim() || "",
      deliveryDate: parseExcelDate(row["Delivery Date"]),
      installationDate: parseExcelDate(row["Installation Date"]),
      employeeAllocated: row["Allocated Employee"]?.trim() || "",
      items: [
        {
          itemName: row["Item Name"]?.trim() || "",
          serialNumber: row["Serial Number"]?.trim() || "",
        },
      ],
      user: req.user?._id || "system",
    }));

    console.log("✅ Ready to insert:", documentsToInsert.length);
    console.log("📦 Data:", documentsToInsert);

    // 3️⃣ Check duplicates by serial number
    const allSerials = documentsToInsert.map((d) => d.items[0].serialNumber);
    const existing = await Hardware.find({ "items.serialNumber": { $in: allSerials } });

    const existingSerials = new Set(
      existing.flatMap((doc) => doc.items.map((i) => i.serialNumber))
    );

    const newDocs = documentsToInsert.filter(
      (d) => !existingSerials.has(d.items[0].serialNumber)
    );

    console.log(`✅ After duplicate check: ${newDocs.length} new records to insert.`);

    // 4️⃣ Insert only new ones
    if (newDocs.length > 0) {
      const insertedDocs = await Hardware.insertMany(newDocs, { ordered: false });
      console.log("✅ Inserted docs:", insertedDocs.length);
      return res.status(200).json({
        msg: `Successfully imported ${insertedDocs.length} hardware records.`,
        count: insertedDocs.length,
      });
    } else {
      console.log("ℹ️ No new records to insert (all duplicates).");
      return res.status(200).json({ msg: "No new records to insert." });
    }
  } catch (error) {
    console.error("❌ Import failed:", error);
    res.status(500).json({ msg: "Error importing data", error: error.message });
  }
};

// 5️⃣ Helper: Parse date
function parseExcelDate(value) {
  if (!value) return null;
  if (typeof value === "string") {
    const [day, month, year] = value.split(/[\/\-]/).map((n) => parseInt(n, 10));
    if (year && month && day) return new Date(year, month - 1, day);
  }
  if (typeof value === "number") {
    return XLSX.SSF.parse_date_code(value)
      ? new Date(1900, 0, value - 1)
      : null;
  }
  return null;
}
exports.batchImportHardware = async (req, res) => {
  try {
    const recordsToImport = req.body;
    const userId = req.user.id;

    if (!Array.isArray(recordsToImport) || recordsToImport.length === 0) {
      return res
        .status(400)
        .json({ msg: 'Import payload must be a non-empty array of hardware records.' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    const documentsToInsert = [];

    for (const record of recordsToImport) {
      const {
        hardwareItems,
        employeeAllocated,
        deliveryDate,
        installationDate,
        ...otherFields
      } = record;

      if (!Array.isArray(hardwareItems) || hardwareItems.length === 0) {
        console.warn(`Skipping record: no hardwareItems`);
        continue;
      }

      const mappedItems = hardwareItems.map((item) => ({
        itemName: item.hardwareName,
        serialNo: item.serialNumber,
        company: item.company,
      }));

      const newDoc = {
        ...otherFields,
        deliveryDate: safeDate(deliveryDate),
        installationDate: safeDate(installationDate),
        employeeAllocated,
        items: mappedItems,
        user: userId,
      };

      documentsToInsert.push(newDoc);
    }

    console.log('✅ Ready to insert:', documentsToInsert.length);

    if (documentsToInsert.length === 0) {
      return res.status(200).json({ msg: 'No valid records to insert.', count: 0 });
    }

    // ===============================================
    // 🧠 STEP 1: Fetch all existing serial numbers
    // ===============================================
    const existingSerials = new Set(
      (await Hardware.find({}, { 'items.serialNo': 1 }))
        .flatMap((doc) => doc.items.map((i) => i.serialNo))
    );

    // ===============================================
    // 🧹 STEP 2: Filter duplicates
    // ===============================================
    const filteredDocs = documentsToInsert.filter((doc) =>
      doc.items.every((item) => !existingSerials.has(item.serialNo))
    );

    console.log(`✅ After duplicate check: ${filteredDocs.length} new records to insert.`);

    if (filteredDocs.length === 0) {
      return res.status(200).json({ msg: 'All records already exist.', count: 0 });
    }

    // ===============================================
    // 💾 STEP 3: Insert all remaining docs
    // ===============================================
    const insertedDocs = await Hardware.insertMany(filteredDocs, { ordered: false });
    console.log('✅ Inserted docs:', insertedDocs.length);

    res.status(201).json({
      msg: `Successfully imported ${insertedDocs.length} hardware records.`,
      count: insertedDocs.length,
    });
  } catch (err) {
    console.error('❌ Batch Import Error:', err);
    res.status(500).json({ msg: `Server failed: ${err.message}` });
  }
};



// =========================================================
// --- UPDATE HARDWARE ITEM (FIXED: Saves Name String directly) ---
// =========================================================
exports.updateHardwareItem = async (req, res) => {
    const parentId = req.params.id;
    const { hardwareItems, employeeAllocated, ...otherBodyFields } = req.body; // employeeAllocated is the name
    
    const itemToUpdate = hardwareItems?.[0]; 
    if (!itemToUpdate || !itemToUpdate._id) {
        return res.status(400).json({ msg: 'Item ID (_id) and update data are required.' });
    }
    
    // Employee ID lookup is REMOVED. employeeAllocated (the name string) 
    // will be used directly.

    try {
        // 1. Update the parent document's fields (courtName, dates, employeeAllocated name, etc.)
        await Hardware.findByIdAndUpdate(
            parentId,
            { 
                $set: { 
                    ...otherBodyFields,
                    // 🔥 FIX: Use the name string directly for update
                    employeeAllocated: employeeAllocated, 
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
        )/*.populate('employeeAllocated', 'fullName mobileNo')*/; // 👈 REMOVED POPULATE

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
// --- FETCH FUNCTIONS (FIXED: Removed unnecessary populate) ---
// =========================================================
exports.getUserHardware = async (req, res) => {
    try {
        // 1. Fetch the logged-in user to get their court/village
        const user = await User.findById(req.user.id).select('village');
        if (!user || !user.village) {
            return res.status(404).json({ msg: 'User not found or Court/Village not assigned.' });
        }

        const userCourt = user.village;
        
        // 2. Find all hardware records associated with the user's court
        // This is the CRITICAL change: Filter by courtName field, not employeeAllocated ID.
        const hardwareRecords = await Hardware.find({ courtName: userCourt });

        // 3. FLATTEN THE DATA FOR FRONTEND CONSUMPTION
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
                company: item.company,
                employeeAllocated: record.employeeAllocated, 
                user: record.user 
            }));
        });

        res.json(flatHardwareList);
    } catch (err) {
        console.error('Error in getUserHardware:', err.message);
        res.status(500).json({ msg: 'Server error fetching user court hardware.' });
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
        const hardwareRecords = await Hardware.find(); // NO POPULATE NEEDED
//   const hardwareRecords = await Hardware.find({ courtName: "Manmad City" });
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
                // employeeAllocated is now the name string, ready for display
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

// Assuming this is in your controller file (e.g., hardwareController.js)

exports.getHardwareByCourt = async (req, res) => {
    try {
        // 1. Get the courtName from the request URL parameters
        const { courtName } = req.params; 

        if (!courtName) {
            return res.status(400).json({ msg: 'Court name parameter is required.' });
        }

        // 2. Find hardware records that match the specific courtName
        const hardwareRecords = await Hardware.find({ courtName: "Manmad City" });

        // 3. FLATTEN THE DATA FOR FRONTEND CONSUMPTION (Same logic as getAllHardware)
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
                company: item.company,
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