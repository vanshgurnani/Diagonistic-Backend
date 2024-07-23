const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const configs = require("../configs.json");
const DATABASE = configs.CONSTANTS;
const template = require("../utils/template");
const emailService = require("../services/email_service");

const userSchema = new Schema({
    username: {
        type: String,
    },
    firstName: {
        type: String,
    },
    lastName: {
        type: String,
    },
    status: {
        type: String,
        enum: [
            DATABASE.STATUS.ACTIVE,
            DATABASE.STATUS.INACTIVE,
            DATABASE.STATUS.PENDING,
        ],
        default: DATABASE.STATUS.ACTIVE,
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
    },
    roles: {
        type: String,
        enum: [
            DATABASE.ROLES.USER,
            DATABASE.ROLES.PATIENT,
            DATABASE.ROLES.CENTER,
            DATABASE.ROLES.SUPER_ADMIN
        ],
        default: DATABASE.ROLES.PATIENT,
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
        index: "2dsphere",
    },
    resetPasswordToken: {
        type: String,
    },
    resetPasswordExpires: {
        type: Date,
    },
});

const mailVerification = async (email, username, status) => {
    try {
        let emailSubject = "";
        let emailText = null;
        let content = "DiagnoWeb"; // Default content

        if (status === DATABASE.STATUS.PENDING) {
            emailSubject = "Pending Request on DiagnoWeb";
            // Customize the email template for pending status
            content = "Pending Request";
        } else {
            emailSubject = "DiagnoWeb Registration";
            // Default registration email template
            content = "DiagnoWeb";
        }

        const html = template.sendDynamicEmailTemplate(emailSubject, username, content);
        await emailService.sendMail(email, emailSubject, emailText, html);
    } catch (error) {
        console.log("Error occurred in mailVerification ", error);
        throw error;
    }
};

// Pre-save hook to send email before saving data in the database
userSchema.pre("save", async function (next) {
    console.log("User's name:", this.firstName, this.lastName);
    console.log("Email to user:", this.email);
    
    // Call mailVerification function based on user status
    await mailVerification(this.email, this.firstName + " " + this.lastName, this.status);
    
    next();
});


const User = mongoose.model(DATABASE.DATABASE_COLLECTIONS.USERS, userSchema);
module.exports = User;

