// 🌟 ADDED: Require dotenv config at the very top 🌟
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Database Connection
const connectDB = require('./db');

connectDB().catch(err => console.error(err));


// Routes
// Note: You might need to adjust these paths if your routes are not in the same directory.
// For Vercel, the routes will be relative to the root of your project.
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const userRoutes = require('./routes/user');

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/user', userRoutes);

// Root route for API status check
app.get('/', (req, res) => {
    res.send('Hardware Api Running.');
});


const PORT = process.env.PORT || 5000; // Use port 5000 or whatever is in your .env file

// Start the server only when the file is run directly (not when imported by Vercel)
// if (require.main === module) {
//     app.listen(PORT, () => {
//         console.log(`Server is running on port ${PORT}`);
//         console.log(`Local URL: http://localhost:${PORT}`);
//     });
// }
// The key for Vercel: export the Express app as a serverless function
module.exports = app;
