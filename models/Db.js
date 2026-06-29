const mongoose = require("mongoose");
const { logger } = require('../config/logger');
const mongo_uri = process.env.MONGO_URI ||`mongodb://localhost:27017/sachhidanand-web`;

mongoose.connect(mongo_uri)
  .then(() => {
    logger.info("MongoDB connected successfully");
  })
  .catch((err) => {
    logger.error("MongoDB connection failed", { message: err.message });
  });
