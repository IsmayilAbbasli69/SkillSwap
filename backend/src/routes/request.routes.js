const express = require("express");
const requestController = require("../controllers/request.controller");
const sessionController = require("../controllers/session.controller");

const router = express.Router();

router.get("/", requestController.list);
router.post("/", requestController.create);
router.patch("/:id", requestController.patchStatus);
router.post("/:requestId/session", sessionController.createForRequest);

module.exports = router;
