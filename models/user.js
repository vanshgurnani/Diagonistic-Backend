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

userSchema.pre('save', async function (next) {
    if (this.isNew) {
        const emailContent = template.sendDynamicEmailTemplate({
            title: 'Thank You for Registering',
            heading: 'Welcome to DiagnoWeb!',
            bodyContent: `
                <p>Dear ${this.username},</p>
                <p>Thank you for registering with Bright Future. We are thrilled to have you on board. You can now explore all the features and benefits we offer.</p>
            `,
            footerContent: `If you have any questions or need assistance, please feel free to reach out to Bright Future <a href="mailto:contact@blackcheriemedia.com">here</a>. We are here to help!`
        });

        try {
            await emailService.sendMail(this.email, 'Thank You for Registering', emailContent);
        } catch (error) {
            console.error('Error sending email:', error);
        }
    }
    next();
});


const User = mongoose.model(DATABASE.DATABASE_COLLECTIONS.USERS, userSchema);
module.exports = User;

