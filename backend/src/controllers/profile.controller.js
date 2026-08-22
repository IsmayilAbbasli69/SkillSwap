const profileService = require("../services/profile.service");

const getMe = async (req, res, next) => {
  try {
    const data = await profileService.getMyProfile(req.user.id);
    res.status(200).json({ data });
  } catch (error) {
    next(error);
  }
};

const patchMe = async (req, res, next) => {
  try {
    const data = await profileService.updateMyProfile(req.user.id, req.body || {});
    res.status(200).json({ data });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMe,
  patchMe
};
