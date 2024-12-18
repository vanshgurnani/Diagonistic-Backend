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
            { property: "roles", optional: true },
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

        const email = req.decodedToken.email;
        const status = req?.query?.status;

        console.log(email);

        // Fetch user profile from the database using the user ID
        const userProfile = await dbUtils.findOne(
            {email : email},
            DATABASE_COLLECTIONS.USERS
        );

        const pipeline = [
            {
                $match: {
                    patientEmail: email,
                    ...(status && { status })
                }
            },
            {
                $sort: {
                    createdAt: -1
                }
            },
            {
                $lookup: {
                    from: 'payments', // Replace with your payment collection name
                    localField: 'paymentId',
                    foreignField: 'razorpay_payment_id',
                    as: 'paymentDetails'
                }
            },
            {
                $lookup: {
                    from: 'centers', // Replace with your payment collection name
                    localField: 'centerEmail',
                    foreignField: 'email',
                    pipeline: [{
                        $project: {
                            _id: 0,
                            centerName: 1,
                            centerImg: 1,
                            address: 1
                        }
                    }],
                    as: 'centers'
                }
            },
            {
                $addFields: {
                    bookingId: {$toObjectId: "$bookingId"}
                }
            },
            {
                $lookup: {
                    from: 'bookings',
                    localField: 'bookingId',
                    foreignField: '_id',
                    as: 'bookings'
                }
            },
        ]

        const userTest = await dbUtils.aggregate(pipeline, DATABASE_COLLECTIONS.ORDERED_TEST);

        // Check if user profile exists
        if (!userProfile) {
            
            const centerProfile = await dbUtils.findOne(
                {email: email},
                DATABASE_COLLECTIONS.CENTER
            );

            return res.status(200).json({ type: "Success", centerProfile });

        }

        // Return user profile in the response
        return res.status(200).json({ type: "Success", userProfile, userTest });
    } catch (error) {
        console.error(`[getProfileController] Error occurred: ${error}`);
        res.status(500).json({
            type: "Error",
            message: "Failed to fetch user profile.",
        });
    }
};

const handleFileUpload = async (file, userId, fieldName) => {
    if (!file) return null;

    const fileName = `${userId}-${fieldName}.${file.originalname.split(".").pop()}`;
    const imageUrl = await s3Utils.uploadFileToS3(file, fileName, process.env.AWS_BUCKET_NAME);
    
    return imageUrl.Location;
};


module.exports.updateProfileHandler = async (req, res) => {
    try {
        // Extract userId from decoded token
        const userId = req.decodedToken.id;
        
        // Fetch updated profile data from request body
        let updatedProfileData = req.body;

        const files = req.files || {};

        const fileFields = [
            'addressProof',
            'shopAct',
            'pcpndt',
            'iso',
            'nabl',
            'nabh',
            'centerImg',
            'profileImgUrl',
        ];

        // Check if a file is uploaded
        for (let field of fileFields) {
            if (files[field] && files[field].length > 0) {
                const file = files[field][0]; // Since you only allow 1 file per field, we'll take the first file
                const imageUrl = await handleFileUpload(file, userId, field);
                if (imageUrl) {
                    updatedProfileData[field] = imageUrl; // Update the field with the image URL directly
                }
            }
        }

        // Check if the userId belongs to a user or a center
        let collectionToUpdate;
        let profile;

        // First, try to find the user in the USERS collection
        profile = await dbUtils.findOne({ _id: userId }, DATABASE_COLLECTIONS.USERS);
        if (profile) {
            collectionToUpdate = DATABASE_COLLECTIONS.USERS;
        } else {
            // If not found in USERS, try to find the profile in the CENTERS collection
            profile = await dbUtils.findOne({ _id: userId }, DATABASE_COLLECTIONS.CENTER);
            if (profile) {
                collectionToUpdate = DATABASE_COLLECTIONS.CENTER;
            }
        }

        // If the profile is not found in either collection, return an error
        if (!profile) {
            return res.status(404).json({
                type: "Error",
                error: "User or Center profile not found.",
            });
        }

        // Update the profile in the respective collection
        const updatedProfile = await dbUtils.updateOne(
            { _id: userId },
            updatedProfileData,
            collectionToUpdate
        );

        // Respond with success message
        res.status(200).json({
            type: "Success",
            message: "Profile updated successfully.",
            data: updatedProfileData,
        });

    } catch (error) {
        console.error(`Error occurred while updating profile: ${error}`);
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
                firstname: user.firstName,
                lastname: user.lastName,
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
                firstname: user.firstName,
                lastname: user.lastName,
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
        const emailSubject = "DiagnoWeb Update Password";
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

        // Prepare the file object to be passed to the upload function
        const file = {
            buffer: files.profileImgUrl[0].buffer,
            mimetype: files.profileImgUrl[0].mimetype
        };

        // Call the upload function
        const uploadResult = await s3Utils.uploadFileToS3(file, fileKey, process.env.AWS_BUCKET_NAME);
        uploadedImages.profileImgUrl = uploadResult.Location;
    }

    return uploadedImages;
}


module.exports.getAllUsers = async (req, res) => {
    try {

        const projection = {password : 0};

        const users = await dbUtils.findMany({ roles: configs.CONSTANTS.ROLES.PATIENT }, DATABASE_COLLECTIONS.USERS , projection);

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


module.exports.deleteAccount = async (req, res) => {
    try {
        // Extract email from authenticated user's token
        const email = req.decodedToken?.email;

        if (!email) {
            return res.status(401).json({
                error: "Unauthorized. No email found in token.",
            });
        }

        // Check if the user exists
        const user = await dbUtils.findOne({ email }, DATABASE_COLLECTIONS.USERS);

        if (!user) {
            return res.status(404).json({
                error: `No account found for the email: ${email}`,
            });
        }

        // Delete the user's account
        const deletedUser = await dbUtils.deleteOne({ email }, DATABASE_COLLECTIONS.USERS);

        if (!deletedUser?.deletedCount) {
            return res.status(500).json({
                error: "Failed to delete the account. Please try again.",
            });
        }

        await dbUtils.deleteMany(
            {email: email},
            DATABASE_COLLECTIONS.TEST
        );

        await dbUtils.deleteMany(
            {centerEmail: email},
            DATABASE_COLLECTIONS.ORDERED_TEST
        );

        await dbUtils.deleteMany(
            {email: email},
            DATABASE_COLLECTIONS.CENTER
        );

        await dbUtils.deleteMany(
            {centerEmail: email},
            DATABASE_COLLECTIONS.BOOKING
        );


        return res.status(200).json({
            message: `Account with email ${email} has been successfully deleted.`,
        });
    } catch (error) {
        console.error(`[deleteAccount] Error occurred: ${error.message}`);
        return res.status(500).json({
            error: "An error occurred while trying to delete the account.",
        });
    }
};
