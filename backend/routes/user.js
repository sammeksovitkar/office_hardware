const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController'); // Contains the hardware logic
const { authMiddleware, userMiddleware } = require('../middleware/auth');


const XLSX = require('xlsx');
const upload = require('../middleware/upload'); // ✅ Correct path
const DeadStock = require('../models/DeadStock');
// Hardware routes

// 1. Create a new Hardware record (Single Entry)
router.post('/hardware', authMiddleware, userMiddleware, userController.createHardware);

// ----------------------------------------------------
// 🔥 NEW: BATCH IMPORT ROUTE
// This must be added to handle the POST request from the frontend import function.
router.post('/hardware/batch-import', authMiddleware, userMiddleware, userController.batchImportHardware);
// ----------------------------------------------------

// 2. Get Hardware records allocated to the authenticated User/Employee
router.get('/hardware', authMiddleware, userMiddleware, userController.getUserHardware);

// 3. Get all Hardware records (Likely for admin/manager view)
router.get('/allhardware', authMiddleware, userController.getAllHardware);

// ----------------------------------------------------
// --- NEW EDIT & DELETE ROUTES ---
// ----------------------------------------------------

// 4. UPDATE/EDIT a specific hardware item and its parent metadata
router.put('/hardware/:id', authMiddleware, userController.updateHardwareItem);

// 5. DELETE a specific hardware ITEM (subdocument) from the parent record
router.delete('/hardware/:parentId/:itemId', authMiddleware, userController.deleteHardwareItem);
router.post('/upload-excel', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    // Step 1️⃣ - Read Excel
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(sheet, { defval: '' });

    console.log('✅ Total rows found:', jsonData.length);

    // Step 2️⃣ - Convert rows into DB objects
    const documents = jsonData
      .map((row, i) => {
        // Helper for safe date conversion
        const parseDate = (dateStr) => {
          if (!dateStr || typeof dateStr !== 'string') return null;
          const parts = dateStr.split('/');
          if (parts.length !== 3) return null;
          const [day, month, year] = parts.map((p) => parseInt(p, 10));
          if (!day || !month || !year) return null;
          return new Date(year, month - 1, day);
        };

        const doc = {
          courtName: row['Court Name']?.trim() || '',
          companyName: row['Company']?.trim() || '',
          deadStockRegSrNo: row['Dead Stock Sr. No.']?.trim() || '',
          deadStockBookPageNo: row['Dead Stock Page No.']?.trim() || '',
          source: row['Source']?.trim() || '',
          employeeAllocated: row['Allocated Employee']?.trim() || '',
          deliveryDate: parseDate(row['Delivery Date']),
          installationDate: parseDate(row['Installation Date']),
          items: [
            {
              itemName: row['Item Name']?.trim() || row['Serial Number']?.trim() || 'Unnamed',
              serialNo: row['Serial Number']?.trim() || '',
              company: row['Company']?.trim() || '',
            },
          ],
        };

        // Add row index for debugging
        return { ...doc, __rowIndex: i + 2 }; // Excel row number
      })
      // Filter out completely empty rows
      .filter(
        (doc) =>
          doc.courtName ||
          doc.items[0].serialNo ||
          doc.items[0].itemName ||
          doc.source
      );

    console.log('✅ Ready to insert:', documents.length);

    // Step 3️⃣ - Try inserting each document individually for better error visibility
    const insertedDocs = [];
    const failedDocs = [];

    for (const doc of documents) {
      try {
        const inserted = await DeadStock.create(doc);
        insertedDocs.push(inserted);
      } catch (err) {
        console.warn(`⚠️ Row ${doc.__rowIndex} failed: ${err.message}`);
        failedDocs.push({ row: doc.__rowIndex, error: err.message });
      }
    }

    console.log(`✅ Inserted docs: ${insertedDocs.length}`);
    if (failedDocs.length > 0) {
      console.warn(`⚠️ ${failedDocs.length} documents failed validation.`);
      console.table(failedDocs);
    }

    res.status(200).json({
      success: true,
      inserted: insertedDocs.length,
      failed: failedDocs.length,
      failedDocs,
    });
  } catch (err) {
    console.error('❌ Upload error:', err);
    res.status(500).json({ error: 'Failed to upload Excel file', details: err.message });
  }
});

// 📅 Helper function for date parsing
function parseExcelDate(value) {
  if (!value) return null;
  if (typeof value === 'string' && value.includes('/')) {
    const [day, month, year] = value.split('/').map(Number);
    return new Date(year, month - 1, day);
  }
  if (typeof value === 'number') {
    const excelEpoch = new Date((value - 25569) * 86400 * 1000); // Excel date conversion
    return excelEpoch;
  }
  return null;
}


// ----------------------------------------------------

// Dummy route to get user info (kept as is)
router.get('/me', authMiddleware, userController.getMe);

module.exports = router;
