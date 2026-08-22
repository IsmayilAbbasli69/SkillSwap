const profileRepository = require("../repositories/profile.repository");
const skillRepository = require("../repositories/skill.repository");
const adminRepository = require("../repositories/admin.repository");
const { buildPagination, paginateArray } = require("../utils/pagination");
const { ensureEnum, ensureUuid } = require("../utils/validators");
const HttpError = require("../utils/http-error");

const listStudents = async ({ currentUser, query }) => {
  if (query.status) {
    ensureEnum(query.status, "status", ["ACTIVE", "DISABLED"]);
  }

  const rows = await profileRepository.findByInstitution({
    institutionId: currentUser.institutionId,
    role: "STUDENT",
    status: query.status,
    search: query.search
  });

  const paging = buildPagination({ page: query.page, limit: query.limit, maxLimit: 50 });
  const shaped = rows.map(profile => ({
    id: profile.id,
    name: `${profile.first_name} ${profile.last_name}`,
    unit: profile.unit_id,
    status: profile.status
  }));

  return paginateArray({ items: shaped, page: paging.page, limit: paging.limit });
};

const updateStudentStatus = async ({ currentUser, studentId, status }) => {
  ensureUuid(studentId, "id");
  ensureEnum(status, "status", ["ACTIVE", "DISABLED"]);

  const student = await profileRepository.findById(studentId);
  if (!student || student.role !== "STUDENT") {
    throw new HttpError(404, "RESOURCE_NOT_FOUND", "Student not found");
  }

  if (student.institution_id !== currentUser.institutionId) {
    throw new HttpError(403, "FORBIDDEN", "Cannot manage another institution's student");
  }

  const updated = await profileRepository.updateById(studentId, { status });
  return {
    id: updated.id,
    status: updated.status
  };
};

const createSkill = async ({ currentUser, payload }) => {
  if (!payload.name || payload.name.trim().length < 2) {
    throw new HttpError(422, "VALIDATION_ERROR", "name is required and must be at least 2 chars");
  }

  const row = await skillRepository.createInstitutionSkill({
    institutionId: currentUser.institutionId,
    name: payload.name.trim(),
    category: payload.category ? payload.category.trim() : null
  });

  return {
    id: row.id,
    name: row.name,
    category: row.category,
    status: row.status
  };
};

const updateSkill = async ({ currentUser, skillId, payload }) => {
  ensureUuid(skillId, "id");
  const skill = await skillRepository.findSkillById(skillId);
  if (!skill || skill.status !== "ACTIVE") {
    throw new HttpError(404, "RESOURCE_NOT_FOUND", "Skill not found");
  }

  if (skill.institution_id && skill.institution_id !== currentUser.institutionId) {
    throw new HttpError(403, "FORBIDDEN", "Skill belongs to another institution");
  }

  const updates = {};
  if (payload.name !== undefined) {
    updates.name = payload.name.trim();
  }
  if (payload.category !== undefined) {
    updates.category = payload.category ? payload.category.trim() : null;
  }

  const updated = await skillRepository.updateSkillById(skillId, updates);
  return {
    id: updated.id,
    name: updated.name,
    category: updated.category,
    status: updated.status
  };
};

const disableSkill = async ({ currentUser, skillId }) => {
  ensureUuid(skillId, "id");
  const skill = await skillRepository.findSkillById(skillId);
  if (!skill) {
    throw new HttpError(404, "RESOURCE_NOT_FOUND", "Skill not found");
  }

  if (skill.institution_id && skill.institution_id !== currentUser.institutionId) {
    throw new HttpError(403, "FORBIDDEN", "Skill belongs to another institution");
  }

  const updated = await skillRepository.updateSkillById(skillId, { status: "INACTIVE" });
  return {
    id: updated.id,
    status: updated.status
  };
};

const getStats = async currentUser => {
  const students = await profileRepository.findByInstitution({
    institutionId: currentUser.institutionId,
    role: "STUDENT"
  });

  const requestStats = await adminRepository.getRequestStats(currentUser.institutionId);
  const sessionStats = await adminRepository.getSessionStats(currentUser.institutionId);
  const topWantedSkills = await adminRepository.getSkillDemandStats({
    institutionId: currentUser.institutionId,
    type: "WANT"
  });
  const topOfferedSkills = await adminRepository.getSkillDemandStats({
    institutionId: currentUser.institutionId,
    type: "OFFER"
  });

  return {
    students: {
      total: students.length,
      active: students.filter(student => student.status === "ACTIVE").length
    },
    requests: requestStats,
    sessions: sessionStats,
    topWantedSkills,
    topOfferedSkills
  };
};

module.exports = {
  listStudents,
  updateStudentStatus,
  createSkill,
  updateSkill,
  disableSkill,
  getStats
};
