const mongoose = require('mongoose');
const configs = require("../configs.json");
const DATABASE = configs.CONSTANTS;

const centerVerifySchema = new mongoose.Schema({
    centerName: {
      type: String
    },
    centerContact: {
      type: String
    },
    centerEmail: {
      type: String
    },
    ownerName : {
      type: String
    },
    ownerContact : {
      type: String
    },
    ownerEmail : {
      type: String
    },
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

const CenterVerify = mongoose.model(DATABASE.DATABASE_COLLECTIONS.CENTER_VERIFY , centerVerifySchema);
module.exports = CenterVerify;