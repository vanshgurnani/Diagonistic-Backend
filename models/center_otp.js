const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Configs = require("../configs.json");
const Constants = Configs.CONSTANTS;

const otpSchema = new Schema({
    email: {
        type: String,
        required: true,
    },
    otp: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 60 * 5,
    },
    createdAtEP: {
        type: Number,
        default: Math.floor(Date.now() / 1000),
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
    updatedAtEP: {
        type: Number,
        default: Math.floor(Date.now() / 1000),
    },
});

const Otp = mongoose.model(Constants.DATABASE_COLLECTIONS.CENTER_OTPS, otpSchema);

module.exports = Otp;
