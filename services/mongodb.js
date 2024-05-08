const mongoose = require("mongoose");
const User = require("../models/user");
const Test = require("../models/test");
const Contact = require("../models/contact");
const Otp = require("../models/otp");

class DBService {
    constructor() {
        console.log(`Initializing database connection.`);

        this.connect();
    }

    async connect() {
        try {
            await mongoose.connect(process.env.MONGO_URL, {
                useNewUrlParser: true,
                useUnifiedTopology: true,
            });
            console.log("Connected to MongoDB");
        } catch (error) {
            console.error(`MongoDB connection error: ${error}`);
            process.exit(1);
        }
    }

    async close() {
        await mongoose.connection.close();
        console.log(`Disconnected from MongoDB`);
    }

    getModel(modelName) {
        return mongoose.model(modelName);
    }
}

module.exports = DBService;
