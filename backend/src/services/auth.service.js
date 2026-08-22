const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { randomUUID } = require("crypto");
const env = require("../config/env");
const profileRepository = require("../repositories/profile.repository");
const adminRepository = require("../repositories/admin.repository");
const userRepository = require("../repositories/user.repository");
const { ensureRequired, ensureUuid } = require("../utils/validators");
const HttpError = require("../utils/http-error");

const DEFAULT_INSTITUTION_ID = "11111111-1111-4111-8111-111111111111";

const validateInstitutionAndUnit = async ({ institutionId, unitId }) => {
  const targetInstId = institutionId || DEFAULT_INSTITUTION_ID;
  ensureUuid(targetInstId, "institutionId");

  let institution = await adminRepository.getInstitutionById(targetInstId);
  if (!institution) {
    institution = await adminRepository.createInstitution({
      id: targetInstId,
      name: "Default University",
      type: "UNIVERSITY",
      status: "ACTIVE"
    });
  }

  if (unitId) {
    ensureUuid(unitId, "unitId");
    const units = await adminRepository.listUnitsByInstitutionId(targetInstId);
    const validUnit = units.some(unit => unit.id === unitId);
    if (!validUnit) {
      await adminRepository.createInstitutionUnit({
        id: unitId,
        institution_id: targetInstId,
        name: "Default Department"
      });
    }
  }

  return targetInstId;
};

const generateToken = userId => {
  return jwt.sign({ sub: userId }, env.jwtSecret || "default_secret", {
    expiresIn: env.jwtExpiresIn || "1h"
  });
};

const signup = async payload => {
  ensureRequired(payload.email, "email");
  ensureRequired(payload.password, "password");
  ensureRequired(payload.firstName, "firstName");
  ensureRequired(payload.lastName, "lastName");

  if (String(payload.password).length < 8) {
    throw new HttpError(422, "VALIDATION_ERROR", "password must be at least 8 characters");
  }

  const institutionId = await validateInstitutionAndUnit({
    institutionId: payload.institutionId,
    unitId: payload.unitId
  });

  const existingUser = await userRepository.findByEmail(payload.email);
  if (existingUser) {
    throw new HttpError(409, "CONFLICT", "User already exists");
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(payload.password, salt);
  const userId = randomUUID();

  await userRepository.create({
    id: userId,
    email: payload.email,
    passwordHash
  });

  await profileRepository.create({
    id: userId,
    institutionId,
    unitId: payload.unitId || null,
    firstName: payload.firstName,
    lastName: payload.lastName,
    bio: payload.bio || "",
    department: payload.department || null,
    academicYear: payload.academicYear || null,
    role: "STUDENT",
    status: "ACTIVE"
  });

  const accessToken = generateToken(userId);

  return {
    user: {
      id: userId,
      email: payload.email
    },
    session: {
      accessToken,
      expiresAt: Math.floor(Date.now() / 1000) + 3600 // approximate 1h
    },
    requiresEmailConfirmation: false
  };
};

const login = async payload => {
  ensureRequired(payload.email, "email");
  ensureRequired(payload.password, "password");

  const user = await userRepository.findByEmail(payload.email);
  if (!user) {
    throw new HttpError(401, "UNAUTHORIZED", "Invalid credentials");
  }

  const isMatch = await bcrypt.compare(payload.password, user.password_hash);
  if (!isMatch) {
    throw new HttpError(401, "UNAUTHORIZED", "Invalid credentials");
  }

  const profile = await profileRepository.findById(user.id);
  if (!profile) {
    throw new HttpError(
      404,
      "RESOURCE_NOT_FOUND",
      "No application profile found for this account"
    );
  }

  if (profile.status !== "ACTIVE") {
    throw new HttpError(403, "FORBIDDEN", "Account is disabled");
  }

  const accessToken = generateToken(user.id);

  return {
    user: {
      id: user.id,
      email: user.email
    },
    session: {
      accessToken,
      expiresAt: Math.floor(Date.now() / 1000) + 3600 // approximate 1h
    }
  };
};

module.exports = {
  signup,
  login
};