const express = require("express");
const axios = require('axios');
const router = express.Router();
const auth = require("../controllers/authorization/authorization_handlers");
const JwtService = require("../services/jwt");

const passport = require("../utils/google_stratergy");

const multer = require('multer');  
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },  
});


// Define routes
router.post("/register", upload.single('profileImg') , auth.registerHandler);
router.post("/otp" , auth.verifyOtpController);
router.post("/login" , auth.loginHandler);
router.get("/profile" , JwtService.validateJwt , auth.getProfileController);
router.put("/profile" , upload.single('profileImg') , JwtService.validateJwt , auth.updateProfileHandler);

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

router.get("/location" , auth.locationGet);


module.exports = router;
