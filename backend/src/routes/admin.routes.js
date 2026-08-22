const express = require("express");
const adminController = require("../controllers/admin.controller");
const requireRole = require("../middleware/role");

const router = express.Router();

router.use(requireRole("ADMIN"));

router.get("/students", adminController.listStudents);
router.patch("/students/:id/status", adminController.patchStudentStatus);
router.post("/skills", adminController.createSkill);
router.patch("/skills/:id", adminController.updateSkill);
router.delete("/skills/:id", adminController.deleteSkill);
router.get("/stats", adminController.getStats);

module.exports = router;
