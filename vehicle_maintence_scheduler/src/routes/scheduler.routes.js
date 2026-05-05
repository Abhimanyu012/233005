const express = require("express");
const {
	getDepots,
	getVehicles,
	runSchedule,
} = require("../controllers/scheduler.controller");
const { attachAuthHeaders } = require("../middleware/auth.middleware");

const router = express.Router();

router.get("/scheduler/depots", attachAuthHeaders, getDepots);
router.get("/scheduler/vehicles", attachAuthHeaders, getVehicles);
router.get("/scheduler/run", attachAuthHeaders, runSchedule);

module.exports = router;