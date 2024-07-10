const express = require("express");
const router = express.Router();
const payment = require("../controllers/payment_handler");

// Custom CORS middleware
const corsOptions = {
  origin: "https://diagnostic-frontend.vercel.app", // Replace with your frontend URL
  methods: ["GET", "POST"], // Specify allowed HTTP methods
  allowedHeaders: ["Content-Type", "Authorization"], // Specify allowed headers
};

// Apply CORS middleware with custom options
router.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", corsOptions.origin);
  res.header("Access-Control-Allow-Methods", corsOptions.methods.join(","));
  res.header("Access-Control-Allow-Headers", corsOptions.allowedHeaders.join(","));
  if (req.method === "OPTIONS") {
    res.sendStatus(200); // Handle CORS preflight request
  } else {
    next();
  }
});

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
