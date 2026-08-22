const sessionService = require("../services/session.service");

const createForRequest = async (req, res, next) => {
  try {
    const data = await sessionService.createSession({
      currentUser: req.user,
      requestId: req.params.requestId,
      payload: req.body || {}
    });
    res.status(201).json({ data });
  } catch (error) {
    next(error);
  }
};

const list = async (req, res, next) => {
  try {
    const data = await sessionService.listSessions({
      currentUser: req.user,
      query: req.query
    });
    res.status(200).json({ data });
  } catch (error) {
    next(error);
  }
};

const patchStatus = async (req, res, next) => {
  try {
    const data = await sessionService.updateSessionStatus({
      currentUser: req.user,
      sessionId: req.params.id,
      payload: req.body || {}
    });
    res.status(200).json({ data });
  } catch (error) {
    next(error);
  }
};

const createReview = async (req, res, next) => {
  try {
    const data = await sessionService.createReview({
      currentUser: req.user,
      sessionId: req.params.sessionId,
      payload: req.body || {}
    });
    res.status(201).json({ data });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createForRequest,
  list,
  patchStatus,
  createReview
};
