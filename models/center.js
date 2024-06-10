const mongoose = require('mongoose');
const configs = require("../configs.json");
const DATABASE = configs.CONSTANTS;

const centerSchema = new mongoose.Schema({
    centerName: {
      type: String
    },
    centerContact: {
      type: String
    },
    centerEmail: {
      type: String
    },
    password: {
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
    centerGST: {
      type: Number
    },
    address: {
      type: String
    },
    addressProof: {
      type: String
    },
    staffNumber: {
      type: Number
    },
    shopAct: {
      type: String
    },
    shopAct: {
      type: String
    },
    pcpndt: {
      type: String
    },
    iso: {
      type: String
    },
    nabl: {
      type: String
    },
    nabh: {
      type: String
    },
    otp: {
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

const Center = mongoose.model(DATABASE.DATABASE_COLLECTIONS.CENTER , centerSchema);
module.exports = Center;
