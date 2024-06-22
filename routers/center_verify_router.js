const express = require("express");
const router = express.Router();
const centerVerify = require('../controllers/center_verify_handler');
const multer = require('multer');

// Define a custom file filter function
const fileFilter = (req, file, cb) => {
    // Check if the uploaded file is a PDF, DOC, JPEG, or PNG file
    if (file.mimetype === 'application/pdf' || 
        file.mimetype === 'application/msword' || 
        file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        file.mimetype === 'image/jpeg' ||
        file.mimetype === 'image/png') {
        // Accept the file
        cb(null, true);
    } else {
        // Reject the file
        cb(new Error('Only PDF, DOC, JPEG, and PNG files are allowed!'), false);
    }
};

// Configure multer with the custom file filter and memory storage
const upload = multer({
    storage: multer.memoryStorage(),
    fileFilter: fileFilter
});

const uploadFields = upload.fields([
    { name: 'addressProof', maxCount: 1 },
    { name: 'shopAct', maxCount: 1 },
    { name: 'pcpndt', maxCount: 1 },
    { name: 'iso', maxCount: 1 },
    { name: 'nabl', maxCount: 1 },
    { name: 'nabh', maxCount: 1 },
    { name: 'centerImg', maxCount: 1 },

]);

router.get('/', centerVerify.getCenterVerify);
router.put('/', uploadFields , centerVerify.updateCenter);



module.exports = router;