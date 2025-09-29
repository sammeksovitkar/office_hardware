const User = require('../models/User');
const jwt = require('jsonwebtoken');
// NOTE: bcrypt is no longer needed in this file since DOB is not hashed.

exports.login = async (req, res) => {
  const { mobileNo, dob } = req.body;

  // Input validation
  if (!mobileNo || !dob) {
    return res.status(400).json({ msg: 'Please enter both Mobile Number and Date of Birth.' });
  }

  // Admin login logic (kept as is, assuming environment variables are set)
  if (mobileNo === process.env.ADMIN_USERNAME && dob === process.env.ADMIN_PASSWORD) {
    // IMPORTANT: In a real-world scenario, the admin password should be hashed.
    const token = jwt.sign({ role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '1h' });
    return res.json({ token, role: 'admin' });
  }

  // Regular user login logic (Mobile No + DOB Authentication)
  try {
    // 1. Find the user by mobile number
    const user = await User.findOne({ mobileNo });

    if (!user) {
      // Return a generic error message for security
      return res.status(400).json({ msg: 'Invalid Credentials' });
    }

    // 2. Normalize and Compare DOB
    // The incoming 'dob' from the client is typically "YYYY-MM-DD".
    // The stored 'user.dob' (Mongoose Date) is a full object (e.g., 2025-09-23T00:00:00.000Z).
    
    let storedDobString;

    if (user.dob && user.dob instanceof Date) {
        // Convert the stored Mongoose Date object to a clean "YYYY-MM-DD" string (UTC)
        storedDobString = user.dob.toISOString().split('T')[0];
    } else {
        // Handle cases where 'dob' might not be a valid Date object or is missing
        return res.status(400).json({ msg: 'Invalid Credentials' });
    }

    // Compare the client input string (dob) with the normalized stored string (storedDobString)
    if (dob !== storedDobString) {
      // Log for debugging if necessary: console.log(`Input DOB: ${dob}, Stored DOB: ${storedDobString}`);
      return res.status(400).json({ msg: 'Invalid Credentials' });
    }

    // 3. Authentication Successful: Create and send token
    // Assuming 'user.role' is defined in your User model
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token, role: user.role });

  } catch (err) {
    console.error('Login error:', err.message); 
    res.status(500).json({ msg: 'Server error' });
  }
};