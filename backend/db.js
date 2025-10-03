// db.js
const mongoose = require('mongoose');

let isConnected = false;

const connectDB = async () => {
  if (isConnected) return;

  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is not defined");
  }

  const db = await mongoose.connect(process.env.MONGO_URI+process.env.DIST, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  isConnected = db.connections[0].readyState;
  console.log("✅ MongoDB Connected");
};

module.exports = connectDB;
