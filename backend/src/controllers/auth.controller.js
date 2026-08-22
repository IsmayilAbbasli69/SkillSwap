const authService = require("../services/auth.service");

const signup = async (req, res, next) => {
  try {
    const data = await authService.signup(req.body || {});
    res.status(201).json({ data });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const data = await authService.login(req.body || {});
    res.status(200).json({ data });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  signup,
  login
};