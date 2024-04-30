const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();
const express = require("express");
const bodyParser = require("body-parser");
const session = require("express-session");

const authRouter = require("./routers/auth_router");

const EXPRESS_SESSION_CONFIGS = {
    secret: process.env.EXPRESS_SESSION_SECRET_KEY,
    resave: true,
    saveUninitialized: true,
};

const app = express();
app.use(session(EXPRESS_SESSION_CONFIGS));
// app.use(cors({credentials: true}));

const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://diagnostic-frontend.vercel.app'
  ];
  
  app.use(cors({
    origin: allowedOrigins,
  }));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.get('/', (req, res) => {
    res.send('Welcome to Diagonistic API');
});

app.use("/api/auth", authRouter);

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server is running on PORT: ${port}`);
});
