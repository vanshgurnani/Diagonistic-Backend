const mongoose = require('mongoose');
const configs = require("../configs.json");
const DATABASE = configs.CONSTANTS;


const orderedSchema = new mongoose.Schema({
    bookingId: {
        type: String
    },
    centerEmail: {
        type: String
    },
    patientName: {
        type: String
    },
    patientEmail : {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
        match: /^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/,
    },
    appointmentDateTime: {
        type: Date,
        default: Date.now
    },
    testName: {
        type: String
    },
    status: {
        type: String,
        enum: [DATABASE.STATUS.ONGOING , DATABASE.STATUS.PREVIOUS],
        default: DATABASE.STATUS.ONGOING
    },
    paymentId: {
        type: String,
        default: "NULL"
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

const order = mongoose.model(DATABASE.DATABASE_COLLECTIONS.ORDERED_TEST , orderedSchema);
module.exports = order;