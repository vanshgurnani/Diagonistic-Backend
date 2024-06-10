const express = require("express");
const router = express.Router();
const JwtService = require("../services/jwt");
const Center = require('../controllers/center_handler');
const multer = require('multer');

// Define a custom file filter function
const fileFilter = (req, file, cb) => {
    // Check if the uploaded file is a PDF or DOC file
    if (file.mimetype === 'application/pdf' || 
        file.mimetype === 'application/msword' || 
        file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        // Accept the file
        cb(null, true);
    } else {
        // Reject the file
        cb(new Error('Only PDF and DOC files are allowed!'), false);
    }
};

// Configure multer with the custom file filter and memory storage
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB file size limit
    fileFilter: fileFilter
});

const uploadFields = upload.fields([
    { name: 'addressProof', maxCount: 1 },
    { name: 'shopAct', maxCount: 1 },
    { name: 'pcpndt', maxCount: 1 },
    { name: 'iso', maxCount: 1 },
    { name: 'nabl', maxCount: 1 },
    { name: 'nabh', maxCount: 1 }
]);

router.post('/', uploadFields , Center.createCenter);
router.get('/', Center.getCenter);

module.exports = router;