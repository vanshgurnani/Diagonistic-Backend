const express = require("express");
const router = express.Router();
const JwtService = require("../services/jwt");
const Book = require('../controllers/booking_handler');
const multer = require('multer');

// Define a custom file filter function
// const fileFilter = (req, file, cb) => {
//     // Check if the uploaded file is a PDF or DOC file
//     if (file.mimetype === 'application/pdf' || 
//         file.mimetype === 'application/msword' || 
//         file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
//         // Accept the file
//         cb(null, true);
//     } else {
//         // Reject the file
//         cb(new Error('Only PDF and DOC files are allowed!'), false);
//     }
// };

// Configure multer with the custom file filter and memory storage
const upload = multer({
    storage: multer.memoryStorage()
});

router.post('/', JwtService.validateJwt, Book.createBooking);
router.get('/', JwtService.validateJwt , Book.getBooking);
router.put('/', upload.fields([{ name: 'files', maxCount: 5 }]) , Book.updateBooking);
router.delete('/', JwtService.validateJwt, Book.deleteBooking);

router.post('/upload', JwtService.validateJwt, upload.fields([{ name: 'files', maxCount: 5 }]), Book.uploadFilesAndUpdateBooking);

router.post('/cancel', JwtService.validateJwt, Book.cancelBooking);
router.get('/cancel', JwtService.validateJwt, Book.getCancel);



module.exports = router;
