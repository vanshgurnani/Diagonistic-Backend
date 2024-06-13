const express = require("express");
const router = express.Router();
const JwtService = require("../services/jwt");
const Book = require('../controllers/booking_handler');
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

router.post('/', JwtService.validateJwt, Book.createBooking);
router.get('/', Book.getBooking);
router.put('/', Book.updateBooking);
router.delete('/', JwtService.validateJwt, Book.deleteBooking);

router.post('/upload', JwtService.validateJwt, upload.fields([{ name: 'files', maxCount: 5 }]), Book.uploadFilesAndUpdateBooking);

module.exports = router;
