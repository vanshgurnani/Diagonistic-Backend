const express = require("express");
const router = express.Router();
const centerVerify = require('../controllers/center_verify_handler');

router.get('/', centerVerify.getCenterVerify);



module.exports = router;