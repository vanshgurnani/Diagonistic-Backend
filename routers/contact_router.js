const express = require("express");
const router = express.Router();
const ContactController = require('../controllers/contact_handler');

router.post('/' , ContactController.createContact);

router.get('/' , ContactController.getContact);

module.exports = router;