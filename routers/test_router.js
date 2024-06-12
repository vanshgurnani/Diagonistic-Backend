const express = require("express");
const router = express.Router();
const Test = require('../controllers/test_handler');
const multer = require('multer');
const jwtService = require("../services/jwt");

// Multer configuration
const fileFilter = (req, file, cb) => {
    if (
        file.mimetype === 'text/csv' ||
        file.mimetype === 'application/vnd.ms-excel' ||
        file.mimetype === 'application/octet-stream'
    ) {
        cb(null, true); // Accept the file
    } else {
        cb(new Error('Only CSV files are allowed!'), false); // Reject the file
    }
};

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB file size limit
    fileFilter: fileFilter
});

// Routes
router.post('/', jwtService.validateJwt, Test.createTest);
router.get('/', Test.getAllTest);
router.put('/', Test.updateTest);
router.delete('/', Test.deleteTest);

// Ensure jwt validation middleware runs before file upload middleware
router.post('/bulk', jwtService.validateJwt, upload.single('file'), Test.createBulkTests);

module.exports = router;
