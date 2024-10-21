const express = require("express");
const router = express.Router();
const feature = require('../controllers/feature_handler');
const jwtService = require("../services/jwt");


// Routes
router.post('/query', jwtService.validateJwt, feature.createQuery);
router.get('/query', feature.getQuery);

router.get('/refund', feature.getCancel);

module.exports = router;
