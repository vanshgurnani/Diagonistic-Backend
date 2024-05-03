const jwtService = require("../../services/jwt");
const axios = require("axios");
const dbUtils = require("../../utils/db_operations");
const commonUtils = require("../../utils/common");
const configs = require("../../configs.json");
const s3Utils = require("../../utils/s3");
const emailService = require("../../services/email_service");
const DATABASE_COLLECTIONS = configs.CONSTANTS.DATABASE_COLLECTIONS;

module.exports.registerHandler = async (req, res) => {
    try {
        // Fetch other required fields from request body
        let requiredFields = [
            { property: "email", optional: true },
            { property: "password", optional: true },
            { property: "username", optional: true },
            { property: "firstName", optional: true },
            { property: "lastName", optional: true },
            { property: "phoneNumber", optional: true },
            { property: "roles", optional: true },
            { property: "profileImgUrl", optional: true },
            { property: "location", optional: true },
        ];
        let data = await commonUtils.validateRequestBody(
            req.body,
            requiredFields
        );

        // Upload file to S3
        // const file = req.file;
        // const fileName = `${data.email}.${file.originalname.split('.').pop()}`;
        // const imageUrl = await s3Utils.uploadFileToS3(file, fileName, process.env.AWS_BUCKET_NAME);
        // console.log(imageUrl);
        // data.profileImgUrl = imageUrl;

        // Save user data to the database
        const newUser = await dbUtils.create(data, DATABASE_COLLECTIONS.USERS);

        const otp = commonUtils.generateRandomNumber(4);

        const subject = "Your OTP for authentication";
        const text = `Your OTP is: ${otp}`;
        const html = `<p>Your OTP is: <strong>${otp}</strong></p>`;
        await emailService.sendMail(data.email, subject, text, html);

        await dbUtils.updateOne(
            { email: data.email },
            { otp: otp },
            DATABASE_COLLECTIONS.USERS
        );

        const message = `${
            data.username || data.email
        } is successfully registered.`;

        // Send success response
        res.status(200).json({ type: "success", message: message, newUser });
    } catch (error) {
        if (
            error.code === 11000 &&
            error.keyPattern &&
            error.keyPattern.username
        ) {
            return res
                .status(400)
                .json({ type: "Error", error: "Username is already taken." });
        }
        console.log(`[registerHandler] Error occurred: ${error}`);
        res.status(400).json({ type: "error", error: error.message });
    }
};

module.exports.verifyOtpController = async (req, res) => {
    try {
        const { email, otp } = req.body;

        // Combine OTP digits into a single string and parse it into a number
        const parsedOtp = parseInt(otp.join(""));

        console.log(parsedOtp);

        // Retrieve user from the database using the email
        const user = await dbUtils.findOne(
            { email },
            DATABASE_COLLECTIONS.USERS
        );

        // Check if the user exists and if the provided OTP matches the one in the database
        if (!user || user.otp !== parsedOtp) {
            return res.status(400).json({ message: "Invalid OTP" });
        }

        // Clear the OTP field in the user document
        await dbUtils.updateOne(
            { email },
            { otp: null },
            DATABASE_COLLECTIONS.USERS
        );

        // Send success response
        res.status(200).json({ message: "OTP verified successfully" });
    } catch (error) {
        console.error("[verifyOtpController] Error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

module.exports.locationGet = async (req, res) => {
    try {
        // Fetch location data from IPAPI.co
        const ipapiResponse = await axios.get("https://ipapi.co/json");
        const { latitude, longitude } = ipapiResponse.data;

        // Fetch detailed location information from OpenStreetMap Nominatim API using latitude and longitude
        const nominatimResponse = await axios.get(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
        );
        const locationData = nominatimResponse.data;

        // Send location data in JSON format as response
        res.json(locationData);
    } catch (error) {
        console.error("Error fetching location:", error);
        res.status(500).json({ error: "Failed to fetch location data" });
    }
};

module.exports.getProfileController = async (req, res) => {
    try {
        // Extract user ID from request parameters

        const id = req.decodedToken.id;

        console.log(id);

        const userId = await dbUtils.convertStringIdToMongooId(id);

        // Fetch user profile from the database using the user ID
        const userProfile = await dbUtils.findOne(
            userId,
            DATABASE_COLLECTIONS.USERS
        );

        // Check if user profile exists
        if (!userProfile) {
            return res
                .status(404)
                .json({ type: "Error", message: "User profile not found." });
        }

        // Return user profile in the response
        res.status(200).json({ type: "Success", userProfile });
    } catch (error) {
        console.error(`[getProfileController] Error occurred: ${error}`);
        res.status(500).json({
            type: "Error",
            message: "Failed to fetch user profile.",
        });
    }
};

module.exports.updateProfileHandler = async (req, res) => {
    try {
        // Extract userId from decoded token
        const userId = req.decodedToken.id;

        // Fetch updated profile data from request body
        let updatedProfileData = req.body;

        // Check if a file is uploaded
        if (req.file) {
            const file = req.file;
            const fileName = `${userId}.${file.originalname.split(".").pop()}`;
            const imageUrl = await s3Utils.uploadFileToS3(
                file,
                fileName,
                process.env.AWS_BUCKET_NAME
            );
            updatedProfileData.profileImgUrl = imageUrl;
        }

        // Define query to find user profile based on userId
        const query = { _id: userId };

        // Update user profile in the database
        const updatedProfile = await dbUtils.updateOne(
            query,
            updatedProfileData,
            DATABASE_COLLECTIONS.USERS
        );

        // Check if profile was successfully updated
        if (updatedProfile) {
            res.status(200).json({
                type: "Success",
                message: "Profile updated successfully.",
                data: updatedProfileData,
            });
        } else {
            res.status(404).json({
                type: "Error",
                error: "User profile not found or could not be updated.",
            });
        }
    } catch (error) {
        console.error(`Error occurred while updating user profile: ${error}`);
        res.status(500).json({
            type: "Error",
            error: "Internal server error.",
        });
    }
};

module.exports.findDistanceController = async (req, res) => {
    try {
        // Extract latitude and longitude coordinates of the two points from request query parameters
        const { lat1, lon1, lat2, lon2 } = req.body;

        // Check if all coordinates are provided
        if (!lat1 || !lon1 || !lat2 || !lon2) {
            return res.status(400).json({
                type: "Error",
                message:
                    "Please provide all latitude and longitude coordinates.",
            });
        }

        // Convert coordinates to numbers
        const latitude1 = parseFloat(lat1);
        const longitude1 = parseFloat(lon1);
        const latitude2 = parseFloat(lat2);
        const longitude2 = parseFloat(lon2);

        // Calculate distance using Haversine formula
        const distance = await commonUtils.calculateDistance(
            latitude1,
            longitude1,
            latitude2,
            longitude2
        );

        // Return distance as response
        res.status(200).json({ type: "Success", distance: distance });
    } catch (error) {
        console.error(`Error occurred while finding distance: ${error}`);
        res.status(500).json({
            type: "Error",
            message: "Internal server error.",
        });
    }
};

module.exports.loginHandler = async (req, res) => {
    try {
        // Fetch email, password, and roles from request body
        const { email, password } = req.body;

        // Check if email, password, and roles are provided
        if (!email || !password) {
            return res.status(400).json({
                type: "Error",
                message: "Email, password, and roles are required.",
            });
        }

        // Find user by email, password, and role in the database
        const user = await dbUtils.findOne(
            { email: email, password: password },
            DATABASE_COLLECTIONS.USERS
        );

        // If user doesn't exist or password doesn't match, return error message
        if (!user) {
            return res.status(400).json({
                type: "Error",
                message: "Invalid email, password, or role.",
            });
        }

        // Generate JWT token for the user including additional properties
        const tokenData = {
            id: user._id,
            email: user.email,
            roles: user.roles,
            username: user.username,
        };
        const token = jwtService.generateToken(tokenData);

        // Send Success response with token
        res.status(200).json({ type: "Success", token: token });
    } catch (error) {
        console.error(`[loginHandler] Error occurred: ${error}`);
        res.status(400).json({ type: "Error", message: error.message });
    }
};

module.exports.googleHandler = async (req, res) => {
    try {
        console.log(`Google profile - ${JSON.stringify(req.user)}`);
        const password = req.user.id;
        const email = req.user.emails[0].value;
        const username = req.query.username;
        const firstName = req.user.name.givenName;
        const lastName = req.user.name.familyName;

        console.log("user name ", req?.query);

        const profileImgUrl = req.user.photos[0].value;

        let user = await dbUtils.findOne(
            { email: email },
            DATABASE_COLLECTIONS.USERS
        );

        console.log("usre data ", user);
        if (user) {
            // User already exists, provide him accessToken directly
            const tokenData = {
                id: user._id,
                email: user.email,
                roles: user.roles,
                username: user.username,
            };
            const accessToken = jwtService.generateToken(tokenData);
            res.cookie("accessToken", accessToken, { httpOnly: true });
            // Respond with user data and token
            res.redirect(
                `${process.env.GOOGLE_UI_SUCCESS_REDIRECT_URL}/${accessToken}`
            );
        } else {
            // Register user first
            user = await dbUtils.create(
                {
                    email,
                    password,
                    firstName,
                    lastName,
                    profileImgUrl,
                    username,
                },
                DATABASE_COLLECTIONS.USERS
            );

            const tokenData = {
                id: user._id,
                email: user.email,
                roles: user.roles,
                username: user.username,
            };
            const accessToken = jwtService.generateToken(tokenData);

            res.cookie("accessToken", accessToken, { httpOnly: true });
            // Respond with user data and token
            res.redirect(
                `${process.env.GOOGLE_UI_SUCCESS_REDIRECT_URL}/${accessToken}`
            );
        }
    } catch (error) {
        console.log(`[googleHandler] Error occurred: ${error}`);
        res.redirect(`${process.env.GOOGLE_UI_FAILURE_REDIRECT_URL}`);
    }
};
