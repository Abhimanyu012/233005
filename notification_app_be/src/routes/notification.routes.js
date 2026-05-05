const express = require("express");
const {
  getNotifications,
  getPriorityNotifications,
} = require("../controllers/notification.controller");
const { attachAuthHeaders } = require("../middleware/auth.middleware");

const router = express.Router();

router.get("/notifications", attachAuthHeaders, getNotifications);
router.get("/notifications/priority", attachAuthHeaders, getPriorityNotifications);

module.exports = router;