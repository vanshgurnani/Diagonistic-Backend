const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();
const express = require("express");
const bodyParser = require("body-parser");
const session = require("express-session");

const passport = require("./utils/google_stratergy");

const authRouter = require("./routers/auth_router");
const testRouter = require("./routers/test_router");
const contactRouter = require("./routers/contact_router");
const dashboardRouter = require("./routers/dasboard_router");
const bookingRouter = require("./routers/booking_router");
const centerRouter = require("./routers/center_router");
const paymentRouter = require("./routers/payment_router");
const centerVerifyRouter = require("./routers/center_verify_router");


const EXPRESS_SESSION_CONFIGS = {
    secret: process.env.EXPRESS_SESSION_SECRET_KEY,
    resave: true,
    saveUninitialized: true,
};

const app = express();
app.use(session(EXPRESS_SESSION_CONFIGS));

app.use(passport.initialize());

app.use(cors({
    origin: "https://diagnostic-frontend.vercel.app", // Replace with your frontend URL
    methods: ["GET", "POST"], // Allowed HTTP methods
    allowedHeaders: ["Content-Type", "Authorization" , "Access-Control-Allow-Origin"], // Allowed headers
}));

app.options("*", cors());

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.get("/", (req, res) => {
    res.send("Welcome to Diagonistic API");
});

app.use("/api/auth", authRouter);
app.use("/api/test", testRouter);
app.use("/api/contact", contactRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/booking", bookingRouter);
app.use("/api/center", centerRouter);
app.use("/api/pay", paymentRouter);
app.use("/api/verify", centerVerifyRouter);

app.get("/paymentSuccess", (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "https://diagnostic-frontend.vercel.app"); 
    res.setHeader("Access-Control-Allow-Methods", "GET, POST");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

    res.status(200).json({ message: "Payment success!" });
});




const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server is running on PORT: ${port}`);
});
