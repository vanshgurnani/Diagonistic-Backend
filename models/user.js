const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const configs = require("../configs.json");
const DATABASE = configs.CONSTANTS;

const userSchema = new Schema({
    username:{
        type: String,
    },
    firstName : {
        type: String
    } ,
    lastName : {
        type: String
    } ,
    status: {
        type: String,
        enum: [DATABASE.STATUS.ACTIVE, DATABASE.STATUS.INACTIVE, DATABASE.STATUS.PENDING],
        default: DATABASE.STATUS.ACTIVE
    },   
    password: {
        type: String,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        match: /^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/,
    },
    phoneNumber: {
        type: String,
    } ,
    roles: {
        type: String,
        enum: [DATABASE.ROLES.USER , DATABASE.ROLES.PATIENT , DATABASE.ROLES.CENTER],
        defaultValue: DATABASE.ROLES.PATIENT
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    createdAt_EP: {
        type: Number,
        default: Math.floor(Date.now() / 1000),
        index: true
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt_EP: {
        type: Number,
        default: Math.floor(Date.now() / 1000),
        index: true
    },
    profileImgUrl: {
        type: String,
    },
    address: {
        type: String,
    },
    dob: {
        type: Date,
    },
    location: {
        name: String, 
    },
    coordinates: { 
        type: [Number],
        index: '2dsphere', 
    },
    otp: {
        type: Number,
        default: 0
    }
});

const User = mongoose.model(DATABASE.DATABASE_COLLECTIONS.USERS , userSchema);
module.exports = User;
