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

// to run and test locally
if (process.env.DEVELOPMENT) {
    const port = process.env.PORT || 3000;
    app.listen(port, () => {
        console.log(`Server is running on PORT: ${port}`);
    });
}
// to run over lambda
module.exports.handler = async (event, context) => {
    try {
        console.log(`[handler] Event received - ${JSON.stringify(event)}`);
        const path = event.path || "";
        console.log("[Lambda Handler] Requested Path -", path);
        return await serverless(app)(event, context);
    } catch (error) {
        console.error(`Lambda Handler Error: ${JSON.stringify(error)}`);
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: error?.message ? error.message : `Internal sever error`,
            }),
        };
    }
};
