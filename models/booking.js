const mongoose = require('mongoose');
const configs = require("../configs.json");
const DATABASE = configs.CONSTANTS;
const template = require("../utils/template");
const emailService = require("../services/email_service");

const bookingSchema = new mongoose.Schema({
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
    phoneNumber: {
        type: String
    },
    appointmentDateTime: {
        type: Date,
        default: Date.now
    },
    testName: {
        type: String
    },
    rate: {
        type: Number
    },
    timeSlot: {
        type: Date
    },
    preferredDoctorName: {
        type: String,
        default: "NULL"
    },
    paymentId: {
        type: String,
        default: "NULL"
    },
    action: {
        type: String,
        enum: [DATABASE.STATUS.ACCEPTED , DATABASE.STATUS.REJECTED , DATABASE.STATUS.PENDING], // Possible actions for the booking
        default: DATABASE.STATUS.PENDING
    } ,   
    report : {
        type : [String],
        default: []
    } ,
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

const mailVerification = async (email, username) => {
    try {
        const emailSubject = "DiagnoWeb Booking";
        const emailText = null;
        const content = "DiagnoWeb";
        const html = template.sendDynamicEmailTemplate(emailSubject,username , content);

        await emailService.sendMail(email, emailSubject, emailText, html);
    } catch (error) {
        console.log("error occur in mailVerification ", error);
        throw error;
    }
};

//  send otp email before saving data in db
bookingSchema.pre("save", async function (next) {
    console.log(this.patientName);

    console.log("mail to user ", this.patientEmail);
    await mailVerification(this.patientEmail, this.patientName);
    next();
});

const Book = mongoose.model(DATABASE.DATABASE_COLLECTIONS.BOOKING , bookingSchema);
module.exports = Book;