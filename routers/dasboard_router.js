const express = require("express");
const router = express.Router();
const dashboardHandler = require("../controllers/dashboard_handler");

router.post("/get-location", dashboardHandler.suggestLocation);

router.get("/", dashboardHandler.dashboardGet);
router.get("/top", dashboardHandler.getTopCenters);



module.exports = router;
