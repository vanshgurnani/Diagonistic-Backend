const mongoose = require('mongoose');
const configs = require("../configs.json");
const DATABASE = configs.CONSTANTS;

const centerSchema = new mongoose.Schema({
    name: {
      type: String
    },
    contact: {
      type: String
    },
    centerImg: {
      type: String
    },
    email : {
      type: String
    },
    password: {
      type: String
    },
    firstName : {
      type: String
    },
    lastName : {
      type: String
    },
    ownerContact : {
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
    status: {
      type: String,
      enum: [DATABASE.STATUS.ACTIVE , DATABASE.STATUS.INACTIVE , DATABASE.STATUS.PENDING],
      default: DATABASE.STATUS.PENDING
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
