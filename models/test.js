const mongoose = require('mongoose');
const configs = require("../configs.json");
const DATABASE = configs.CONSTANTS;

// Define schema for Test document
const testSchema = new mongoose.Schema({
  TestName: {
    type: String,
    default : ''
  },
  Category: {
    type: String,
    default : ''
  },
  rate: {
    type: Number,
    default : 0
  } , 
  discount : {
    type : Number,
    default : 0
  } , 
  available : {
    type : Boolean,
    default: false
  } , 
  finalPrice : {
    type : Number,
    default : 0
  } , 
  action : {
    type: String,
      enum: [
          DATABASE.STATUS.PUBLISHED,
          DATABASE.STATUS.VISITED,
          DATABASE.STATUS.PENDING,
      ],
      default: DATABASE.STATUS.PENDING,
  } ,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  createdAt_EP: {
      type: Number,
      default: Math.floor(Date.now() / 1000),
      index: true,
  },
  updatedAt: {
      type: Date,
      default: Date.now,
  },
  updatedAt_EP: {
      type: Number,
      default: Math.floor(Date.now() / 1000),
      index: true,
  }
});

// Create model from schema
const Test = mongoose.model(DATABASE.DATABASE_COLLECTIONS.TEST , testSchema);
module.exports = Test;
