const mongoose = require("mongoose");
const mongo_uri = process.env.MONGO_URI ||`mongodb://localhost:27017/sachhidanand-web`;

mongoose.connect(mongo_uri)
  .then(() => {
    console.log("MongoDB connected successfully");
  })
  .catch((err) => {
    console.error("MongoDB connection failed:", err.message);
  });
