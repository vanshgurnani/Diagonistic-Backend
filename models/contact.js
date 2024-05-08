const mongoose = require('mongoose');
const configs = require("../configs.json");
const DATABASE = configs.CONSTANTS;

// Define schema for Contact document
const contactSchema = new mongoose.Schema({
  fullName: {
    type: String
  },
  email: {
    type: String,
    unique: true
  },
  message: {
    type: String,
  }
});

// Create model from schema
const Contact = mongoose.model(DATABASE.DATABASE_COLLECTIONS.CONTACT , contactSchema);
module.exports = Contact;
