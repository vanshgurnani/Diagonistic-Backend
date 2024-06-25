const DBUtils = require("../utils/db_operations");
const CommonUtils = require("../utils/common");
const Configs = require("../configs.json");
const Razorpay = require("razorpay");
const crypto = require("crypto");


module.exports.checkout = async (req, res) => {
    try {
        // Initialize Razorpay instance
        const razorpayInstance = new Razorpay({
            key_id: process.env.RAZORPAY_KEY,
            key_secret: process.env.RAZORPAY_SECRET_KEY,
        });

        // Extract and validate amount from query parameters
        const amount = req.body.amount;
        if (!amount) {
            throw new Error('Please provide the amount as a query parameter.');
        }

        // Define order options
        const options = {
            amount: Number(amount) * 100, // Amount in paise
            currency: "INR",
        };

        // Create order with Razorpay
        const order = await razorpayInstance.orders.create(options);

        // Respond with success message and order details
        res.status(200).json({
            success: true,
            message: "Order created successfully",
            order: order,
        });
    } catch (error) {
        console.error(`Error occurred during checkout: ${error.message}`);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
};

module.exports.paymentVerification = async (req, res) => {
    const {
        razorpay_payment_id,
        razorpay_order_id,
        razorpay_signature,
        amount,
    } = req.body;

    const generated_signature = razorpay_order_id + "|" + razorpay_payment_id;

    const expected_signature = crypto
        .createHmac("sha256", process.env.RAZORPAY_SECRET_KEY)
        .update(generated_signature.toString())
        .digest("hex");

    if (expected_signature == razorpay_signature) {
        console.log("Payment verified successfully");

        await DBUtils.create(
            {
                razorpay_payment_id,
                razorpay_order_id,
                razorpay_signature,
                amount
            },
            Configs.CONSTANTS.DATABASE_COLLECTIONS.PAYMENT
        );

        res.redirect(
            `${process.env.FRONTEND_URL}/paymentSuccess?reference=${razorpay_payment_id}`
        );
    } else {
        console.log("Payment verification failed");
        res.redirect(
            `${process.env.FRONTEND_URL}/paymentFailed?reference=${razorpay_payment_id}`
        );
    }
};
