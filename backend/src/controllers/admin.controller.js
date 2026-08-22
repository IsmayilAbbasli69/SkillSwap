const adminService = require("../services/admin.service");

const listStudents = async (req, res, next) => {
  try {
    const result = await adminService.listStudents({
      currentUser: req.user,
      query: req.query
    });
    res.status(200).json({ data: result.data, meta: result.meta });
  } catch (error) {
    next(error);
  }
};

const patchStudentStatus = async (req, res, next) => {
  try {
    const data = await adminService.updateStudentStatus({
      currentUser: req.user,
      studentId: req.params.id,
      status: req.body.status
    });
    res.status(200).json({ data });
  } catch (error) {
    next(error);
  }
};

const createSkill = async (req, res, next) => {
  try {
    const data = await adminService.createSkill({
      currentUser: req.user,
      payload: req.body || {}
    });
    res.status(201).json({ data });
  } catch (error) {
    next(error);
  }
};

const updateSkill = async (req, res, next) => {
  try {
    const data = await adminService.updateSkill({
      currentUser: req.user,
      skillId: req.params.id,
      payload: req.body || {}
    });
    res.status(200).json({ data });
  } catch (error) {
    next(error);
  }
};

const deleteSkill = async (req, res, next) => {
  try {
    const data = await adminService.disableSkill({
      currentUser: req.user,
      skillId: req.params.id
    });
    res.status(200).json({ data });
  } catch (error) {
    next(error);
  }
};

const getStats = async (req, res, next) => {
  try {
    const data = await adminService.getStats(req.user);
    res.status(200).json({ data });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listStudents,
  patchStudentStatus,
  createSkill,
  updateSkill,
  deleteSkill,
  getStats
};
