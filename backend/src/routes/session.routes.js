const express = require("express");
const sessionController = require("../controllers/session.controller");

const router = express.Router();

router.get("/", sessionController.list);
router.patch("/:id", sessionController.patchStatus);
router.post("/:sessionId/review", sessionController.createReview);

module.exports = router;
