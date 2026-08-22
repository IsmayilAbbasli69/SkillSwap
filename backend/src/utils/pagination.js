const toPositiveInt = (value, fallback) => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return fallback;
  }
  return parsed;
};

const buildPagination = ({ page, limit, maxLimit = 50 }) => {
  const safePage = toPositiveInt(page, 1);
  const safeLimit = Math.min(toPositiveInt(limit, 20), maxLimit);
  const offset = (safePage - 1) * safeLimit;

  return {
    page: safePage,
    limit: safeLimit,
    offset
  };
};

const paginateArray = ({ items, page, limit }) => {
  const total = items.length;
  const start = (page - 1) * limit;
  const end = start + limit;

  return {
    data: items.slice(start, end),
    meta: { page, limit, total }
  };
};

module.exports = {
  buildPagination,
  paginateArray
};
