const profileRepository = require("../repositories/profile.repository");
const adminRepository = require("../repositories/admin.repository");
const skillRepository = require("../repositories/skill.repository");
const sessionRepository = require("../repositories/session.repository");
const { getSupabaseClient } = require("../config/supabase");
const HttpError = require("../utils/http-error");

const buildSkillsArray = async userId => {
  const supabase = getSupabaseClient();
  const userSkills = await skillRepository.listUserSkills(userId);
  if (!userSkills || userSkills.length === 0) return [];

  const skillIds = userSkills.map(us => us.skill_id);
  const { data: skills } = await supabase.from("skills").select("id, name").in("id", skillIds);

  const skillMap = {};
  if (skills) skills.forEach(s => { skillMap[s.id] = s.name; });

  return userSkills.map(us => ({
    id: us.id,
    skillId: us.skill_id,
    name: skillMap[us.skill_id] || null,
    type: us.type,
    level: us.level
  }));
};

const toProfileResponse = async (profile, opts = {}) => {
  const institution = await adminRepository.getInstitutionById(profile.institution_id);
  const units = await adminRepository.listUnitsByInstitutionId(profile.institution_id);
  const unit = units.find(item => item.id === profile.unit_id) || null;

  const base = {
    id: profile.id,
    firstName: profile.first_name,
    lastName: profile.last_name,
    bio: profile.bio,
    department: profile.department,
    academicYear: profile.academic_year,
    avatarUrl: profile.avatar_url || null,
    role: profile.role,
    status: profile.status,
    institution: institution ? { id: institution.id, name: institution.name } : null,
    unit: unit ? { id: unit.id, name: unit.name } : null
  };

  if (opts.includeSkills) {
    base.skills = await buildSkillsArray(profile.id);
  }

  if (opts.includeStats) {
    const stats = await sessionRepository.getUserReviewStats(profile.id);
    base.averageRating = stats.averageRating;
    base.totalReviews = stats.totalReviews;
  }

  return base;
};

const getMyProfile = async userId => {
  const profile = await profileRepository.findById(userId);
  if (!profile) {
    throw new HttpError(404, "RESOURCE_NOT_FOUND", "Profile not found");
  }

  return toProfileResponse(profile, { includeSkills: true, includeStats: true });
};

const updateMyProfile = async (userId, payload) => {
  const allowedFields = {
    firstName: "first_name",
    lastName: "last_name",
    bio: "bio",
    department: "department",
    academicYear: "academic_year"
  };

  const updates = {};
  for (const [key, target] of Object.entries(allowedFields)) {
    if (payload[key] !== undefined) {
      updates[target] = payload[key];
    }
  }

  const updated = await profileRepository.updateById(userId, updates);
  if (!updated) {
    throw new HttpError(404, "RESOURCE_NOT_FOUND", "Profile not found");
  }

  return toProfileResponse(updated, { includeSkills: true, includeStats: true });
};

const getPeerProfile = async (currentUser, targetUserId) => {
  const profile = await profileRepository.findById(targetUserId);
  if (!profile) {
    throw new HttpError(404, "RESOURCE_NOT_FOUND", "User not found");
  }

  if (profile.institution_id !== currentUser.institutionId) {
    throw new HttpError(403, "FORBIDDEN", "Cannot view profiles outside your institution");
  }

  if (profile.status !== "ACTIVE") {
    throw new HttpError(404, "RESOURCE_NOT_FOUND", "User not found");
  }

  const skills = await buildSkillsArray(profile.id);
  const stats = await sessionRepository.getUserReviewStats(profile.id);
  const recentReviews = await sessionRepository.getRecentReviews(profile.id, 5);
  const reviewsWithReviewers = await Promise.all(recentReviews.map(async review => {
    const reviewer = review.reviewer_id
      ? await profileRepository.findById(review.reviewer_id)
      : null;
    return {
      rating: review.rating,
      comment: review.comment,
      createdAt: review.created_at,
      reviewer: reviewer ? {
        id: reviewer.id,
        name: `${reviewer.first_name} ${reviewer.last_name}`
      } : null
    };
  }));

  return {
    id: profile.id,
    firstName: profile.first_name,
    lastName: profile.last_name,
    bio: profile.bio,
    department: profile.department,
    academicYear: profile.academic_year,
    avatarUrl: profile.avatar_url || null,
    averageRating: stats.averageRating,
    totalReviews: stats.totalReviews,
    skills,
    recentReviews: reviewsWithReviewers
  };
};

module.exports = {
  getMyProfile,
  updateMyProfile,
  getPeerProfile
};
