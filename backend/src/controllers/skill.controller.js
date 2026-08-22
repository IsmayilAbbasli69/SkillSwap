const skillService = require("../services/skill.service");

const listSkills = async (req, res, next) => {
  try {
    const data = await skillService.listSkills({
      institutionId: req.user.institutionId,
      search: req.query.search,
      category: req.query.category
    });
    res.status(200).json({ data });
  } catch (error) {
    next(error);
  }
};

const addMySkill = async (req, res, next) => {
  try {
    const data = await skillService.addMySkill({
      userId: req.user.id,
      institutionId: req.user.institutionId,
      payload: req.body || {}
    });
    res.status(201).json({ data });
  } catch (error) {
    next(error);
  }
};

const removeMySkill = async (req, res, next) => {
  try {
    await skillService.removeMySkill({
      userId: req.user.id,
      userSkillId: req.params.userSkillId
    });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listSkills,
  addMySkill,
  removeMySkill
};
