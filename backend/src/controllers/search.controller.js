const searchService = require("../services/search.service");

const search = async (req, res, next) => {
  try {
    const result = await searchService.searchStudents({
      currentUser: req.user,
      skillId: req.query.skillId,
      unitId: req.query.unitId,
      level: req.query.level,
      page: req.query.page,
      limit: req.query.limit
    });

    res.status(200).json({ data: result.data, meta: result.meta });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  search
};
