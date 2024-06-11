const jwtService = require("../../services/jwt");
const axios = require("axios");
const dbUtils = require("../../utils/db_operations");
const commonUtils = require("../../utils/common");
const configs = require("../../configs.json");
const s3Utils = require("../../utils/s3");
const emailService = require("../../services/email_service");
const DATABASE_COLLECTIONS = configs.CONSTANTS.DATABASE_COLLECTIONS;
const crypto = require("crypto");

module.exports.sendOtp = async (req, res) => {
    try {
        let requiredFields = [{ property: "email", optional: true }];
        const { email } = await commonUtils.validateRequestBody(
            req.body,
            requiredFields
        );

        const user = await dbUtils.findOne(
            { email: email },
            DATABASE_COLLECTIONS.USERS,
            undefined
        );

        if (user) {
            return res.status(403).json({
                error: `${req.body.email} is already registered.`,
                message: `${req.body.email} is already registered.`,
            });
        }

        // generate otp
        const otpNumber = commonUtils.generateRandomOtp(configs.OTP_LENGTH);

        const newOtp = await dbUtils.create(
            {
                email: email,
                otp: otpNumber,
            },
            DATABASE_COLLECTIONS.OTPS
        );

        res.status(200).json({
            message: `OTP sent successfully for - ${email}`,
        });
    } catch (error) {
        res.status(400).json({
            error: `${error.message}`,
        });
    }
};

module.exports.loginHandler = async (req, res) => {
    try {
        let requiredFields = [
            { property: "email", optional: true },
            { property: "password", optional: true },
        ];

        const { password, email } = await commonUtils.validateRequestBody(
            req.body,
            requiredFields
        );

        const user = await dbUtils.findOne(
            { email: req.body.email },
            DATABASE_COLLECTIONS.USERS,
            undefined,
            `Email ${req.body.email} is not registered.`
        );

        console.log("login user data ", user);

        let accessToken = null;
        if (password === user?.password) {
            accessToken = jwtService.generateToken({
                email: user.email,
                id: user._id,
                firstname: user.firstName,
                lastname : user.lastName,
                phonenumber : user.phoneNumber
            });

            res.status(200).json({
                message: "Login Successfully!",
                accessToken: accessToken,
            });
        } else {
            res.status(403).json({
                error: "Invalid password.",
            });
        }
    } catch (error) {
        console.log(`[loginHandler] Error occurred: ${error}`);
        res.status(500).json({
            error: error.message,
        });
    }
};

module.exports.registerHandler = async (req, res) => {
    try {
        console.log("req files ", req.files);
        const user = await dbUtils.findOne(
            { email: req.body.email },
            DATABASE_COLLECTIONS.USERS
        );

        let requiredFields = [
            { property: "email", optional: true },
            { property: "password", optional: true },
            { property: "firstName", optional: true },
            { property: "lastName", optional: true },
            { property: "otp", optional: true },
        ];

        const newObj = await commonUtils.validateRequestBody(
            req.body,
            requiredFields
        );

        // Email verification code
        const pipline = [
            {
                $match: {
                    email: newObj.email,
                },
            },
            {
                $sort: { createdAt: -1 },
            },
            {
                $limit: 1,
            },
        ];

        const checkOtp = await dbUtils.aggregate(
            pipline,
            DATABASE_COLLECTIONS.OTPS
        );

        if (!checkOtp?.length) {
            return res.status(408).json({
                error: ` Otp is expired .`,
                message: "Otp expired",
            });
        }
        if (checkOtp[0]?.otp !== newObj.otp) {
            return res.status(403).json({
                error: `Otp not matched`,
                message: "Otp not matched",
            });
        }

        if (user) {
            return res.status(403).json({
                error: `${req.body.email} is already registered.`,
            });
        } else {
            const images = await uploadImages(req.files, req.body.email);
            console.log("uploaded imgaes", images);

            // Todo
            // const hashedPassword = await bcrypt.hash(newObj.password, 10);

            const newUser = await dbUtils.create(
                { ...newObj, ...images },
                DATABASE_COLLECTIONS.USERS
            );

            console.log("user", newUser);
            const accessToken = jwtService.generateToken(
                newObj?.email,
                newUser?._id,
                newUser?.firstName,
                newUser?.lastName,
                newUser?.phoneNumber
            );

            console.log(`New user - ${JSON.stringify(newUser)}`);

            return res.status(200).json({
                message: `user created successfully with email - ${req.body.email}`,
                accessToken: accessToken,
                email: newUser?.email,
            });
        }
    } catch (error) {
        console.log(`[register] Error occured : ${error}`);
        if (error.message.includes("username_1 dup key")) {
            error.message = `Username is already taken.`;
        }
        res.status(400).json({
            error: error.message,
        });
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

module.exports.createResetPasswordToken = async (req, res) => {
    try {
        let requiredFields = [{ property: "email", optional: true }];
        const { email } = await commonUtils.validateRequestBody(
            req.body,
            requiredFields
        );

        const user = await dbUtils.findOne(
            { email: req.body.email },
            DATABASE_COLLECTIONS.USERS,
            "User not registered"
        );

        // creating unique token
        const token = crypto.randomBytes(20).toString("hex");
        // await uuid();

        const addToken = await dbUtils.updateOne(
            { email: email },
            {
                resetPasswordToken: token,
                resetPasswordExpires: Date.now() + 60 * 1000,
            },
            DATABASE_COLLECTIONS.USERS
        );

        const url = `${process.env.FRONTEND_URL}/update-password/${token}`;
        const html = commonUtils.passwordResetEmailTemplate(url);
        const emailSubject = "Portfolioo Update Password";
        const emailText = null;

        await emailService.sendMail(email, emailSubject, emailText, html);

        return res.status(200).json({
            success: true,
            massage: "reset password token created",
        });
    } catch (error) {
        console.log(error);
        return res.status(400).json({
            success: false,
            massage: "Failed to reset password ",
        });
    }
};

module.exports.resetPassword = async (req, res) => {
    try {
        let requiredFields = [
            { property: "token", optional: true },
            { property: "password", optional: true },
            { property: "confirmPassword", optional: true },
        ];
        const { password, token, confirmPassword } =
            await commonUtils.validateRequestBody(req.body, requiredFields);

        const user = await dbUtils.findOne(
            { resetPasswordToken: token },
            DATABASE_COLLECTIONS.USERS
        );

        console.log("user ", user);
        // check date is expired or not
        if (new Date(user.resetPasswordExpires) < Date.now()) {
            return res.status(408).json({
                success: false,
                massage: "Token is expired. Regenerate ",
            });
        }

        if (password !== confirmPassword) {
            return res.status(413).json({
                success: false,
                massage: "Password not matched",
            });
        }

        await dbUtils?.updateOne(
            { resetPasswordToken: token },
            { password: password },
            DATABASE_COLLECTIONS.USERS
        );

        // send response
        return res.status(200).json({
            success: true,
            massage: "password reset",
        });
    } catch (error) {
        console.log(error);
        return res.status(413).json({
            success: false,
            massage: "Token not matched",
        });
    }
};

async function uploadImages(files, email) {
    const uploadedImages = {};

    if (files && files.profileImgUrl) {
        const fileKey = `${email}-profile.jpeg`;
        const params = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: fileKey,
            Body: files.profileImgUrl[0].buffer,
            ContentType: files.profileImgUrl[0].mimetype,
        };
        const uploadResult = await s3Utils.uploadFileToS3(params);
        uploadedImages.profileImgUrl = uploadResult.Location;
    }

    return uploadedImages;
}

module.exports.getAllUsers = async (req, res) => {
    try {
<<<<<<< HEAD

        const projection = {password : 0};

        const users = await dbUtils.findMany({ roles: configs.CONSTANTS.ROLES.PATIENT }, DATABASE_COLLECTIONS.USERS , projection);
=======
        const users = await dbUtils.findMany({ roles: configs.CONSTANTS.ROLES.PATIENT }, DATABASE_COLLECTIONS.USERS);
>>>>>>> main

        if (users.length === 0) {
            return res.status(404).json({
                type: "Error",
                message: "No users found.",
            });
        }

        res.status(200).json({
            type: "Success",
            users: users,
        });
    } catch (error) {
        console.error(`[getAllUsers] Error occurred: ${error}`);
        res.status(500).json({
            type: "Error",
            message: "Internal server error.",
        });
    }
};

