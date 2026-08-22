const express = require("express");
const profileController = require("../controllers/profile.controller");
const skillController = require("../controllers/skill.controller");

const router = express.Router();

router.get("/me", profileController.getMe);
router.patch("/me", profileController.patchMe);
router.post("/me/skills", skillController.addMySkill);
router.delete("/me/skills/:userSkillId", skillController.removeMySkill);

module.exports = router;
