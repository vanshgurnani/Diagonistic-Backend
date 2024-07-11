const mongoose = require('mongoose');
const configs = require("../configs.json");
const DATABASE = configs.CONSTANTS;

const centerSchema = new mongoose.Schema({
    centerName: {
      type: String
    },
    contact: {
      type: String
    },
    centerImg: {
      type: String,
      default: 'https://cdn.docplexus.com/116/3/3/069df40b-f4aa-422a-b565-cd6358561cc0__t.jpg'
    },
    email : {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: /^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/,
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
    otp: {
      type: String
    },
    available: {
      type: String,
      enum: [DATABASE.AVAILABLE.YES , DATABASE.AVAILABLE.NO],
      default: DATABASE.AVAILABLE.YES
    },
    status: {
      type: String,
      enum: [DATABASE.STATUS.ACTIVE , DATABASE.STATUS.INACTIVE , DATABASE.STATUS.PENDING],
      default: DATABASE.STATUS.PENDING
    },
    saved: {
      type: Boolean,
      default: false
    },
    isIso: {
      type: Boolean
    },
    isNabl: {
      type: Boolean
    },
    isNabh: {
      type: Boolean
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
