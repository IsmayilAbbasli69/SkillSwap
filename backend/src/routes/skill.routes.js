const express = require("express");
const skillController = require("../controllers/skill.controller");

const router = express.Router();

router.get("/", skillController.listSkills);

module.exports = router;
