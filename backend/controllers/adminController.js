const User = require('../models/User');
const Surety = require('../models/Surety');
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

    if (dob) {
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
    }
    res.json({ msg: 'Users imported successfully' });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

// ---------------------------------------------------------------- //
// --------------------------- SURETY LOGIC ------------------------- //
// ---------------------------------------------------------------- //

exports.getAllSureties = async (req, res) => {
  try {
    const sureties = await Surety.find().populate('assignedToUser', 'fullName mobileNo');
    res.json(sureties);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

// **ADDED: Function to create a new Surety (similar to createUser)**
exports.createSurety = async (req, res) => {
  const { shurityName, address, aadharNo, policeStation, caseFirNo, actName, section, accusedName, accusedAddress, shurityAmount, shurityDate, courtCity, assignedToUser } = req.body;
  try {
    // Check for existing surety by Aadhar
    let exists = await Surety.findOne({ aadharNo });
    if (exists) return res.status(400).json({ msg: 'Surety with this Aadhar number already exists' });
    
    // Determine the user to assign this to (could be the authenticated user or an admin ID)
    const userToAssignId = assignedToUser || req.user?.id; // Assuming req.user is available for authenticated API

    const newSurety = new Surety({
      shurityName,
      address,
      aadharNo,
      policeStation,
      caseFirNo,
      actName,
      section,
      accusedName,
      accusedAddress,
      shurityAmount,    // <<-- ADDED
      shurityDate,      // <<-- ADDED
      courtCity,
      assignedToUser: userToAssignId, 
    });

    await newSurety.save();
    res.status(201).json({ msg: 'Surety created successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error during surety creation' });
  }
};

// **UPDATED: Added shurityAmount and shurityDate to updateSurety**
exports.updateSurety = async (req, res) => {
  const { shurityName, address, aadharNo, policeStation, caseFirNo, actName, section, accusedName, accusedAddress, shurityAmount, shurityDate } = req.body;
  try {
    const surety = await Surety.findById(req.params.id);
    if (!surety) return res.status(404).json({ msg: 'Surety record not found' });

    surety.shurityName = shurityName || surety.shurityName;
    surety.address = address || surety.address;
    surety.aadharNo = aadharNo || surety.aadharNo;
    surety.policeStation = policeStation || surety.policeStation;
    surety.caseFirNo = caseFirNo || surety.caseFirNo;
    surety.actName = actName || surety.actName;
    surety.section = section || surety.section;
    surety.accusedName = accusedName || surety.accusedName;
    surety.accusedAddress = accusedAddress || surety.accusedAddress;
    surety.shurityAmount = shurityAmount || surety.shurityAmount; // <<-- ADDED
    surety.shurityDate = shurityDate || surety.shurityDate;     // <<-- ADDED

    await surety.save();
    res.json({ msg: 'Surety record updated successfully' });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.deleteSurety = async (req, res) => {
  try {
    const surety = await Surety.findByIdAndDelete(req.params.id);
    if (!surety) return res.status(404).json({ msg: 'Surety record not found' });
    res.json({ msg: 'Surety record deleted successfully' });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

// **UPDATED: Added shurityAmount and shurityDate to importSuretiesFromExcel**
exports.importSuretiesFromExcel = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ msg: "No file uploaded" });
    }

    // Ensure default user exists and HASH the password
    let userToAssign = await User.findOne({ mobileNo: "9999999999" });
    if (!userToAssign) {
      const salt = await bcrypt.genSalt(10);
      const password = await bcrypt.hash("2000-01-01", salt); 

      userToAssign = await User.create({
        fullName: "Default Admin",
        dob: "2000-01-01",
        mobileNo: "9999999999",
        village: "Default",
        emailId: "default@example.com",
        password: password, // Use hashed password
      });
    }

    // Read Excel
    const workbook = xlsx.read(req.file.buffer);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);

    let duplicates = [];
    let savedCount = 0;

    for (const row of data) {
      const aadharNo = row["Aadhar No."] || row["Aadhar No"] || row.aadharNo;
      const shurityName = row.shurityName || row["shurityName"] || row["Surety Name"];
      const address = row.Address || row["address"];
      const policeStation = row["Police Station"] || row.policeStation;
      const caseFirNo = row["Case/FIR No."] || row["Case/FIR No"] || row.caseFirNo;
      const actName = row["Act Name"] || row.actName;
      const section = row.Section || row.section;
      const accusedName = row["Accused Name"] || row.accusedName;
      const accusedAddress = row["Accused Address"] || row.accusedAddress;
      const courtCity = row.courtCity || row["Court City"];

      // <<-- ADDED NEW IMPORT FIELDS -->>
      const shurityAmount = row["Surety Amount"] || row.shurityAmount;
      const shurityDate = row["Surety Date"] || row.shurityDate;
      // <<----------------------------->>

      // Check for required fields, including the new ones
      if (!aadharNo || !shurityName || !address || !policeStation || !caseFirNo || !actName || !section || !accusedName || !accusedAddress || !courtCity || !shurityAmount || !shurityDate) {
        continue; // skip incomplete rows
      }

      const exists = await Surety.findOne({ aadharNo });
      if (exists) {
        duplicates.push({
          aadharNo,
          existingSurety: exists.shurityName,
          newSurety: shurityName,
        });
        continue; // skip duplicates
      }

      const newSurety = new Surety({
        shurityName,
        address,
        aadharNo,
        policeStation,
        caseFirNo,
        actName,
        section,
        accusedName,
        accusedAddress,
        courtCity,
        shurityAmount, // <<-- ADDED
        shurityDate,   // <<-- ADDED
        assignedToUser: userToAssign._id,
      });

      await newSurety.save();
      savedCount++;
    }

    // Response messages
    if (duplicates.length > 0 && savedCount > 0) {
      return res.json({
        msg: "Some records were imported; some duplicates were skipped",
        saved: savedCount,
        skipped: duplicates.length,
        duplicates,
      });
    } else if (duplicates.length > 0 && savedCount === 0) {
      return res.json({
        msg: "All records are duplicates. No new records were imported",
        saved: 0,
        skipped: duplicates.length,
        duplicates,
      });
    } else {
      return res.json({
        msg: "Sureties import completed successfully",
        saved: savedCount,
        skipped: 0,
        duplicates: [],
      });
    }
  } catch (err) {
    console.error("❌ Surety import error:", err);
    res.status(500).json({ msg: "Server error during surety import" });
  }
};