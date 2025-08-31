const mongoose = require("mongoose");

const connectDb = async () => {
  try {
    await mongoose.connect('mongodb+srv://rahulverma:rahul@cluster0.fpxfh.mongodb.net/mailAppilication');
    console.log("✅ DB connected successfully");
  } catch (error) {
    console.error("❌ Error connecting to the database:", error.message);
    process.exit(1);
  }
};

module.exports = { connectDb };
