const jwt = require("jsonwebtoken");
const env = require("../config/env");
const profileRepository = require("../repositories/profile.repository");
const HttpError = require("../utils/http-error");

const authMiddleware = async (req, _res, next) => {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7).trim()
      : "";

    if (!token) {
      throw new HttpError(401, "UNAUTHORIZED", "Missing bearer token");
    }

    let userId = token;

    if (env.authMode === "local") {
      try {
        const decoded = jwt.verify(token, env.jwtSecret || "default_secret");
        userId = decoded.sub;
      } catch (err) {
        throw new HttpError(401, "UNAUTHORIZED", "Invalid token");
      }
    } else if (env.authMode === "supabase") {
      const { getSupabaseClient, isSupabaseConfigured } = require("../config/supabase");
      if (!isSupabaseConfigured()) {
        throw new HttpError(
          500,
          "CONFIG_ERROR",
          "Supabase is not configured."
        );
      }
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.auth.getUser(token);
      if (error || !data.user) {
        throw new HttpError(401, "UNAUTHORIZED", "Invalid token");
      }
      userId = data.user.id;
    } else {
      throw new HttpError(500, "CONFIG_ERROR", `Unsupported AUTH_MODE: ${env.authMode}`);
    }

    const profile = await profileRepository.findById(userId);
    if (!profile) {
      throw new HttpError(401, "UNAUTHORIZED", "Invalid token");
    }

    if (profile.status !== "ACTIVE") {
      throw new HttpError(403, "FORBIDDEN", "Account is disabled");
    }

    req.user = {
      id: profile.id,
      institutionId: profile.institution_id,
      unitId: profile.unit_id,
      role: profile.role,
      status: profile.status
    };

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = authMiddleware;
