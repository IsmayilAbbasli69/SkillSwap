const HttpError = require("../utils/http-error");

const requireRole = (...roles) => (req, _res, next) => {
  if (!req.user) {
    return next(new HttpError(401, "UNAUTHORIZED", "Authentication required"));
  }

  if (!roles.includes(req.user.role)) {
    return next(new HttpError(403, "FORBIDDEN", "Insufficient permissions"));
  }

  next();
};

module.exports = requireRole;
