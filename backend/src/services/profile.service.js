const profileRepository = require("../repositories/profile.repository");
const adminRepository = require("../repositories/admin.repository");
const HttpError = require("../utils/http-error");

const toProfileResponse = async profile => {
  const institution = await adminRepository.getInstitutionById(profile.institution_id);
  const units = await adminRepository.listUnitsByInstitutionId(profile.institution_id);
  const unit = units.find(item => item.id === profile.unit_id) || null;

  return {
    id: profile.id,
    firstName: profile.first_name,
    lastName: profile.last_name,
    bio: profile.bio,
    department: profile.department,
    academicYear: profile.academic_year,
    role: profile.role,
    status: profile.status,
    institution: institution
      ? {
          id: institution.id,
          name: institution.name
        }
      : null,
    unit: unit
      ? {
          id: unit.id,
          name: unit.name
        }
      : null
  };
};

const getMyProfile = async userId => {
  const profile = await profileRepository.findById(userId);
  if (!profile) {
    throw new HttpError(404, "RESOURCE_NOT_FOUND", "Profile not found");
  }

  return toProfileResponse(profile);
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

  return toProfileResponse(updated);
};

module.exports = {
  getMyProfile,
  updateMyProfile
};
