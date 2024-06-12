const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Configs = require("../configs.json");
const CommonUtils = require("../utils/common");
const Constants = Configs.CONSTANTS;
const EmailService = require("../services/email_service");

const otpSchema = new Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        match: /^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/,
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

const mailVerification = async (email, otp) => {
    try {
        const emailSubject = "Portfolioo OTP for Verification";
        const emailText = null;
        const html = CommonUtils.sendOtpEmailTemplate(otp, "otp verification");

        await EmailService.sendMail(email, emailSubject, emailText, html);
    } catch (error) {
        console.log("error occur in mailVerification ", error);
        throw error;
    }
};

//  send otp email before saving data in db
otpSchema.pre("save", async function (next) {
    console.log(this.otp);

    console.log("mail to user ", this.email);
    await mailVerification(this.email, this.otp);
    next();
});

const Otp = mongoose.model(Constants.DATABASE_COLLECTIONS.OTPS, otpSchema);

module.exports = Otp;
