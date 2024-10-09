const mongoose = require('mongoose');
const configs = require("../configs.json");
const DATABASE = configs.CONSTANTS;

// Define schema for Test document
const querySchema = new mongoose.Schema({
    email: {
        type: String
    },
    id: {
        type: String
    },
    firstName: {
        type: String
    },
    lastName: {
        type: String
    },
    phoneNumber: {
        type: String
    },
    reason: {
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

// Create model from schema
const Query = mongoose.model(DATABASE.DATABASE_COLLECTIONS.QUERY , querySchema);
module.exports = Query;
