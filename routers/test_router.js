const express = require("express");
const router = express.Router();
const TestController = require('../controllers/test_handler');

router.get('/' , TestController.getAllTest);

module.exports = router;