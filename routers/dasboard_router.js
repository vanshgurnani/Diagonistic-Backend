const express = require("express");
const router = express.Router();
const dashboardHandler = require("../controllers/dashboard_handler");

router.post("/get-location", dashboardHandler.suggestLocation);

router.get("/", dashboardHandler.dashboardGet);
router.get("/top", dashboardHandler.getTopCenters);

router.get("/daily", dashboardHandler.getDailyRevenueAndCommission);


router.get("/monthly", dashboardHandler.getMonthlyCommissionOverall);



module.exports = router;
