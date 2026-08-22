const skillRepository = require("../repositories/skill.repository");
const HttpError = require("../utils/http-error");
const { ensureEnum, ensureUuid } = require("../utils/validators");

const listSkills = async ({ institutionId, search, category }) => {
  const rows = await skillRepository.listVisibleSkills({ institutionId, search, category });
  return rows.map(skill => ({
    id: skill.id,
    name: skill.name,
    category: skill.category
  }));
};

const addMySkill = async ({ userId, institutionId, payload }) => {
  ensureUuid(payload.skillId, "skillId");
  ensureEnum(payload.type, "type", ["OFFER", "WANT"]);
  ensureEnum(payload.level, "level", ["BEGINNER", "INTERMEDIATE", "ADVANCED"]);

  const skill = await skillRepository.findSkillById(payload.skillId);
  if (!skill || skill.status !== "ACTIVE") {
    throw new HttpError(404, "RESOURCE_NOT_FOUND", "Skill not found");
  }

  if (skill.institution_id && skill.institution_id !== institutionId) {
    throw new HttpError(403, "FORBIDDEN", "Skill is not available for this institution");
  }

  const existing = await skillRepository.listUserSkills(userId);
  const duplicate = existing.find(
    row => row.skill_id === payload.skillId && row.type === payload.type
  );

  if (duplicate) {
    throw new HttpError(409, "CONFLICT", "User already has this skill/type pair");
  }

  const row = await skillRepository.createUserSkill({
    userId,
    skillId: payload.skillId,
    type: payload.type,
    level: payload.level
  });

  return {
    id: row.id,
    skillId: row.skill_id,
    type: row.type,
    level: row.level
  };
};

const removeMySkill = async ({ userId, userSkillId }) => {
  ensureUuid(userSkillId, "userSkillId");
  const row = await skillRepository.findUserSkillById(userSkillId);
  if (!row) {
    throw new HttpError(404, "RESOURCE_NOT_FOUND", "User skill not found");
  }

  if (row.user_id !== userId) {
    throw new HttpError(403, "FORBIDDEN", "Cannot remove another user's skill");
  }

  await skillRepository.deleteUserSkillById(userSkillId);
};

module.exports = {
  listSkills,
  addMySkill,
  removeMySkill
};
