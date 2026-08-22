const HttpError = require("./http-error");

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const ensureRequired = (value, fieldName) => {
  if (value === undefined || value === null || value === "") {
    throw new HttpError(400, "VALIDATION_ERROR", `${fieldName} is required`);
  }
};

const ensureUuid = (value, fieldName) => {
  ensureRequired(value, fieldName);
  if (!UUID_RE.test(value)) {
    throw new HttpError(422, "VALIDATION_ERROR", `${fieldName} must be a valid UUID`);
  }
};

const ensureEnum = (value, fieldName, allowed) => {
  if (!allowed.includes(value)) {
    throw new HttpError(
      422,
      "VALIDATION_ERROR",
      `${fieldName} must be one of: ${allowed.join(", ")}`
    );
  }
};

module.exports = {
  ensureRequired,
  ensureUuid,
  ensureEnum
};
