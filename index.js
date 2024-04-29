const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();
const express = require("express");
const bodyParser = require("body-parser");
const session = require("express-session");
const serverless = require("serverless-http");

const authRouter = require("./routers/auth_router");

const EXPRESS_SESSION_CONFIGS = {
    secret: process.env.EXPRESS_SESSION_SECRET_KEY,
    resave: true,
    saveUninitialized: true,
};

const app = express();
app.use(session(EXPRESS_SESSION_CONFIGS));
app.use(cors({credentials: true}));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use("/api/auth", authRouter);

// This section is for running and testing locally
if (process.env.DEVELOPMENT) {
    const port = process.env.PORT || 3000;
    app.listen(port, () => {
        console.log(`Server is running on PORT: ${port}`);
    });
}

// Exporting the handler function for AWS Lambda
module.exports.handler = serverless(app);
