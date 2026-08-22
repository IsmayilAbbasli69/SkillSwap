const requestService = require("../services/request.service");

const create = async (req, res, next) => {
  try {
    const data = await requestService.createRequest({
      currentUser: req.user,
      payload: req.body || {}
    });
    res.status(201).json({ data });
  } catch (error) {
    next(error);
  }
};

const list = async (req, res, next) => {
  try {
    const data = await requestService.listRequests({
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
    const data = await requestService.updateRequestStatus({
      currentUser: req.user,
      requestId: req.params.id,
      payload: req.body || {}
    });

    res.status(200).json({ data });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  create,
  list,
  patchStatus
};
