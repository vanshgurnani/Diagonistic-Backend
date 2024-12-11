const express = require("express");
const axios = require("axios");
const router = express.Router();
const auth = require("../controllers/authorization/authorization_handlers");
const JwtService = require("../services/jwt");
const path = require("path");
const passport = require("../utils/google_stratergy");

const multer = require('multer');
const upload = multer({
    storage: multer.memoryStorage()
});

const uploadFields = upload.fields([
    { name: 'addressProof', maxCount: 1 },
    { name: 'shopAct', maxCount: 1 },
    { name: 'pcpndt', maxCount: 1 },
    { name: 'iso', maxCount: 1 },
    { name: 'nabl', maxCount: 1 },
    { name: 'nabh', maxCount: 1 },
    { name: 'centerImg', maxCount: 1 },
    { name: 'profileImgUrl', maxCount: 1 }

]);

// const upload = multer({
//     storage: storage,
//     fileFilter: (req, file, cb) => {
//         const allowedFileTypes = /jpeg|jpg|png|webp/;
//         const extname = allowedFileTypes.test(
//             path.extname(file.originalname).toLowerCase()
//         );
//         const mimetype = allowedFileTypes.test(file.mimetype);
//         if (mimetype && extname) {
//             return cb(null, true);
//         } else {
//             cb(
//                 new Error(
//                     "Invalid file type. Only JPEG, JPG, and PNG files are allowed."
//                 )
//             );
//         }
//     },
// });

// Define routes
router.post("/login", auth.loginHandler);
router.post(
    "/register",
    upload.fields([{ name: "profileImgUrl", maxCount: 1 }]),
    auth.registerHandler
);
router.post("/send-otp", auth.sendOtp);

router.get("/profile", JwtService.validateJwt, auth.getProfileController);
router.put(
    "/profile",
    uploadFields,
    JwtService.validateJwt,
    auth.updateProfileHandler
);

router.get(
    "/google",
    passport.authenticate("google", { scope: ["profile", "email"] })
);
router.get(
    "/google/callback",
    passport.authenticate("google", {
        failureRedirect: process.env.GOOGLE_UI_FAILURE_REDIRECT_URL,
    }),
    auth.googleHandler
);

router.get("/location", auth.locationGet);
router.post("/forgot-password", auth.resetPassword);
router.post("/forgot-password-token", auth.createResetPasswordToken);
router.get("/all" , auth.getAllUsers);

router.delete("/delete", JwtService.validateJwt, auth.deleteAccount);


module.exports = router;
