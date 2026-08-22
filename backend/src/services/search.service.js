const profileRepository = require("../repositories/profile.repository");
const skillRepository = require("../repositories/skill.repository");
const matchingService = require("./matching.service");
const { paginateArray, buildPagination } = require("../utils/pagination");
const { ensureUuid, ensureEnum } = require("../utils/validators");
const HttpError = require("../utils/http-error");

const searchStudents = async ({ currentUser, skillId, unitId, level, page, limit }) => {
  ensureUuid(skillId, "skillId");
  if (unitId) {
    ensureUuid(unitId, "unitId");
  }
  if (level) {
    ensureEnum(level, "level", ["BEGINNER", "INTERMEDIATE", "ADVANCED"]);
  }

  const skill = await skillRepository.findSkillById(skillId);
  if (!skill || skill.status !== "ACTIVE") {
    throw new HttpError(404, "RESOURCE_NOT_FOUND", "Skill not found");
  }

  const candidates = await profileRepository.findSkillCandidates({
    institutionId: currentUser.institutionId,
    currentUserId: currentUser.id,
    skillId,
    unitId,
    level
  });

  const mySkills = await skillRepository.listUserSkills(currentUser.id);
  const myOfferedSkillIds = mySkills
    .filter(userSkill => userSkill.type === "OFFER")
    .map(userSkill => userSkill.skill_id);

  const ranked = candidates
    .map(candidate => {
      const reciprocal = candidate.wants.some(userSkill =>
        myOfferedSkillIds.includes(userSkill.skill_id)
      );

      const match = matchingService.calculateMatchScore(currentUser, candidate, {
        reciprocal,
        requestedLevel: level || null
      });

      return {
        profile: {
          id: candidate.profile.id,
          name: `${candidate.profile.first_name} ${candidate.profile.last_name}`,
          bio: candidate.profile.bio,
          department: candidate.profile.department,
          unit: {
            id: candidate.profile.unit_id,
            name: null
          }
        },
        skill: {
          id: skill.id,
          name: skill.name,
          level: candidate.offeredSkill.level
        },
        match
      };
    })
    .sort((a, b) => b.match.score - a.match.score);

  const paging = buildPagination({ page, limit, maxLimit: 50 });
  return paginateArray({ items: ranked, page: paging.page, limit: paging.limit });
};

module.exports = {
  searchStudents
};
