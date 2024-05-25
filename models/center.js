const mongoose = require('mongoose');
const configs = require("../configs.json");
const DATABASE = configs.CONSTANTS;

const centerSchema = new mongoose.Schema({
    Name: {
      type: String
    },
    ownerName : {
      type: String
    },
    ownerEmail : {
      type: String
    },
    ownerContact : {
      type: String
    },
    Location: {
      type: String
    },
    Description: {
      type: String
    },
    ServicesProvided: {
      type: [String]
    },
    OperatingHours: {
      type: [{
        OpeningTime: Date, 
        ClosingTime: Date   
      }]
    },
    FeaturedTests: {
      type: [{
        TestName: String,
        Category: String,
        rate: Number,
        discount: Number,
        available: Boolean
      }]
    } , 
    certificate : {
      type : [String]
    }
  });

const Center = mongoose.model(DATABASE.DATABASE_COLLECTIONS.CENTER , centerSchema);
module.exports = Center;
