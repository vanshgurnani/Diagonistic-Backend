const express = require("express");
const router = express.Router();
const TestController = require('../controllers/test_handler');

router.post('/' , TestController.createTest);

router.get('/' , TestController.getAllTest);

router.get('/:id' , TestController.getAllTest);

router.get('/:id' , TestController.getAllTest);

router.post('/bulk' , TestController.createBulkTests);

module.exports = router;