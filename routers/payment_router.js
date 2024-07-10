const express = require("express");
const router = express.Router();
const cors = require("cors"); // Import cors middleware
const payment = require("../controllers/payment_handler");

// Apply CORS middleware globally to your router
router.use(cors());

// Define routes
router.get("/", (req, res) => {
  res.status(200).json({ message: "Welcome to Payment Route!" });
});

router.get("/checkout", payment.checkout);

router.post("/paymentVerification", payment.paymentVerification);

// send the razorpay api key
router.get("/getKey", (req, res) => {
  res.status(200).json({ key: process.env.RAZORPAY_KEY });
});

module.exports = router;
