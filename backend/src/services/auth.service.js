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

  if (env.authMode === "supabase") {
    const { getSupabaseClient, isSupabaseConfigured } = require("../config/supabase");
    if (!isSupabaseConfigured()) throw new HttpError(500, "CONFIG_ERROR", "Supabase authentication is not configured");
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.auth.signUp({ email: payload.email, password: payload.password });
    if (error) {
      const duplicate = /already|registered/i.test(error.message || "");
      const rateLimited = error.status === 429 || /rate.?limit|too many/i.test(error.message || "");
      throw new HttpError(
        duplicate ? 409 : rateLimited ? 429 : 502,
        duplicate ? "CONFLICT" : rateLimited ? "AUTH_RATE_LIMITED" : "AUTH_PROVIDER_ERROR",
        duplicate ? "User already exists" : error.message || "Authentication provider failed"
      );
    }
    if (!data.user) throw new HttpError(502, "AUTH_PROVIDER_ERROR", "Authentication provider did not create a user");
    try {
      await profileRepository.create({ id: data.user.id, institutionId, unitId: payload.unitId || null, firstName: payload.firstName, lastName: payload.lastName, bio: payload.bio || "", department: payload.department || null, academicYear: payload.academicYear || null, role: "STUDENT", status: "ACTIVE" });
    } catch (error) {
      if (env.supabaseServiceRoleKey) await supabase.auth.admin.deleteUser(data.user.id);
      throw error;
    }
    return {
      user: { id: data.user.id, email: data.user.email },
      session: data.session ? { accessToken: data.session.access_token, expiresAt: data.session.expires_at } : null,
      requiresEmailConfirmation: !data.session
    };
  }

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

  if (env.authMode === "supabase") {
    const { getSupabaseClient, isSupabaseConfigured } = require("../config/supabase");
    if (!isSupabaseConfigured()) throw new HttpError(500, "CONFIG_ERROR", "Supabase authentication is not configured");
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email: payload.email, password: payload.password });
    if (error || !data.user || !data.session) throw new HttpError(401, "UNAUTHORIZED", "Invalid credentials");
    const profile = await profileRepository.findById(data.user.id);
    if (!profile) throw new HttpError(404, "RESOURCE_NOT_FOUND", "No application profile found for this account");
    if (profile.status !== "ACTIVE") throw new HttpError(403, "FORBIDDEN", "Account is disabled");
    return { user: { id: data.user.id, email: data.user.email }, session: { accessToken: data.session.access_token, expiresAt: data.session.expires_at } };
  }

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
