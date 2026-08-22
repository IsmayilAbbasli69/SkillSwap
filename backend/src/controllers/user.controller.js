const profileService = require("../services/profile.service");
const { ensureUuid } = require("../utils/validators");

const getUser = async (req, res, next) => {
  try {
    ensureUuid(req.params.userId, "userId");
    const data = await profileService.getPeerProfile(req.user, req.params.userId);
    res.status(200).json({ data });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUser
};
