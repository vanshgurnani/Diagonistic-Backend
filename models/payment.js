const mongoose = require("mongoose");
const configs = require("../configs.json");
const DATABASE = configs.CONSTANTS;

const paymentDetailsSchema = new mongoose.Schema({
  amount: { type: Number},
  payment_date: { type: Date, default: Date.now },
  bookingId: {
    type: String
  },
  razorpay_payment_id: { type: String},
  razorpay_order_id: { type: String},
  razorpay_signature: { type: String},
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

const payment = mongoose.model(DATABASE.DATABASE_COLLECTIONS.PAYMENT, paymentDetailsSchema);

module.exports = payment;