const express = require("express");
const router = express.Router();
const dashboardHandler = require("../controllers/dashboard_handler");

router.post("/get-location", dashboardHandler.suggestLocation);

module.exports = router;
