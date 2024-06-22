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
    centerImg: {
      type: String
    },
    ownerEmail : {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      match: /^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/,
    },
    password: {
      type: String
    },
    ownerFirstName : {
      type: String
    },
    ownerLastName : {
      type: String
    },
    roles: {
      type: String,
      default: DATABASE.ROLES.CENTER
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

const CenterVerify = mongoose.model(DATABASE.DATABASE_COLLECTIONS.CENTER_VERIFY , centerVerifySchema);
module.exports = CenterVerify;