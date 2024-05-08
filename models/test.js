const mongoose = require('mongoose');
const configs = require("../configs.json");
const DATABASE = configs.CONSTANTS;

// Define schema for Test document
const testSchema = new mongoose.Schema({
  TestName: {
    type: String
  },
  Category: {
    type: String
  },
  rate: {
    type: Number
  }
});

// Create model from schema
const Test = mongoose.model(DATABASE.DATABASE_COLLECTIONS.TEST , testSchema);
module.exports = Test;
